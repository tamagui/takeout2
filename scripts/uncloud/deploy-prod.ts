#!/usr/bin/env bun

import { cmd } from '@take-out/cli'

await cmd`Deploy to production`.run(async ({ run, colors, fs, path }) => {
  // env is loaded by run:prod wrapper (dotenvx --overload -f .env .env.production)
  const { buildMigrations, buildWeb, buildDockerImage } = await import('./helpers/build')
  const { processComposeEnv } = await import('./helpers/processEnv')
  const { checkSSHKey, testSSHConnection } = await import('./helpers/ssh')
  const { checkUncloudCLI, initUncloud, pushImage, deployStack, showStatus } =
    await import('./helpers/uncloud')
  const { acquireDeployLock, releaseDeployLock } =
    await import('@take-out/scripts/helpers/deploy-lock')

  // parse args
  const args = process.argv.slice(2)
  const skipBuild = args.includes('--skip-build')
  const skipDocker = args.includes('--skip-docker')
  const skipLock = args.includes('--skip-lock')

  const DEPLOY_HOST = process.env.DEPLOY_HOST
  const DEPLOY_USER = process.env.DEPLOY_USER || 'root'
  // default to uncloud_deploy (set by CI), fall back to id_rsa locally
  const DEPLOY_SSH_KEY =
    process.env.DEPLOY_SSH_KEY || `${process.env.HOME}/.ssh/uncloud_deploy`

  function getSSHCmd(host: string, sshKey: string): string {
    return `ssh -i ${sshKey} -o StrictHostKeyChecking=no ${host}`
  }

  async function tagPreviousImage(host: string, sshKey: string): Promise<void> {
    const ssh = getSSHCmd(host, sshKey)
    try {
      await run(
        `${ssh} "docker tag takeout-web:latest takeout-web:previous 2>/dev/null || true"`,
        { silent: true }
      )
      console.info(colors.gray('  tagged current image as takeout-web:previous'))
    } catch {
      console.info(colors.gray('  no existing image to tag (first deploy?)'))
    }
  }

  async function gracefulStopZero(host: string, sshKey: string): Promise<void> {
    const ssh = getSSHCmd(host, sshKey)
    try {
      const { stdout } = await run(`${ssh} "docker ps -qf name=zero"`, {
        captureOutput: true,
        silent: true,
      })
      const containerId = stdout.trim()
      if (!containerId) return

      console.info(colors.gray('  stopping zero gracefully (15s timeout)...'))
      await run(`${ssh} "docker stop -t 15 ${containerId}"`, { silent: true })
      console.info(colors.gray('  zero stopped cleanly'))
    } catch {
      console.info(colors.gray('  zero: not running or already stopped'))
    }
  }

  async function gracefulStopPgdb(host: string, sshKey: string): Promise<void> {
    const ssh = getSSHCmd(host, sshKey)
    try {
      const { stdout } = await run(`${ssh} "docker ps -qf name=pgdb"`, {
        captureOutput: true,
        silent: true,
      })
      const containerId = stdout.trim()
      if (!containerId) return

      const { stdout: ready } = await run(
        `${ssh} "docker exec ${containerId} pg_isready -U takeout 2>&1 || echo NOT_READY"`,
        { captureOutput: true, silent: true }
      )

      if (ready.includes('NOT_READY')) {
        console.info(colors.gray('  pgdb: not ready, skipping graceful stop'))
        return
      }

      console.info(colors.gray('  pgdb: issuing CHECKPOINT before stop...'))
      await run(
        `${ssh} "docker exec ${containerId} psql -U takeout -d postgres -c 'CHECKPOINT;'"`,
        { silent: true }
      )

      console.info(colors.gray('  stopping pgdb gracefully (60s timeout)...'))
      await run(`${ssh} "docker stop -t 60 ${containerId}"`, { silent: true })
      console.info(colors.gray('  pgdb stopped cleanly'))
    } catch {
      console.info(colors.gray('  pgdb: not running or already stopped'))
    }
  }

  async function checkPrerequisites(): Promise<{
    ZERO_UPSTREAM_DB: string
    ZERO_CVR_DB: string
    ZERO_CHANGE_DB: string
  }> {
    console.info('📋 checking prerequisites...\n')

    if (!DEPLOY_HOST) {
      throw new Error(
        'DEPLOY_HOST not set\n\nFor local use, run: bun tko onboard\nFor CI, ensure DEPLOY_HOST is in GitHub secrets'
      )
    }

    // derive zero database URLs from DEPLOY_DB (like sst.config.ts does)
    const deployDb = process.env.DEPLOY_DB
    if (!deployDb) {
      throw new Error(
        'DEPLOY_DB not set\n\nFor uncloud deployment, set DEPLOY_DB in .env.production\nExample: postgresql://user:pass@host:port/dbname?sslmode=require\n\nRun: bun tko onboard to configure'
      )
    }

    // extract base connection string (everything before the database name)
    const dbUrlParts = deployDb.split('/')
    const baseUrl = dbUrlParts.slice(0, -1).join('/')
    const queryParams = deployDb.includes('?') ? '?' + deployDb.split('?')[1] : ''

    const ZERO_UPSTREAM_DB = deployDb
    const ZERO_CVR_DB = `${baseUrl}/zero_cvr${queryParams}`
    const ZERO_CHANGE_DB = `${baseUrl}/zero_cdb${queryParams}`

    // verify env vars match DEPLOY_DB (warn if stale values exist)
    const envUpstream = process.env.ZERO_UPSTREAM_DB
    const envCvr = process.env.ZERO_CVR_DB
    const envChange = process.env.ZERO_CHANGE_DB

    const getHost = (url: string): string | null => url.match(/@([^:/]+)/)?.[1] || null
    const deployDbHost = getHost(deployDb)

    if (envUpstream && getHost(envUpstream) !== deployDbHost) {
      console.warn(
        colors.yellow(`⚠️  ZERO_UPSTREAM_DB in env has different host than DEPLOY_DB`)
      )
      console.warn(
        colors.yellow(`   env: ${getHost(envUpstream)}, deploy_db: ${deployDbHost}`)
      )
      console.warn(colors.yellow(`   using derived value from DEPLOY_DB`))
    }
    if (envCvr && getHost(envCvr) !== deployDbHost) {
      console.warn(
        colors.yellow(`⚠️  ZERO_CVR_DB in env has different host than DEPLOY_DB`)
      )
      console.warn(colors.yellow(`   using derived value from DEPLOY_DB`))
    }
    if (envChange && getHost(envChange) !== deployDbHost) {
      console.warn(
        colors.yellow(`⚠️  ZERO_CHANGE_DB in env has different host than DEPLOY_DB`)
      )
      console.warn(colors.yellow(`   using derived value from DEPLOY_DB`))
    }

    console.info(`✅ zero databases configured`)
    console.info(
      colors.gray(`   upstream: ${deployDb.split('@')[1]?.split('/')[0] || 'configured'}`)
    )

    console.info(`✅ deploy host: ${DEPLOY_HOST}`)
    console.info(`✅ deploy user: ${DEPLOY_USER}`)
    console.info(`✅ using external managed database`)

    await checkUncloudCLI()
    await checkSSHKey(DEPLOY_SSH_KEY)

    return { ZERO_UPSTREAM_DB, ZERO_CVR_DB, ZERO_CHANGE_DB }
  }

  async function uploadOriginCACerts(host: string, sshKey: string): Promise<void> {
    const certPath = process.env.ORIGIN_CA_CERT
    const keyPath = process.env.ORIGIN_CA_KEY

    if (!certPath || !keyPath) {
      return // not configured, use default ACME
    }

    // resolve paths relative to cwd
    const resolvedCert = path.resolve(process.cwd(), certPath)
    const resolvedKey = path.resolve(process.cwd(), keyPath)

    if (!fs.existsSync(resolvedCert)) {
      console.warn(colors.yellow(`⚠️  origin ca cert not found: ${resolvedCert}`))
      console.warn(colors.gray("   falling back to let's encrypt"))
      return
    }

    if (!fs.existsSync(resolvedKey)) {
      console.warn(colors.yellow(`⚠️  origin ca key not found: ${resolvedKey}`))
      console.warn(colors.gray("   falling back to let's encrypt"))
      return
    }

    console.info('\n🔐 uploading origin ca certificates...')

    const ssh = getSSHCmd(host, sshKey)

    try {
      // create certs directories on server
      await run(`${ssh} "mkdir -p /etc/uncloud/certs /var/lib/uncloud/caddy/certs"`, {
        silent: true,
      })

      // upload certificates to /etc/uncloud/certs
      await run(
        `scp -i ${sshKey} -o StrictHostKeyChecking=no ${resolvedCert} ${host}:/etc/uncloud/certs/origin.pem`
      )
      await run(
        `scp -i ${sshKey} -o StrictHostKeyChecking=no ${resolvedKey} ${host}:/etc/uncloud/certs/origin.key`
      )

      // copy to caddy volume mount path (accessible at /config/certs inside container)
      await run(`${ssh} "cp /etc/uncloud/certs/origin.* /var/lib/uncloud/caddy/certs/"`, {
        silent: true,
      })

      // set permissions
      await run(
        `${ssh} "chmod 600 /etc/uncloud/certs/origin.key /var/lib/uncloud/caddy/certs/origin.key"`,
        { silent: true }
      )

      console.info(colors.green('✓ origin ca certificates uploaded'))
      console.info(
        colors.gray('  certs available at /config/certs inside caddy container')
      )
    } catch (err) {
      console.warn(colors.yellow('⚠️  failed to upload origin ca certs'))
      console.warn(colors.gray(`   ${err instanceof Error ? err.message : err}`))
      console.warn(colors.gray("   falling back to let's encrypt"))
    }
  }

  async function deployCaddyWithTLS(host: string, sshKey: string): Promise<void> {
    const certPath = process.env.ORIGIN_CA_CERT
    const keyPath = process.env.ORIGIN_CA_KEY

    if (!certPath || !keyPath) {
      return // not using origin ca, caddy will use default acme
    }

    // get custom hostnames from env vars
    const webHost = process.env.VITE_WEB_HOSTNAME
    const zeroHost = process.env.VITE_ZERO_HOSTNAME
    const domains = [webHost, zeroHost].filter(Boolean)

    if (domains.length === 0) {
      console.warn(
        colors.yellow(
          '⚠️  no custom domains configured (VITE_WEB_HOSTNAME, VITE_ZERO_HOSTNAME)'
        )
      )
      console.warn(colors.gray("   caddy will use let's encrypt for tls"))
      return
    }

    // generate caddyfile dynamically from env vars
    const caddyfilePath = path.resolve(process.cwd(), 'src/uncloud/Caddyfile')
    const caddyConfig = [
      '# origin ca certificates for cloudflare proxied domains',
      '# auto-generated during deploy from VITE_WEB_HOSTNAME/VITE_ZERO_HOSTNAME env vars',
      '',
      ...domains.map(
        (domain) =>
          `${domain} {\n\ttls /config/certs/origin.pem /config/certs/origin.key\n}`
      ),
      '',
    ].join('\n')

    await fs.promises.writeFile(caddyfilePath, caddyConfig)
    console.info(colors.gray(`   generated caddyfile for: ${domains.join(', ')}`))

    console.info('\n🔄 deploying caddy with custom tls config...')

    const ssh = getSSHCmd(host, sshKey)

    try {
      await run(`echo "y" | uc caddy deploy --caddyfile ${caddyfilePath}`)

      // restart caddy to ensure tls certs are loaded from volume
      await run(`${ssh} "docker restart \\$(docker ps -qf name=caddy)"`, {
        silent: true,
      })
      console.info(colors.green('✓ caddy deployed with origin ca certificates'))
    } catch (err) {
      console.warn(colors.yellow('⚠️  failed to deploy caddy with custom config'))
      console.warn(colors.gray(`   ${err instanceof Error ? err.message : err}`))
      console.warn(
        colors.gray(
          '   you may need to run: uc caddy deploy --caddyfile src/uncloud/Caddyfile'
        )
      )
    }
  }

  console.info('🎯 deploying takeout to production\n')

  // derive database URLs from DEPLOY_DB
  const { ZERO_UPSTREAM_DB, ZERO_CVR_DB, ZERO_CHANGE_DB } = await checkPrerequisites()

  // build steps
  if (!skipBuild) {
    await buildMigrations()
    await buildWeb()
  } else {
    console.info('⏭️  skipping web build (--skip-build)')
  }

  if (!skipDocker) {
    await buildDockerImage()
  } else {
    console.info('⏭️  skipping docker build (--skip-docker)')
  }

  const host = `${DEPLOY_USER}@${DEPLOY_HOST}`

  await testSSHConnection(host, DEPLOY_SSH_KEY)

  const ssh = getSSHCmd(host, DEPLOY_SSH_KEY)

  if (!skipLock) {
    await acquireDeployLock(ssh)
    console.info(colors.gray('  acquired deploy lock'))
  }

  try {
    await tagPreviousImage(host, DEPLOY_SSH_KEY)

    await initUncloud(host, DEPLOY_SSH_KEY)

    // upload origin ca certs AFTER init (cluster reset creates fresh caddy volume)
    await uploadOriginCACerts(host, DEPLOY_SSH_KEY)

    await pushImage('takeout-web:latest')

    // process environment variables in compose file
    console.info('\n📝 processing compose file with production env...\n')
    const processedCompose = 'src/uncloud/docker-compose.processed.yml'
    console.info(colors.gray(`   zero version: ${process.env.ZERO_VERSION}`))
    processComposeEnv('src/uncloud/docker-compose.yml', processedCompose, {
      ...(process.env as Record<string, string | undefined>),
      ZERO_UPSTREAM_DB,
      ZERO_CVR_DB,
      ZERO_CHANGE_DB,
    })

    await gracefulStopZero(host, DEPLOY_SSH_KEY)
    await gracefulStopPgdb(host, DEPLOY_SSH_KEY)

    // deploy without pgdb profile since using external database
    await deployStack(processedCompose)

    // deploy caddy with custom tls config if origin ca certs are configured
    await deployCaddyWithTLS(host, DEPLOY_SSH_KEY)

    await showStatus()

    console.info('\n🎉 deployment ready!')
    console.info('\naccess your app:')
    console.info(`  web app:     http://${DEPLOY_HOST}:8081`)
    console.info(`  zero sync:   http://${DEPLOY_HOST}:4848`)
    console.info(`  ssh:         ssh ${DEPLOY_USER}@${DEPLOY_HOST}`)
    console.info('\nuseful commands:')
    console.info('  uc ls                    # list services')
    console.info('  uc logs web              # view web logs')
    console.info('  uc logs web -f           # follow web logs')
    console.info(`  ssh ${DEPLOY_USER}@${DEPLOY_HOST}  # ssh to server`)
    console.info('\nto skip builds on redeploy:')
    console.info('  bun scripts/uncloud/deploy-prod.ts --skip-build --skip-docker')
  } finally {
    if (!skipLock) {
      await releaseDeployLock(ssh)
      console.info(colors.gray('  released deploy lock'))
    }
  }
})
