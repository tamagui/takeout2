#!/usr/bin/env bun

/**
 * @description Deploy to production droplet with managed database
 */

import { config } from 'dotenv'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { buildMigrations, buildWeb, buildDockerImage } from './helpers/build'
import { checkSSHKey, testSSHConnection } from './helpers/ssh'
import {
  checkUncloudCLI,
  initUncloud,
  pushImage,
  deployStack,
  showStatus,
} from './helpers/uncloud'
import { processComposeEnv } from './helpers/processEnv'

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

  if (!process.env.ZERO_UPSTREAM_DB) {
    console.error('❌ ZERO_UPSTREAM_DB not set')
    console.error('\nFor uncloud deployment, database should be externally managed')
    console.error('Set ZERO_UPSTREAM_DB, ZERO_CVR_DB, ZERO_CHANGE_DB in .env.production')
    process.exit(1)
  }

  console.info(`✅ deploy host: ${DEPLOY_HOST}`)
  console.info(`✅ deploy user: ${DEPLOY_USER}`)
  console.info(`✅ using external managed database`)

  checkUncloudCLI()
  checkSSHKey(DEPLOY_SSH_KEY)
}

async function main() {
  console.info('🎯 deploying takeout to production\n')

  checkPrerequisites()

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
  pushImage()

  // process environment variables in compose file
  console.info('\n📝 processing compose file with production env...\n')
  const processedCompose = 'src/uncloud/docker-compose.processed.yml'
  processComposeEnv('src/uncloud/docker-compose.yml', processedCompose, {
    ZERO_UPSTREAM_DB: process.env.ZERO_UPSTREAM_DB,
    ZERO_CVR_DB: process.env.ZERO_CVR_DB,
    ZERO_CHANGE_DB: process.env.ZERO_CHANGE_DB,
    ZERO_ADMIN_PASSWORD: process.env.ZERO_ADMIN_PASSWORD,
    ZERO_LOG_LEVEL: process.env.ZERO_LOG_LEVEL,
    ZERO_NUM_SYNC_WORKERS: process.env.ZERO_NUM_SYNC_WORKERS,
    ZERO_CVR_MAX_CONNS: process.env.ZERO_CVR_MAX_CONNS,
    ZERO_UPSTREAM_MAX_CONNS: process.env.ZERO_UPSTREAM_MAX_CONNS,
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
    BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
    ONE_SERVER_URL: process.env.ONE_SERVER_URL,
    VITE_PUBLIC_ZERO_SERVER: process.env.VITE_PUBLIC_ZERO_SERVER,
    CLOUDFLARE_R2_ENDPOINT: process.env.CLOUDFLARE_R2_ENDPOINT,
    CLOUDFLARE_R2_ACCESS_KEY: process.env.CLOUDFLARE_R2_ACCESS_KEY,
    CLOUDFLARE_R2_SECRET_KEY: process.env.CLOUDFLARE_R2_SECRET_KEY,
    CLOUDFLARE_R2_PUBLIC_URL: process.env.CLOUDFLARE_R2_PUBLIC_URL,
  })

  // deploy without pgdb profile since using external database
  deployStack(processedCompose)

  showStatus()

  console.info('\n🎉 deployment ready!')
  console.info('\naccess your app:')
  console.info(`  web app:     http://${DEPLOY_HOST}:3533`)
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

main().catch((error) => {
  console.error('\n💥 deployment failed:', error.message)
  process.exit(1)
})
