import { run } from './run'

export async function checkSSHKey(sshKeyPath: string): Promise<void> {
  try {
    await run(`test -f ${sshKeyPath}`, { silent: true })
    console.info('✅ ssh key exists')
  } catch {
    throw new Error(`ssh key not found: ${sshKeyPath}`)
  }
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function testSSHConnection(
  host: string,
  sshKey: string,
  options?: { retries?: number; retryDelayMs?: number }
): Promise<void> {
  const maxRetries = options?.retries ?? 3
  const retryDelay = options?.retryDelayMs ?? 5000

  console.info('\n🔑 testing ssh connection...\n')

  let lastError: Error | null = null

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await run(
        `ssh -i ${sshKey} -o StrictHostKeyChecking=no -o ConnectTimeout=10 ${host} "echo 'SSH connection successful'"`,
        { silent: attempt > 1 }
      )
      console.info('✅ ssh connection verified')
      return
    } catch (err) {
      lastError = err as Error
      if (attempt < maxRetries) {
        console.info(
          `  ssh attempt ${attempt}/${maxRetries} failed, retrying in ${retryDelay / 1000}s...`
        )
        await sleep(retryDelay)
      }
    }
  }

  throw new Error(
    `cannot connect to ${host} after ${maxRetries} attempts - check ssh key: ${sshKey}`
  )
}
