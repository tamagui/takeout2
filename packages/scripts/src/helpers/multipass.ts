import fs from 'node:fs'

import { sleep } from '@take-out/helpers'

import { run } from './run'

export interface MultipassConfig {
  vmName: string
  sshKeyPath: string
}

export function createMultipassConfig(
  name: string,
  sshKeyPath?: string
): MultipassConfig {
  return {
    vmName: name,
    sshKeyPath: sshKeyPath || `${process.env.HOME}/.ssh/${name}`,
  }
}

export async function checkMultipass(): Promise<void> {
  try {
    await run('multipass --version', { silent: true })
    console.info('✅ multipass installed')
  } catch {
    throw new Error('multipass not found - install: brew install multipass')
  }
}

export async function getVMIP(config: MultipassConfig): Promise<string | null> {
  try {
    const { stdout } = await run(`multipass info ${config.vmName} --format json`, {
      silent: true,
      captureOutput: true,
    })
    const data = JSON.parse(stdout)
    return data.info[config.vmName]?.ipv4?.[0] || null
  } catch {
    return null
  }
}

export async function vmExists(config: MultipassConfig): Promise<boolean> {
  try {
    const { stdout } = await run('multipass list', { silent: true, captureOutput: true })
    return stdout.includes(config.vmName)
  } catch {
    return false
  }
}

export async function createVM(config: MultipassConfig): Promise<void> {
  console.info('\n🖥️  creating multipass vm...\n')

  if (await vmExists(config)) {
    console.info(`✅ vm '${config.vmName}' already exists`)
    return
  }

  const cloudInit = `#cloud-config
package_update: true
package_upgrade: true
packages:
  - curl
`

  const cloudInitPath = `${process.cwd()}/.cloud-init.yml`
  fs.writeFileSync(cloudInitPath, cloudInit)

  try {
    await run(
      `multipass launch --name ${config.vmName} --cpus 4 --memory 4G --disk 20G --cloud-init ${cloudInitPath}`
    )
  } finally {
    await run(`rm -f ${cloudInitPath}`, { silent: true })
  }

  console.info('\n⏳ waiting for vm to be ready...')

  let attempts = 0
  while (attempts < 30) {
    try {
      const { stdout } = await run(`multipass info ${config.vmName} --format json`, {
        silent: true,
        captureOutput: true,
      })
      const data = JSON.parse(stdout)
      if (data.info[config.vmName]?.state === 'Running') {
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
    await run(`multipass exec ${config.vmName} -- timeout 300 cloud-init status --wait`)
    console.info('✅ cloud-init complete')
  } catch {
    console.info('⚠️  cloud-init status check timed out, continuing...')
  }

  console.info('✅ vm ready')
}

export async function setupVMSSH(config: MultipassConfig): Promise<void> {
  console.info('\n🔑 setting up ssh...\n')

  try {
    await run(`test -f ${config.sshKeyPath}`, { silent: true })
    console.info('✅ ssh key exists')
  } catch {
    console.info('generating ssh key...')
    await run(`ssh-keygen -t rsa -b 4096 -f ${config.sshKeyPath} -N ""`, { silent: true })
    console.info('✅ ssh key generated')
  }

  const { stdout: pubKey } = await run(`cat ${config.sshKeyPath}.pub`, {
    silent: true,
    captureOutput: true,
  })
  await run(
    `multipass exec ${config.vmName} -- sh -c 'mkdir -p ~/.ssh && echo "${pubKey.trim()}" >> ~/.ssh/authorized_keys'`
  )
  console.info('✅ ssh key configured')
}

export async function setupPortForward(
  config: MultipassConfig,
  ports: { local: number; containerName: string; containerPort: number }[]
): Promise<void> {
  console.info('\n🌐 setting up port forwarding...\n')

  const ip = await getVMIP(config)
  if (!ip) {
    console.error('❌ could not get vm ip')
    return
  }

  const forwards: string[] = []
  for (const { local, containerName, containerPort } of ports) {
    const { stdout: containerIP } = await run(
      `multipass exec ${config.vmName} -- sudo docker inspect $(multipass exec ${config.vmName} -- sudo docker ps -q -f name=${containerName}) -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}'`,
      { silent: true, captureOutput: true }
    )
    console.info(`${containerName} container: ${containerIP.trim()}:${containerPort}`)
    forwards.push(`-L ${local}:${containerIP.trim()}:${containerPort}`)
  }

  // kill any existing port forwards
  try {
    await run(`pkill -f "ssh.*${config.vmName}"`, { silent: true })
  } catch {
    // ignore if none found
  }

  for (const { local, containerName, containerPort } of ports) {
    console.info(`forwarding localhost:${local} -> ${containerName}:${containerPort}`)
  }

  await run(
    `ssh -i ${config.sshKeyPath} -o StrictHostKeyChecking=no -f -N ${forwards.join(' ')} ubuntu@${ip}`,
    { silent: true }
  )

  console.info('✅ port forwarding active')
}
