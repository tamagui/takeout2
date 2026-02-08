import fs from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

import { run } from './run'

export interface UncloudConfig {
  context?: string
}

function ucCmd(config?: UncloudConfig): string {
  return config?.context ? `uc -c ${config.context}` : 'uc'
}

export async function checkUncloudCLI(): Promise<void> {
  try {
    const { stdout } = await run('uc --version', { silent: true, captureOutput: true })
    console.info(`✅ uncloud cli installed (${stdout.trim()})`)
  } catch {
    throw new Error(
      `uncloud cli not found - install: curl -fsS https://get.uncloud.run/install.sh | sh`
    )
  }
}

function ensureUncloudContext(host: string, sshKey: string, contextName: string): void {
  const configDir = join(homedir(), '.config', 'uncloud')
  const configPath = join(configDir, 'config.yaml')

  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true })
  }

  // check if config already has context pointing to correct host
  if (fs.existsSync(configPath)) {
    const existing = fs.readFileSync(configPath, 'utf-8')
    const hostname = host.split('@')[1]
    if (hostname && existing.includes(`${contextName}:`) && existing.includes(hostname)) {
      console.info(`✅ uncloud config already has ${contextName} context for ${host}`)
      return
    }
  }

  // only create config if it doesn't exist - don't overwrite existing config
  // which may have other contexts
  if (!fs.existsSync(configPath)) {
    const config = `current_context: ${contextName}
contexts:
  ${contextName}:
    connections:
      - ssh: ${host}
        ssh_key_file: ${sshKey}
`
    fs.writeFileSync(configPath, config)
    console.info(`✅ created uncloud config at ${configPath}`)
  } else {
    console.info(`✅ using existing uncloud config (context: ${contextName})`)
  }
}

export async function initUncloud(
  host: string,
  sshKey: string,
  options: { noDNS?: boolean; noCaddy?: boolean; context?: string } = {}
): Promise<void> {
  console.info('\n🚀 initializing uncloud...\n')

  const uc = ucCmd(options)
  const contextName = options.context || 'default'

  // check if we already have local context that works
  try {
    await run(`${uc} ls`, { silent: true })
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
    try {
      await run(`${sshCmd} "test -f /usr/local/bin/uncloudd"`, { silent: true })
      serverHasUncloud = true
      console.info('✅ server has uncloud installed')
    } catch {
      // server doesn't have uncloud - needs fresh init
    }
  }

  if (serverHasUncloud) {
    ensureUncloudContext(host, sshKey, contextName)
    console.info('   (skipping init to avoid cluster reset)')
    return
  }

  // fresh server - need to initialize
  console.info('📦 uncloud not installed on server - initializing...')

  const flags: string[] = []
  if (options.noDNS) flags.push('--no-dns')
  if (options.noCaddy) flags.push('--no-caddy')
  const flagStr = flags.join(' ')

  await run(`echo "y" | uc machine init ${host} -i ${sshKey} ${flagStr}`)

  console.info('✅ uncloud initialized')
}

export async function pushImage(
  imageName: string,
  config?: UncloudConfig
): Promise<void> {
  console.info('\n📤 pushing image to cluster...\n')

  await run(`${ucCmd(config)} image push ${imageName}`)
  console.info('✅ image pushed')
}

export async function deployStack(
  composeFile: string,
  options?: { profile?: string } & UncloudConfig
): Promise<void> {
  console.info('\n📦 deploying stack...\n')

  const profileFlag = options?.profile ? `--profile ${options.profile}` : ''
  // --recreate ensures containers are recreated even if config unchanged (pulls fresh images)
  await run(`${ucCmd(options)} deploy -f ${composeFile} ${profileFlag} --recreate --yes`)

  console.info('\n✅ deployment complete!')
}

export async function showStatus(config?: UncloudConfig): Promise<void> {
  console.info('\n📊 deployment status:\n')

  try {
    await run(`${ucCmd(config)} ls`)
  } catch {
    console.error('could not fetch status')
  }
}

export async function showContainers(config?: UncloudConfig): Promise<void> {
  console.info('\n📦 container status:\n')

  try {
    await run(`${ucCmd(config)} ps`)
  } catch {
    console.error('could not fetch container status')
  }
}

export async function startService(
  service?: string,
  config?: UncloudConfig
): Promise<void> {
  const target = service || 'all services'
  console.info(`\n▶️  starting ${target}...\n`)

  try {
    await run(`${ucCmd(config)} start${service ? ` ${service}` : ''}`)
    console.info(`✅ ${target} started`)
  } catch {
    throw new Error(`failed to start ${target}`)
  }
}

export async function stopService(
  service?: string,
  config?: UncloudConfig
): Promise<void> {
  const target = service || 'all services'
  console.info(`\n⏹️  stopping ${target}...\n`)

  try {
    await run(`${ucCmd(config)} stop${service ? ` ${service}` : ''}`)
    console.info(`✅ ${target} stopped`)
  } catch {
    throw new Error(`failed to stop ${target}`)
  }
}
