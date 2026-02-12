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
  opts?: DeployLockOptions
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
        `or remove manually: ${ssh} "rm -rf ${lockPath}"`
    )
  }
}

export async function releaseDeployLock(
  ssh: string,
  opts?: DeployLockOptions
): Promise<void> {
  const lockPath = opts?.path || DEFAULT_LOCK_PATH
  try {
    await run(`${ssh} "rm -rf ${lockPath}"`, { silent: true })
  } catch {
    // best-effort, lock will auto-expire
  }
}
