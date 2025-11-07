import { exec } from './exec'

export function checkSSHKey(sshKeyPath: string) {
  try {
    exec(`test -f ${sshKeyPath}`, { silent: true })
    console.info('✅ ssh key exists')
  } catch {
    console.error(`❌ ssh key not found: ${sshKeyPath}`)
    process.exit(1)
  }
}

export function testSSHConnection(host: string, sshKey: string) {
  console.info('\n🔑 testing ssh connection...\n')

  try {
    exec(
      `ssh -i ${sshKey} -o StrictHostKeyChecking=no -o ConnectTimeout=5 ${host} "echo 'SSH connection successful'"`
    )
    console.info('✅ ssh connection verified')
  } catch {
    console.error(`❌ cannot connect to ${host}`)
    console.error('\ncheck:')
    console.error(`  - ssh key: ${sshKey}`)
    console.error(`  - host: ${host}`)
    process.exit(1)
  }
}
