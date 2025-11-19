import { exec } from './exec'

export function checkUncloudCLI() {
  try {
    exec('uc --version', { silent: true })
    console.info('✅ uncloud cli installed')
  } catch {
    console.error('❌ uncloud cli not found')
    console.error('\ninstall: curl -fsS https://get.uncloud.run/install.sh | sh')
    process.exit(1)
  }
}

export function initUncloud(
  host: string,
  sshKey: string,
  options: { noDNS?: boolean; noCaddy?: boolean } = {}
) {
  console.info('\n🚀 initializing uncloud...\n')

  // check if already initialized by checking for both uncloud binary and caddy container
  try {
    exec(`ssh -i ${sshKey} -o StrictHostKeyChecking=no ${host} "which uncloud"`, {
      silent: true,
    })

    // also check if caddy is running (indicates machine is fully initialized)
    try {
      exec(
        `ssh -i ${sshKey} -o StrictHostKeyChecking=no ${host} "docker ps --filter name=caddy --format '{{.Names}}' | grep -q caddy"`,
        {
          silent: true,
        }
      )
      console.info('✅ uncloud already initialized (caddy running)')
      return
    } catch {
      // caddy not running, but uncloud exists - might need reinitialization
      console.info('⚠️  uncloud installed but caddy not running - will reinitialize')
    }
  } catch {
    // not initialized, continue
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
