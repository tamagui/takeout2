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

export function initUncloud(
  host: string,
  sshKey: string,
  options: { noDNS?: boolean; noCaddy?: boolean } = {}
) {
  console.info('\n🚀 initializing uncloud...\n')

  const sshCmd = `ssh -i ${sshKey} -o StrictHostKeyChecking=no ${host}`

  // check if already initialized by checking for both uncloud binary and caddy container
  try {
    exec(`${sshCmd} "which uncloud"`, { silent: true })

    // check if caddy is running (indicates machine is fully initialized)
    try {
      exec(
        `${sshCmd} "docker ps --filter name=caddy --format '{{.Names}}' | grep -q caddy"`,
        { silent: true }
      )
      console.info('✅ uncloud already initialized (caddy running)')
      return
    } catch {
      // caddy not running - need to clean up and reinitialize
      console.info('⚠️  uncloud installed but caddy not running - cleaning up...')

      // stop and remove any existing caddy containers (running or stopped)
      // this prevents port 80 conflicts when uc machine init creates a new caddy
      try {
        exec(`${sshCmd} "docker ps -a --filter name=caddy -q | xargs -r docker rm -f"`, {
          silent: true,
        })
        console.info('   removed stale caddy container(s)')
      } catch {
        // no containers to remove, that's fine
      }
    }
  } catch {
    // uncloud not installed, continue with fresh init
    console.info('📦 uncloud not installed - initializing for first time')
  }

  const flags = []
  if (options.noDNS) flags.push('--no-dns')
  if (options.noCaddy) flags.push('--no-caddy')

  const flagStr = flags.join(' ')

  // pipe 'y' to auto-reset if machine is already initialized
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
