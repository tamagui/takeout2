import { writeFileSync } from 'node:fs'

import { exec } from './exec'

const VM_NAME = 'takeout-deploy'
const VM_SSH_KEY_PATH = `${process.env.HOME}/.ssh/takeout_deploy`

export function getVMName() {
  return VM_NAME
}

export function getVMSSHKey() {
  return VM_SSH_KEY_PATH
}

export function checkMultipass() {
  try {
    exec('multipass --version', { silent: true })
    console.info('✅ multipass installed')
  } catch {
    console.error('❌ multipass not found')
    console.error('\ninstall: brew install multipass')
    process.exit(1)
  }
}

export function getVMIP(): string | null {
  try {
    const info = exec(`multipass info ${VM_NAME} --format json`, { silent: true })
    const data = JSON.parse(info)
    return data.info[VM_NAME]?.ipv4?.[0] || null
  } catch {
    return null
  }
}

export function vmExists(): boolean {
  try {
    const list = exec('multipass list', { silent: true })
    return list.includes(VM_NAME)
  } catch {
    return false
  }
}

export function createVM() {
  console.info('\n🖥️  creating multipass vm...\n')

  if (vmExists()) {
    console.info(`✅ vm '${VM_NAME}' already exists`)
    return
  }

  // cloud-init - minimal setup, uncloud will install docker
  const cloudInit = `#cloud-config
package_update: true
package_upgrade: true
packages:
  - curl
`

  const cloudInitPath = `${process.cwd()}/.cloud-init.yml`
  writeFileSync(cloudInitPath, cloudInit)

  try {
    exec(
      `multipass launch --name ${VM_NAME} --cpus 4 --memory 4G --disk 20G --cloud-init ${cloudInitPath}`
    )
  } finally {
    exec(`rm -f ${cloudInitPath}`, { silent: true })
  }

  console.info('\n⏳ waiting for vm to be ready...')

  // wait for vm to be fully running
  let attempts = 0
  while (attempts < 30) {
    try {
      const status = exec(`multipass info ${VM_NAME} --format json`, { silent: true })
      const data = JSON.parse(status)
      if (data.info[VM_NAME]?.state === 'Running') {
        break
      }
    } catch {
      // vm not ready yet
    }
    exec('sleep 2', { silent: true })
    attempts++
  }

  // wait for cloud-init
  console.info('waiting for cloud-init to complete...')
  exec('sleep 10', { silent: true })

  try {
    exec(`multipass exec ${VM_NAME} -- timeout 300 cloud-init status --wait`)
    console.info('✅ cloud-init complete')
  } catch {
    console.info('⚠️  cloud-init status check timed out, continuing...')
  }

  console.info('✅ vm ready')
}

export function setupVMSSH() {
  console.info('\n🔑 setting up ssh...\n')

  // generate ssh key if needed
  try {
    exec(`test -f ${VM_SSH_KEY_PATH}`, { silent: true })
    console.info('✅ ssh key exists')
  } catch {
    console.info('generating ssh key...')
    exec(`ssh-keygen -t rsa -b 4096 -f ${VM_SSH_KEY_PATH} -N ""`, { silent: true })
    console.info('✅ ssh key generated')
  }

  // add key to vm
  const pubKey = exec(`cat ${VM_SSH_KEY_PATH}.pub`, { silent: true }).trim()
  exec(
    `multipass exec ${VM_NAME} -- sh -c 'mkdir -p ~/.ssh && echo "${pubKey}" >> ~/.ssh/authorized_keys'`
  )
  console.info('✅ ssh key configured')
}

export function setupPortForward() {
  console.info('\n🌐 setting up port forwarding...\n')

  const ip = getVMIP()
  if (!ip) {
    console.error('❌ could not get vm ip')
    return
  }

  // get container IPs from uncloud network
  console.info('getting container IPs...')
  const webIP = exec(
    `multipass exec ${VM_NAME} -- sudo docker inspect $(multipass exec ${VM_NAME} -- sudo docker ps -q -f name=web) -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}'`,
    { silent: true }
  ).trim()

  const zeroIP = exec(
    `multipass exec ${VM_NAME} -- sudo docker inspect $(multipass exec ${VM_NAME} -- sudo docker ps -q -f name=zero) -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}'`,
    { silent: true }
  ).trim()

  console.info(`web container: ${webIP}:8081`)
  console.info(`zero container: ${zeroIP}:4848`)

  // kill any existing port forwards
  try {
    exec(`pkill -f "ssh.*${VM_NAME}"`, { silent: true })
  } catch {
    // ignore if none found
  }

  // forward to container IPs in uncloud network
  console.info('\nforwarding localhost:8081 -> web container')
  console.info('forwarding localhost:4848 -> zero container')

  exec(
    `ssh -i ${VM_SSH_KEY_PATH} -o StrictHostKeyChecking=no -f -N -L 8081:${webIP}:8081 -L 4848:${zeroIP}:4848 ubuntu@${ip}`,
    { silent: true }
  )

  console.info('✅ port forwarding active')
}

export function showLocalStatus() {
  const ip = getVMIP()

  console.info('\n🎉 deployment ready!')
  console.info('\naccess your app:')
  console.info('  web app:     http://localhost:8081')
  console.info('  zero sync:   http://localhost:4848')
  if (ip) {
    console.info(`  vm ip:       ${ip}`)
  }
  console.info('\nuseful commands:')
  console.info('  uc ls                       # list services')
  console.info('  uc logs web                 # view web logs')
  console.info('  uc logs web -f              # follow web logs')
  console.info(`  multipass shell ${VM_NAME}  # ssh to vm`)
  console.info('\nto redeploy after changes:')
  console.info('  bun run web build && bun scripts/uncloud/deploy-local.ts')
}
