import { run } from './run'

export async function checkSSHKey(sshKeyPath: string): Promise<void> {
  try {
    await run(`test -f ${sshKeyPath}`, { silent: true })
    console.info('✅ ssh key exists')
  } catch {
    throw new Error(`ssh key not found: ${sshKeyPath}`)
  }
}

export async function testSSHConnection(host: string, sshKey: string): Promise<void> {
  console.info('\n🔑 testing ssh connection...\n')

  try {
    await run(
      `ssh -i ${sshKey} -o StrictHostKeyChecking=no -o ConnectTimeout=5 ${host} "echo 'SSH connection successful'"`
    )
    console.info('✅ ssh connection verified')
  } catch {
    throw new Error(`cannot connect to ${host} - check ssh key: ${sshKey}`)
  }
}
