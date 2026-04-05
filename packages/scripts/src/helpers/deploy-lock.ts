/**
 * deploy lock helper — prevents concurrent deploys with auto-expiry
 * shared across repos via @take-out/scripts/helpers/deploy-lock
 *
 * uses mkdir for atomic lock acquisition (no race window)
 */

import { run } from './run'

const DEFAULT_LOCK_PATH = '/tmp/deploy.lock'
const DEFAULT_MAX_AGE_MIN = 15

interface DeployLockOptions {
  path?: string
  maxAgeMin?: number
}

export async function acquireDeployLock(
  ssh: string,
  opts?: DeployLockOptions,
): Promise<void> {
  const lockPath = opts?.path || DEFAULT_LOCK_PATH
  const maxAge = opts?.maxAgeMin || DEFAULT_MAX_AGE_MIN

  // mkdir is atomic — if two deploys race, only one succeeds
  const lockCmd = [
    // clean stale locks first
    `find ${lockPath} -maxdepth 0 -mmin +${maxAge} -exec rm -rf {} \\; 2>/dev/null || true`,
    // atomic acquire via mkdir (fails if dir already exists)
    `mkdir ${lockPath} 2>/dev/null && echo "OK" || echo "LOCKED"`,
  ].join('; ')

  const { stdout } = await run(`${ssh} "${lockCmd}"`, {
    captureOutput: true,
    silent: true,
  })
  const result = stdout.trim()

  if (result === 'LOCKED') {
    throw new Error(
      `another deploy is in progress (${lockPath} exists on server). ` +
        `if stale, it will auto-expire after ${maxAge} minutes, ` +
        `or remove manually: ${ssh} "rm -rf ${lockPath}"`,
    )
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
 */
export async function withDeployLock<T>(
  ssh: string,
  fn: () => Promise<T>,
  opts?: DeployLockOptions,
): Promise<T> {
  await acquireDeployLock(ssh, opts)

  let released = false
  const release = async () => {
    if (released) return
    released = true
    await releaseDeployLock(ssh, opts)
  }

  // signal handlers — fire-and-forget release with a safety timeout so the
  // process always exits even if the ssh release hangs
  const signals: NodeJS.Signals[] = ['SIGTERM', 'SIGINT', 'SIGHUP']
  const handlers = new Map<NodeJS.Signals, () => void>()
  for (const sig of signals) {
    const handler = () => {
      const done = release().catch(() => {})
      const timeout = new Promise<void>((r) => setTimeout(r, 5_000))
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
    await release()
  }
}
