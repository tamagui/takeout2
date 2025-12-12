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

  // check if uncloud is installed on the server
  try {
    exec(`${sshCmd} "which uncloud"`, { silent: true })

    // server has uncloud - check if it's a cluster member
    try {
      // check if uncloud service is active and machine is part of cluster
      exec(`${sshCmd} "uncloud cluster info"`, { silent: true })
      console.info('✅ server is already a cluster member')

      // ensure we have local context - try uc ls first
      try {
        exec('uc ls', { silent: true })
        console.info('✅ local cluster context exists')
        return
      } catch {
        // no local context - need to add this machine to our local config
        console.info('   adding cluster context locally...')
        try {
          // use --yes to auto-accept adding to existing cluster
          exec(`echo "y" | uc machine init ${host} -i ${sshKey}`, { silent: true })
          console.info('✅ cluster context added')
        } catch {
          // might fail if already configured - that's ok
          console.info('   cluster context may already exist')
        }
        return
      }
    } catch {
      // uncloud installed but not part of cluster - check if docker is running
      try {
        exec(`${sshCmd} "docker ps"`, { silent: true })
        console.info('   docker is available, attempting to join/init cluster...')
      } catch {
        console.info('⚠️  docker not running on server')
      }
    }
  } catch {
    // uncloud not installed on server - fresh init needed
    console.info('📦 uncloud not installed on server - initializing for first time')
  }

  const flags = []
  if (options.noDNS) flags.push('--no-dns')
  if (options.noCaddy) flags.push('--no-caddy')

  const flagStr = flags.join(' ')

  // for fresh init, use 'y' to accept initializing a new cluster
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
