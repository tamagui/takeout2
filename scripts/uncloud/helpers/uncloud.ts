import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

import { exec } from './exec'

const UNCLOUD_VERSION = '0.15.0'

export function checkUncloudCLI() {
  try {
    const version = exec('uc --version', { silent: true }).trim()
    console.info(`✅ uncloud cli installed (${version})`)
  } catch {
    console.error('❌ uncloud cli not found')
    console.error(
      `\ninstall: curl -fsS https://get.uncloud.run/install.sh | sh -s -- --version ${UNCLOUD_VERSION}`
    )
    process.exit(1)
  }
}

export function getConnectionFlag(): string {
  // no longer using --connect flag, we create config directly
  return ''
}

function createUncloudConfig(host: string, sshKey: string) {
  const configDir = join(homedir(), '.config', 'uncloud')
  const configPath = join(configDir, 'config.yaml')

  if (!existsSync(configDir)) {
    mkdirSync(configDir, { recursive: true })
  }

  // simple yaml config that points to the existing cluster
  const config = `current_context: default
contexts:
  default:
    connections:
      - ssh: ${host}
        ssh_key_file: ${sshKey}
`

  writeFileSync(configPath, config)
  console.info(`✅ created uncloud config at ${configPath}`)
}

export function initUncloud(
  host: string,
  sshKey: string,
  options: { noDNS?: boolean; noCaddy?: boolean } = {}
) {
  console.info('\n🚀 initializing uncloud...\n')

  // first check if we already have local context that works
  try {
    exec('uc ls', { silent: true })
    console.info('✅ local cluster context exists and connected')
    return
  } catch {
    // no local context - check if server has uncloud running
  }

  const sshCmd = `ssh -i ${sshKey} -o StrictHostKeyChecking=no ${host}`

  // check if server already has uncloud daemon running
  let serverHasUncloud = false
  try {
    exec(`${sshCmd} "systemctl is-active uncloud.service"`, { silent: true })
    serverHasUncloud = true
    console.info('✅ server has uncloud daemon running')
  } catch {
    // check if uncloudd binary exists as fallback
    try {
      exec(`${sshCmd} "test -f /usr/local/bin/uncloudd"`, { silent: true })
      serverHasUncloud = true
      console.info('✅ server has uncloud installed')
    } catch {
      // server doesn't have uncloud - needs fresh init
    }
  }

  if (serverHasUncloud) {
    // server already has cluster - create config manually to avoid reset prompt
    createUncloudConfig(host, sshKey)
    console.info('   (skipping init to avoid cluster reset)')
    return
  }

  // fresh server - need to initialize
  console.info('📦 uncloud not installed on server - initializing...')

  const flags = []
  if (options.noDNS) flags.push('--no-dns')
  if (options.noCaddy) flags.push('--no-caddy')
  const flagStr = flags.join(' ')

  exec(`echo "y" | uc machine init ${host} -i ${sshKey} ${flagStr}`)

  console.info('✅ uncloud initialized')
}

export function pushImage(imageName = 'takeout-web:latest') {
  console.info('\n📤 pushing image to cluster...\n')

  exec(`uc image push ${imageName}`)
  console.info('✅ image pushed')
}

export function deployStack(composeFile: string, profile?: string) {
  console.info('\n📦 deploying stack...\n')

  const profileFlag = profile ? `--profile ${profile}` : ''
  exec(`uc deploy -f ${composeFile} ${profileFlag} --yes`)

  console.info('\n✅ deployment complete!')
}

export function showStatus() {
  console.info('\n📊 deployment status:\n')

  try {
    exec('uc ls')
  } catch {
    console.error('could not fetch status')
  }
}

export function showContainers() {
  console.info('\n📦 container status:\n')

  try {
    exec('uc ps')
  } catch {
    console.error('could not fetch container status')
  }
}

export function startService(service?: string) {
  const target = service || 'all services'
  console.info(`\n▶️  starting ${target}...\n`)

  try {
    exec(`uc start${service ? ` ${service}` : ''}`)
    console.info(`✅ ${target} started`)
  } catch {
    console.error(`❌ failed to start ${target}`)
    throw new Error(`failed to start ${target}`)
  }
}

export function stopService(service?: string) {
  const target = service || 'all services'
  console.info(`\n⏹️  stopping ${target}...\n`)

  try {
    exec(`uc stop${service ? ` ${service}` : ''}`)
    console.info(`✅ ${target} stopped`)
  } catch {
    console.error(`❌ failed to stop ${target}`)
    throw new Error(`failed to stop ${target}`)
  }
}
