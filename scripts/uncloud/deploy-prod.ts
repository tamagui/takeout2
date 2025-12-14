#!/usr/bin/env bun

/**
 * @description Deploy to production droplet with managed database
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { config } from 'dotenv'
import pc from 'picocolors'

function getZeroVersion(): string {
  const packageJson = JSON.parse(readFileSync('package.json', 'utf-8'))
  return packageJson.dependencies?.['@rocicorp/zero']?.replace(/^[\^~]/, '') || ''
}

import { buildMigrations, buildWeb, buildDockerImage } from './helpers/build'
import { exec } from './helpers/exec'
import { processComposeEnv } from './helpers/processEnv'
import { checkSSHKey, testSSHConnection } from './helpers/ssh'
import {
  checkUncloudCLI,
  initUncloud,
  pushImage,
  deployStack,
  showStatus,
} from './helpers/uncloud'

// parse args
const args = process.argv.slice(2)
const skipBuild = args.includes('--skip-build')
const skipDocker = args.includes('--skip-docker')

// load .env.production if it exists (for local use)
const envPath = resolve(process.cwd(), '.env.production')
if (existsSync(envPath)) {
  config({ path: envPath, override: false })
}

const DEPLOY_HOST = process.env.DEPLOY_HOST
const DEPLOY_USER = process.env.DEPLOY_USER || 'root'
// default to uncloud_deploy (set by CI), fall back to id_rsa locally
const DEPLOY_SSH_KEY =
  process.env.DEPLOY_SSH_KEY || `${process.env.HOME}/.ssh/uncloud_deploy`

function checkPrerequisites() {
  console.info('📋 checking prerequisites...\n')

  if (!DEPLOY_HOST) {
    console.error('❌ DEPLOY_HOST not set')
    console.error('\nFor local use, run: bun tko onboard')
    console.error('For CI, ensure DEPLOY_HOST is in GitHub secrets')
    process.exit(1)
  }

  // derive zero database URLs from DEPLOY_DB (like sst.config.ts does)
  const deployDb = process.env.DEPLOY_DB
  if (!deployDb) {
    console.error('❌ DEPLOY_DB not set')
    console.error('\nFor uncloud deployment, set DEPLOY_DB in .env.production')
    console.error('Example: postgresql://user:pass@host:port/dbname?sslmode=require')
    console.error('\nRun: bun tko onboard to configure')
    process.exit(1)
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
      pc.yellow(`⚠️  ZERO_UPSTREAM_DB in env has different host than DEPLOY_DB`)
    )
    console.warn(pc.yellow(`   env: ${getHost(envUpstream)}, deploy_db: ${deployDbHost}`))
    console.warn(pc.yellow(`   using derived value from DEPLOY_DB`))
  }
  if (envCvr && getHost(envCvr) !== deployDbHost) {
    console.warn(pc.yellow(`⚠️  ZERO_CVR_DB in env has different host than DEPLOY_DB`))
    console.warn(pc.yellow(`   using derived value from DEPLOY_DB`))
  }
  if (envChange && getHost(envChange) !== deployDbHost) {
    console.warn(pc.yellow(`⚠️  ZERO_CHANGE_DB in env has different host than DEPLOY_DB`))
    console.warn(pc.yellow(`   using derived value from DEPLOY_DB`))
  }

  console.info(`✅ zero databases configured`)
  console.info(
    pc.gray(`   upstream: ${deployDb.split('@')[1]?.split('/')[0] || 'configured'}`)
  )

  console.info(`✅ deploy host: ${DEPLOY_HOST}`)
  console.info(`✅ deploy user: ${DEPLOY_USER}`)
  console.info(`✅ using external managed database`)

  checkUncloudCLI()
  checkSSHKey(DEPLOY_SSH_KEY)

  return { ZERO_UPSTREAM_DB, ZERO_CVR_DB, ZERO_CHANGE_DB }
}

async function main() {
  console.info('🎯 deploying takeout to production\n')

  // derive database URLs from DEPLOY_DB
  const { ZERO_UPSTREAM_DB, ZERO_CVR_DB, ZERO_CHANGE_DB } = checkPrerequisites()

  // build steps
  if (!skipBuild) {
    buildMigrations()
    buildWeb()
  } else {
    console.info('⏭️  skipping web build (--skip-build)')
  }

  if (!skipDocker) {
    buildDockerImage()
  } else {
    console.info('⏭️  skipping docker build (--skip-docker)')
  }

  const host = `${DEPLOY_USER}@${DEPLOY_HOST}`

  testSSHConnection(host, DEPLOY_SSH_KEY)

  initUncloud(host, DEPLOY_SSH_KEY)

  // upload origin ca certs AFTER init (cluster reset creates fresh caddy volume)
  await uploadOriginCACerts(host, DEPLOY_SSH_KEY)

  pushImage()

  // process environment variables in compose file
  // spreads process.env so all vars are available, only derived db urls need explicit override
  console.info('\n📝 processing compose file with production env...\n')
  const processedCompose = 'src/uncloud/docker-compose.processed.yml'
  const zeroVersion = getZeroVersion()
  console.info(pc.gray(`   zero version: ${zeroVersion}`))
  processComposeEnv('src/uncloud/docker-compose.yml', processedCompose, {
    ...process.env,
    // derived zero database urls from DEPLOY_DB
    ZERO_UPSTREAM_DB,
    ZERO_CVR_DB,
    ZERO_CHANGE_DB,
    // always use zero version from package.json
    ZERO_VERSION: zeroVersion,
  })

  // deploy without pgdb profile since using external database
  deployStack(processedCompose)

  // deploy caddy with custom tls config if origin ca certs are configured
  await deployCaddyWithTLS(host, DEPLOY_SSH_KEY)

  showStatus()

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
}

async function uploadOriginCACerts(host: string, sshKey: string) {
  const certPath = process.env.ORIGIN_CA_CERT
  const keyPath = process.env.ORIGIN_CA_KEY

  if (!certPath || !keyPath) {
    return // not configured, use default ACME
  }

  // resolve paths relative to cwd
  const resolvedCert = resolve(process.cwd(), certPath)
  const resolvedKey = resolve(process.cwd(), keyPath)

  if (!existsSync(resolvedCert)) {
    console.warn(pc.yellow(`⚠️  Origin CA cert not found: ${resolvedCert}`))
    console.warn(pc.gray("   Falling back to Let's Encrypt"))
    return
  }

  if (!existsSync(resolvedKey)) {
    console.warn(pc.yellow(`⚠️  Origin CA key not found: ${resolvedKey}`))
    console.warn(pc.gray("   Falling back to Let's Encrypt"))
    return
  }

  console.info('\n🔐 uploading origin ca certificates...')

  const sshCmd = `ssh -i ${sshKey} -o StrictHostKeyChecking=no ${host}`

  try {
    // create certs directories on server
    // /etc/uncloud/certs for backup, /var/lib/uncloud/caddy/certs for caddy container access
    exec(`${sshCmd} "mkdir -p /etc/uncloud/certs /var/lib/uncloud/caddy/certs"`, {
      silent: true,
    })

    // upload certificates to /etc/uncloud/certs
    exec(
      `scp -i ${sshKey} -o StrictHostKeyChecking=no ${resolvedCert} ${host}:/etc/uncloud/certs/origin.pem`
    )
    exec(
      `scp -i ${sshKey} -o StrictHostKeyChecking=no ${resolvedKey} ${host}:/etc/uncloud/certs/origin.key`
    )

    // copy to caddy volume mount path (accessible at /config/certs inside container)
    exec(`${sshCmd} "cp /etc/uncloud/certs/origin.* /var/lib/uncloud/caddy/certs/"`, {
      silent: true,
    })

    // set permissions
    exec(
      `${sshCmd} "chmod 600 /etc/uncloud/certs/origin.key /var/lib/uncloud/caddy/certs/origin.key"`,
      { silent: true }
    )

    console.info(pc.green('✓ origin ca certificates uploaded'))
    console.info(pc.gray('  certs available at /config/certs inside caddy container'))
  } catch (err) {
    console.warn(pc.yellow('⚠️  Failed to upload origin ca certs'))
    console.warn(pc.gray(`   ${err instanceof Error ? err.message : err}`))
    console.warn(pc.gray("   Falling back to Let's Encrypt"))
  }
}

async function deployCaddyWithTLS(host: string, sshKey: string) {
  const certPath = process.env.ORIGIN_CA_CERT
  const keyPath = process.env.ORIGIN_CA_KEY

  if (!certPath || !keyPath) {
    return // not using origin ca, caddy will use default acme
  }

  // get custom domains from env vars
  const webDomain = process.env.WEB_DOMAIN
  const zeroDomain = process.env.ZERO_DOMAIN
  const domains = [webDomain, zeroDomain].filter(Boolean)

  if (domains.length === 0) {
    console.warn(pc.yellow('⚠️  No custom domains configured (WEB_DOMAIN, ZERO_DOMAIN)'))
    console.warn(pc.gray("   Caddy will use Let's Encrypt for TLS"))
    return
  }

  // generate caddyfile dynamically from env vars
  const caddyfilePath = resolve(process.cwd(), 'src/uncloud/Caddyfile')
  const caddyConfig = [
    '# origin ca certificates for cloudflare proxied domains',
    '# auto-generated during deploy from WEB_DOMAIN/ZERO_DOMAIN env vars',
    '',
    ...domains.map(
      (domain) =>
        `${domain} {\n\ttls /config/certs/origin.pem /config/certs/origin.key\n}`
    ),
    '',
  ].join('\n')

  writeFileSync(caddyfilePath, caddyConfig)
  console.info(pc.gray(`   generated Caddyfile for: ${domains.join(', ')}`))

  console.info('\n🔄 deploying caddy with custom tls config...')

  const sshCmd = `ssh -i ${sshKey} -o StrictHostKeyChecking=no ${host}`

  try {
    exec(`echo "y" | uc caddy deploy --caddyfile ${caddyfilePath}`, { silent: false })

    // restart caddy to ensure tls certs are loaded from volume
    exec(`${sshCmd} "docker restart \\$(docker ps -qf name=caddy)"`, { silent: true })
    console.info(pc.green('✓ caddy deployed with origin ca certificates'))
  } catch (err) {
    console.warn(pc.yellow('⚠️  Failed to deploy caddy with custom config'))
    console.warn(pc.gray(`   ${err instanceof Error ? err.message : err}`))
    console.warn(
      pc.gray('   You may need to run: uc caddy deploy --caddyfile src/uncloud/Caddyfile')
    )
  }
}

main().catch((error) => {
  console.error('\n💥 deployment failed:', error.message)
  process.exit(1)
})
