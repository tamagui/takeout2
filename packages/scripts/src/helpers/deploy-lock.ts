/**
 * deploy lock helper — prevents concurrent deploys with auto-expiry
 * shared across repos via @take-out/scripts/helpers/deploy-lock
 *
 * uses mkdir for atomic lock acquisition (no race window).
 * writes a meta.json inside the lock dir so stale locks can self-diagnose:
 * when a deploy dies without releasing, the next deploy prints who left the
 * lock (pid, host, git sha, CI run URL) instead of just a timestamp.
 */

import os from 'node:os'
import { run } from './run'

const DEFAULT_LOCK_PATH = '/tmp/deploy.lock'
const DEFAULT_MAX_AGE_MIN = 15

interface DeployLockOptions {
  path?: string
  maxAgeMin?: number
  /**
   * called before lock release on all exit paths: normal return, thrown
   * error, and signal (SIGTERM/SIGINT/SIGHUP). use this to roll back
   * partial state — e.g. restart a service that was stopped mid-deploy.
   * cleanup errors are logged but do not prevent lock release.
   */
  cleanup?: () => Promise<void>
}

interface LockMeta {
  pid: number
  host: string
  startedAt: string
  gitSha: string
  ciRunId: string
  ciRunUrl: string
  ciWorkflow: string
  ciActor: string
}

function buildMeta(): LockMeta {
  const repo = process.env.GITHUB_REPOSITORY || ''
  const runId = process.env.GITHUB_RUN_ID || ''
  const server = process.env.GITHUB_SERVER_URL || 'https://github.com'
  const ciRunUrl = repo && runId ? `${server}/${repo}/actions/runs/${runId}` : ''
  return {
    pid: process.pid,
    host: os.hostname(),
    startedAt: new Date().toISOString(),
    gitSha:
      process.env.GIT_SHA || process.env.GITHUB_SHA || process.env.CI_COMMIT_SHA || '',
    ciRunId: runId,
    ciRunUrl,
    ciWorkflow: process.env.GITHUB_WORKFLOW || '',
    ciActor: process.env.GITHUB_ACTOR || '',
  }
}

function toBase64(s: string): string {
  return Buffer.from(s, 'utf-8').toString('base64')
}

async function sshBash(ssh: string, script: string, captureOutput = true) {
  // base64-encode the script so we never have to escape quotes, $, backticks,
  // newlines etc. at multiple layers (local bash → ssh → remote bash).
  const b64 = toBase64(script)
  return run(`${ssh} "echo ${b64} | base64 -d | bash"`, {
    captureOutput,
    silent: true,
  })
}

export async function acquireDeployLock(
  ssh: string,
  opts?: DeployLockOptions,
): Promise<void> {
  const lockPath = opts?.path || DEFAULT_LOCK_PATH
  const maxAge = opts?.maxAgeMin || DEFAULT_MAX_AGE_MIN

  // atomic cleanup-and-acquire in one round-trip:
  // 1. if a stale lock exists (older than maxAge), print its metadata so the
  //    caller can log who left it behind, then rm it.
  // 2. try mkdir — atomic; succeeds iff no concurrent deploy holds the lock.
  const acquireScript = `
set -u
LOCK=${lockPath}
MAXAGE=${maxAge}
if [ -d "$LOCK" ]; then
  if [ -n "$(find "$LOCK" -maxdepth 0 -mmin +$MAXAGE 2>/dev/null)" ]; then
    echo "STALE_META_START"
    cat "$LOCK/meta.json" 2>/dev/null || echo "(no metadata file)"
    echo "STALE_META_END"
    rm -rf "$LOCK"
  fi
fi
if mkdir "$LOCK" 2>/dev/null; then
  echo ACQUIRED
else
  echo LOCKED
fi
`

  const { stdout: acquireOut } = await sshBash(ssh, acquireScript)

  // log any stale cleanup so the next deploy's logs show who left it
  const staleMatch = acquireOut.match(/STALE_META_START\n([\s\S]*?)\nSTALE_META_END/)
  if (staleMatch?.[1]) {
    console.warn(`deploy-lock: cleared stale lock (older than ${maxAge}m) left by:`)
    for (const line of staleMatch[1].split('\n')) {
      console.warn(`  ${line}`)
    }
  }

  if (!acquireOut.trim().endsWith('ACQUIRED')) {
    // read the live holder's metadata so the error tells the user exactly
    // which deploy is blocking — not just "a lock file exists".
    const diagScript = `
LOCK=${lockPath}
echo "meta.json:"
cat "$LOCK/meta.json" 2>/dev/null || echo "  (no metadata)"
echo "mtime:"
stat -c "  %y" "$LOCK" 2>/dev/null || echo "  (unknown)"
`
    let heldBy = '(diagnostics unavailable)'
    try {
      const { stdout } = await sshBash(ssh, diagScript)
      heldBy = stdout.trim() || heldBy
    } catch {
      // best-effort
    }

    throw new Error(
      `another deploy is in progress (${lockPath} exists on server)\n` +
        `  held by:\n${heldBy
          .split('\n')
          .map((l) => `    ${l}`)
          .join('\n')}\n` +
        `  will auto-expire after ${maxAge} minutes, or remove manually: ${ssh} "rm -rf ${lockPath}"`,
    )
  }

  // write metadata inside the lock dir (best-effort; lock is already held
  // so metadata failures are non-fatal — they only hurt future diagnostics).
  const meta = buildMeta()
  const metaJson = JSON.stringify(meta, null, 2)
  const writeScript = `
LOCK=${lockPath}
cat > "$LOCK/meta.json" << 'DEPLOY_LOCK_META_EOF'
${metaJson}
DEPLOY_LOCK_META_EOF
`
  try {
    await sshBash(ssh, writeScript, false)
  } catch {
    // non-fatal
  }
}

export async function releaseDeployLock(
  ssh: string,
  opts?: DeployLockOptions,
): Promise<void> {
  const lockPath = opts?.path || DEFAULT_LOCK_PATH
  try {
    await run(`${ssh} "rm -rf ${lockPath}"`, { silent: true })
  } catch {
    // best-effort, lock will auto-expire
  }
}

/**
 * run `fn` with the deploy lock held, releasing on ANY exit path —
 * normal return, thrown error, or process signal (SIGTERM from CI cancel,
 * SIGINT from ctrl-c, SIGHUP from terminal close).
 *
 * prefer this over raw acquire/release: a bare try/finally does NOT catch
 * signals, so a CI-cancelled deploy would leak the lock for 15 minutes and
 * block the next run. this helper installs signal handlers that release
 * before exit, then removes them once `fn` completes.
 *
 * if `opts.cleanup` is provided, it runs before lock release on every exit
 * path. use it to roll back partial deploy state (e.g. restart a stopped
 * service) so a mid-flight crash doesn't leave prod in a broken state.
 */
export async function withDeployLock<T>(
  ssh: string,
  fn: () => Promise<T>,
  opts?: DeployLockOptions,
): Promise<T> {
  await acquireDeployLock(ssh, opts)

  let released = false
  const runCleanupAndRelease = async () => {
    if (released) return
    released = true
    if (opts?.cleanup) {
      try {
        await opts.cleanup()
      } catch (err) {
        console.warn('deploy-lock: cleanup threw (non-fatal):', err)
      }
    }
    await releaseDeployLock(ssh, opts)
  }

  // signal handlers — fire-and-forget cleanup+release with a safety timeout
  // so the process always exits even if ssh hangs. the 15s budget covers
  // user cleanup (e.g. restarting a service) plus the release rm call.
  const signals: NodeJS.Signals[] = ['SIGTERM', 'SIGINT', 'SIGHUP']
  const handlers = new Map<NodeJS.Signals, () => void>()
  for (const sig of signals) {
    const handler = () => {
      const done = runCleanupAndRelease().catch(() => {})
      const timeout = new Promise<void>((r) => setTimeout(r, 15_000))
      Promise.race([done, timeout]).finally(() => {
        process.exit(sig === 'SIGINT' ? 130 : 143)
      })
    }
    handlers.set(sig, handler)
    process.once(sig, handler)
  }

  try {
    return await fn()
  } finally {
    for (const [sig, handler] of handlers) {
      process.off(sig, handler)
    }
    await runCleanupAndRelease()
  }
}
