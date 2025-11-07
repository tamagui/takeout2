#!/usr/bin/env bun

/**
 * deployment script for uncloud
 * supports local (multipass) and production (env-based) deployments
 */

import { execSync } from 'node:child_process'
import { writeFileSync } from 'node:fs'

// local multipass defaults
const VM_NAME = 'takeout-deploy'
const VM_SSH_KEY_PATH = `${process.env.HOME}/.ssh/takeout_deploy`

// production env vars
const DEPLOY_HOST = process.env.DEPLOY_HOST
const DEPLOY_USER = process.env.DEPLOY_USER || 'root'
const DEPLOY_SSH_KEY = process.env.DEPLOY_SSH_KEY || `${process.env.HOME}/.ssh/id_rsa`

function exec(command: string, options?: { silent?: boolean; cwd?: string }): string {
  const { silent = false, cwd = process.cwd() } = options || {}

  if (!silent) {
    console.info(`\n🔧 ${command}`)
  }

  try {
    return execSync(command, {
      stdio: silent ? 'pipe' : 'inherit',
      encoding: 'utf-8',
      cwd,
    })
  } catch (error) {
    if (!silent) {
      console.error(`❌ Command failed: ${command}`)
    }
    throw error
  }
}

function checkPrerequisites(isLocal: boolean) {
  console.info('📋 checking prerequisites...\n')

  if (isLocal) {
    // check multipass for local deployment
    try {
      exec('multipass --version', { silent: true })
      console.info('✅ multipass installed')
    } catch {
      console.error('❌ multipass not found')
      console.error('\ninstall: brew install multipass')
      process.exit(1)
    }
  } else {
    // check production env vars
    if (!DEPLOY_HOST) {
      console.error('❌ DEPLOY_HOST not set')
      console.error('\nset environment variables:')
      console.error('  export DEPLOY_HOST=your-server-ip')
      console.error('  export DEPLOY_USER=root  # optional, defaults to root')
      console.error('  export DEPLOY_SSH_KEY=~/.ssh/id_rsa  # optional')
      process.exit(1)
    }
    console.info(`✅ deploy host: ${DEPLOY_HOST}`)
    console.info(`✅ deploy user: ${DEPLOY_USER}`)
  }

  // check uncloud
  try {
    exec('uc --version', { silent: true })
    console.info('✅ uncloud cli installed')
  } catch {
    console.error('❌ uncloud cli not found')
    console.error('\ninstall: curl -fsS https://get.uncloud.run/install.sh | sh')
    process.exit(1)
  }

  // check dist exists
  try {
    exec('test -d dist', { silent: true })
    console.info('✅ dist/ directory exists')
  } catch {
    console.error('❌ dist/ directory not found')
    console.error('\nbuild first: bun run web build')
    process.exit(1)
  }
}

function getVMIP(): string | null {
  try {
    const info = exec(`multipass info ${VM_NAME} --format json`, { silent: true })
    const data = JSON.parse(info)
    return data.info[VM_NAME]?.ipv4?.[0] || null
  } catch {
    return null
  }
}

function vmExists(): boolean {
  try {
    const list = exec('multipass list', { silent: true })
    return list.includes(VM_NAME)
  } catch {
    return false
  }
}

function createVM() {
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
    // clean up cloud-init file
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

  // give cloud-init a moment to start
  console.info('waiting for cloud-init to complete (this may take a few minutes)...')
  exec('sleep 10', { silent: true })

  // wait for cloud-init with longer timeout
  try {
    exec(`multipass exec ${VM_NAME} -- timeout 300 cloud-init status --wait`)
    console.info('✅ cloud-init complete')
  } catch {
    console.info('⚠️  cloud-init status check timed out')
    console.info('checking logs...')
    try {
      exec(`multipass exec ${VM_NAME} -- tail -n 50 /var/log/cloud-init.log`)
    } catch {
      console.info('could not read cloud-init logs')
    }
  }

  console.info('✅ vm ready')
}

function setupSSH(isLocal: boolean) {
  console.info('\n🔑 setting up ssh...\n')

  const sshKeyPath = isLocal ? VM_SSH_KEY_PATH : DEPLOY_SSH_KEY

  if (isLocal) {
    // generate ssh key for vm if needed
    try {
      exec(`test -f ${sshKeyPath}`, { silent: true })
      console.info('✅ ssh key exists')
    } catch {
      console.info('generating ssh key...')
      exec(`ssh-keygen -t rsa -b 4096 -f ${sshKeyPath} -N ""`, { silent: true })
      console.info('✅ ssh key generated')
    }

    // add key to vm
    const pubKey = exec(`cat ${sshKeyPath}.pub`, { silent: true }).trim()
    exec(
      `multipass exec ${VM_NAME} -- sh -c 'echo "${pubKey}" >> ~/.ssh/authorized_keys'`
    )
    console.info('✅ ssh key configured')
  } else {
    // verify ssh key exists for production
    try {
      exec(`test -f ${sshKeyPath}`, { silent: true })
      console.info('✅ ssh key exists')
    } catch {
      console.error(`❌ ssh key not found: ${sshKeyPath}`)
      process.exit(1)
    }
  }
}

function initUncloud(isLocal: boolean) {
  console.info('\n🚀 initializing uncloud...\n')

  let host: string
  let sshKey: string

  if (isLocal) {
    const ip = getVMIP()
    if (!ip) {
      console.error('❌ could not get vm ip')
      process.exit(1)
    }
    host = `ubuntu@${ip}`
    sshKey = VM_SSH_KEY_PATH
    console.info(`vm ip: ${ip}`)
  } else {
    host = `${DEPLOY_USER}@${DEPLOY_HOST}`
    sshKey = DEPLOY_SSH_KEY
    console.info(`production host: ${DEPLOY_HOST}`)
  }

  // check if already initialized
  try {
    exec(`ssh -i ${sshKey} -o StrictHostKeyChecking=no ${host} "which uncloud"`, {
      silent: true,
    })
    console.info('✅ uncloud already initialized')

    // for local, release the domain since we're behind NAT
    if (isLocal) {
      console.info('releasing uncloud domain (not needed for local)...')
      try {
        exec('uc dns release', { silent: true })
      } catch {
        // ignore if no domain to release
      }
    }
    return
  } catch {
    // not initialized, continue
  }

  // for local deployments, skip dns and caddy (not needed behind NAT)
  const flags = isLocal ? '--no-dns --no-caddy' : ''

  // pipe 'y' to auto-reset if machine is already initialized
  exec(`echo "y" | uc machine init ${host} -i ${sshKey} ${flags}`)

  console.info('✅ uncloud initialized')
}

function buildImage() {
  console.info('\n🏗️  building docker image...\n')

  exec('docker build -t takeout-web:latest .')
  console.info('✅ image built')
}

function pushImage(isLocal: boolean) {
  console.info('\n📤 pushing image to cluster...\n')

  exec('uc image push takeout-web:latest')
  console.info('✅ image pushed')
}

function deploy(isLocal: boolean) {
  console.info('\n📦 deploying stack...\n')

  // use single uncloud compose file for both local and production
  exec('uc deploy -f src/uncloud/docker-compose.yml --yes')

  console.info('\n✅ deployment complete!')
}

function setupPortForward(isLocal: boolean) {
  if (!isLocal) {
    // no port forwarding needed for production
    return
  }

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

  console.info(`web container: ${webIP}:3533`)
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
    `ssh -i ${VM_SSH_KEY_PATH} -o StrictHostKeyChecking=no -f -N -L 8081:${webIP}:3533 -L 4848:${zeroIP}:4848 ubuntu@${ip}`,
    { silent: true }
  )

  console.info('✅ port forwarding active')
}

function showStatus(isLocal: boolean) {
  console.info('\n📊 deployment status:\n')

  try {
    exec('uc ls')
  } catch {
    console.error('could not fetch status')
  }

  console.info('\n🎉 deployment ready!')

  if (isLocal) {
    const ip = getVMIP()
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
    console.info('  bun run web build && bun run deploy:local')
  } else {
    console.info('\naccess your app:')
    console.info(`  web app:     http://${DEPLOY_HOST}:3533`)
    console.info(`  zero sync:   http://${DEPLOY_HOST}:4848`)
    console.info(`  ssh:         ssh ${DEPLOY_USER}@${DEPLOY_HOST}`)
    console.info('\nuseful commands:')
    console.info('  uc ls                    # list services')
    console.info('  uc logs web              # view web logs')
    console.info('  uc logs web -f           # follow web logs')
    console.info(`  ssh ${DEPLOY_USER}@${DEPLOY_HOST}  # ssh to server`)
    console.info('\nto redeploy after changes:')
    console.info('  bun run web build && bun run deploy')
    console.info('\nconfigure custom domain:')
    console.info('  point your domain A record to: ' + DEPLOY_HOST)
    console.info('  uncloud handles https automatically')
  }
}

async function main() {
  const args = process.argv.slice(2)
  const isLocal = args.includes('--local')

  if (isLocal) {
    console.info('🎯 deploying takeout to local multipass vm\n')
  } else {
    console.info('🎯 deploying takeout to production server\n')
  }

  checkPrerequisites(isLocal)

  if (isLocal) {
    createVM()
  }

  setupSSH(isLocal)
  initUncloud(isLocal)
  buildImage()
  pushImage(isLocal)
  deploy(isLocal)
  setupPortForward(isLocal)
  showStatus(isLocal)
}

main().catch((error) => {
  console.error('\n💥 deployment failed:', error.message)
  process.exit(1)
})
