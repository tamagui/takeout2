#!/usr/bin/env bun

/**
 * @description Deploy locally to Multipass VM with self-hosted database
 */

import { buildWeb, buildDockerImage } from './helpers/build'
import {
  checkMultipass,
  createVM,
  setupVMSSH,
  getVMIP,
  getVMSSHKey,
  setupPortForward,
  showLocalStatus,
} from './helpers/multipass'
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

async function main() {
  console.info('🎯 deploying takeout to local multipass vm\n')

  checkMultipass()
  checkUncloudCLI()

  // build steps
  if (!skipBuild) {
    buildWeb()
  } else {
    console.info('⏭️  skipping web build (--skip-build)')
  }

  if (!skipDocker) {
    buildDockerImage()
  } else {
    console.info('⏭️  skipping docker build (--skip-docker)')
  }

  createVM()
  setupVMSSH()

  const ip = getVMIP()
  if (!ip) {
    console.error('❌ could not get vm ip')
    process.exit(1)
  }

  const host = `ubuntu@${ip}`
  const sshKey = getVMSSHKey()

  initUncloud(host, sshKey, { noDNS: true, noCaddy: true })
  pushImage('takeout-web:latest')

  // deploy with self-hosted database profile
  deployStack('src/uncloud/docker-compose.yml', { profile: 'self-hosted-db' })

  setupPortForward()
  showStatus()
  showLocalStatus()
}

main().catch((error) => {
  console.error('\n💥 deployment failed:', error.message)
  process.exit(1)
})
