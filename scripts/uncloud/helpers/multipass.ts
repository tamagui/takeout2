import { writeFileSync } from 'node:fs'

import { sleep } from '@take-out/helpers'
import { run } from '@take-out/scripts/helpers/run'

const VM_NAME = 'takeout-deploy'
const VM_SSH_KEY_PATH = `${process.env.HOME}/.ssh/takeout_deploy`

export function getVMName(): string {
  return VM_NAME
}

export function getVMSSHKey(): string {
  return VM_SSH_KEY_PATH
}

export async function checkMultipass(): Promise<void> {
  try {
    await run('multipass --version', { silent: true })
    console.info('✅ multipass installed')
  } catch {
    throw new Error('multipass not found - install: brew install multipass')
  }
}

export async function getVMIP(): Promise<string | null> {
  try {
    const { stdout } = await run(`multipass info ${VM_NAME} --format json`, {
      silent: true,
      captureOutput: true,
    })
    const data = JSON.parse(stdout)
    return data.info[VM_NAME]?.ipv4?.[0] || null
  } catch {
    return null
  }
}

export async function vmExists(): Promise<boolean> {
  try {
    const { stdout } = await run('multipass list', { silent: true, captureOutput: true })
    return stdout.includes(VM_NAME)
  } catch {
    return false
  }
}

export async function createVM(): Promise<void> {
  console.info('\n🖥️  creating multipass vm...\n')

  if (await vmExists()) {
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
    await run(
      `multipass launch --name ${VM_NAME} --cpus 4 --memory 4G --disk 20G --cloud-init ${cloudInitPath}`
    )
  } finally {
    await run(`rm -f ${cloudInitPath}`, { silent: true })
  }

  console.info('\n⏳ waiting for vm to be ready...')

  // wait for vm to be fully running
  let attempts = 0
  while (attempts < 30) {
    try {
      const { stdout } = await run(`multipass info ${VM_NAME} --format json`, {
        silent: true,
        captureOutput: true,
      })
      const data = JSON.parse(stdout)
      if (data.info[VM_NAME]?.state === 'Running') {
        break
      }
    } catch {
      // vm not ready yet
    }
    await sleep(2000)
    attempts++
  }

  // wait for cloud-init
  console.info('waiting for cloud-init to complete...')
  await sleep(10000)

  try {
    await run(`multipass exec ${VM_NAME} -- timeout 300 cloud-init status --wait`)
    console.info('✅ cloud-init complete')
  } catch {
    console.info('⚠️  cloud-init status check timed out, continuing...')
  }

  console.info('✅ vm ready')
}

export async function setupVMSSH(): Promise<void> {
  console.info('\n🔑 setting up ssh...\n')

  // generate ssh key if needed
  try {
    await run(`test -f ${VM_SSH_KEY_PATH}`, { silent: true })
    console.info('✅ ssh key exists')
  } catch {
    console.info('generating ssh key...')
    await run(`ssh-keygen -t rsa -b 4096 -f ${VM_SSH_KEY_PATH} -N ""`, { silent: true })
    console.info('✅ ssh key generated')
  }

  // add key to vm
  const { stdout: pubKey } = await run(`cat ${VM_SSH_KEY_PATH}.pub`, {
    silent: true,
    captureOutput: true,
  })
  await run(
    `multipass exec ${VM_NAME} -- sh -c 'mkdir -p ~/.ssh && echo "${pubKey.trim()}" >> ~/.ssh/authorized_keys'`
  )
  console.info('✅ ssh key configured')
}

export async function setupPortForward(): Promise<void> {
  console.info('\n🌐 setting up port forwarding...\n')

  const ip = await getVMIP()
  if (!ip) {
    console.error('❌ could not get vm ip')
    return
  }

  // get container IPs from uncloud network
  console.info('getting container IPs...')
  const { stdout: webIP } = await run(
    `multipass exec ${VM_NAME} -- sudo docker inspect $(multipass exec ${VM_NAME} -- sudo docker ps -q -f name=web) -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}'`,
    { silent: true, captureOutput: true }
  )

  const { stdout: zeroIP } = await run(
    `multipass exec ${VM_NAME} -- sudo docker inspect $(multipass exec ${VM_NAME} -- sudo docker ps -q -f name=zero) -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}'`,
    { silent: true, captureOutput: true }
  )

  console.info(`web container: ${webIP.trim()}:8081`)
  console.info(`zero container: ${zeroIP.trim()}:4848`)

  // kill any existing port forwards
  try {
    await run(`pkill -f "ssh.*${VM_NAME}"`, { silent: true })
  } catch {
    // ignore if none found
  }

  // forward to container IPs in uncloud network
  console.info('\nforwarding localhost:8081 -> web container')
  console.info('forwarding localhost:4848 -> zero container')

  await run(
    `ssh -i ${VM_SSH_KEY_PATH} -o StrictHostKeyChecking=no -f -N -L 8081:${webIP.trim()}:8081 -L 4848:${zeroIP.trim()}:4848 ubuntu@${ip}`,
    { silent: true }
  )

  console.info('✅ port forwarding active')
}

export async function showLocalStatus(): Promise<void> {
  const ip = await getVMIP()

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
