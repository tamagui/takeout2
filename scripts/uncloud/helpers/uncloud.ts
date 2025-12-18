import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

import { run } from '@take-out/scripts/helpers/run'

const UNCLOUD_VERSION = '0.15.0'

export async function checkUncloudCLI(): Promise<void> {
  try {
    const { stdout } = await run('uc --version', { silent: true, captureOutput: true })
    console.info(`✅ uncloud cli installed (${stdout.trim()})`)
  } catch {
    throw new Error(
      `uncloud cli not found - install: curl -fsS https://get.uncloud.run/install.sh | sh -s -- --version ${UNCLOUD_VERSION}`
    )
  }
}

function createUncloudConfig(host: string, sshKey: string): void {
  const configDir = join(homedir(), '.config', 'uncloud')
  const configPath = join(configDir, 'config.yaml')

  if (!existsSync(configDir)) {
    mkdirSync(configDir, { recursive: true })
  }

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

export async function initUncloud(
  host: string,
  sshKey: string,
  options: { noDNS?: boolean; noCaddy?: boolean } = {}
): Promise<void> {
  console.info('\n🚀 initializing uncloud...\n')

  // check if we already have local context that works
  try {
    await run('uc ls', { silent: true })
    console.info('✅ local cluster context exists and connected')
    return
  } catch {
    // no local context - check if server has uncloud running
  }

  const sshCmd = `ssh -i ${sshKey} -o StrictHostKeyChecking=no ${host}`

  // check if server already has uncloud daemon running
  let serverHasUncloud = false
  try {
    await run(`${sshCmd} "systemctl is-active uncloud.service"`, { silent: true })
    serverHasUncloud = true
    console.info('✅ server has uncloud daemon running')
  } catch {
    // check if uncloudd binary exists as fallback
    try {
      await run(`${sshCmd} "test -f /usr/local/bin/uncloudd"`, { silent: true })
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

  await run(`echo "y" | uc machine init ${host} -i ${sshKey} ${flagStr}`)

  console.info('✅ uncloud initialized')
}

export async function pushImage(imageName = 'takeout-web:latest'): Promise<void> {
  console.info('\n📤 pushing image to cluster...\n')

  await run(`uc image push ${imageName}`)
  console.info('✅ image pushed')
}

export async function deployStack(composeFile: string, profile?: string): Promise<void> {
  console.info('\n📦 deploying stack...\n')

  const profileFlag = profile ? `--profile ${profile}` : ''
  // --recreate ensures containers are recreated even if config unchanged (pulls fresh images)
  await run(`uc deploy -f ${composeFile} ${profileFlag} --recreate --yes`)

  console.info('\n✅ deployment complete!')
}

export async function showStatus(): Promise<void> {
  console.info('\n📊 deployment status:\n')

  try {
    await run('uc ls')
  } catch {
    console.error('could not fetch status')
  }
}

export async function showContainers(): Promise<void> {
  console.info('\n📦 container status:\n')

  try {
    await run('uc ps')
  } catch {
    console.error('could not fetch container status')
  }
}

export async function startService(service?: string): Promise<void> {
  const target = service || 'all services'
  console.info(`\n▶️  starting ${target}...\n`)

  try {
    await run(`uc start${service ? ` ${service}` : ''}`)
    console.info(`✅ ${target} started`)
  } catch {
    throw new Error(`failed to start ${target}`)
  }
}

export async function stopService(service?: string): Promise<void> {
  const target = service || 'all services'
  console.info(`\n⏹️  stopping ${target}...\n`)

  try {
    await run(`uc stop${service ? ` ${service}` : ''}`)
    console.info(`✅ ${target} stopped`)
  } catch {
    throw new Error(`failed to stop ${target}`)
  }
}
