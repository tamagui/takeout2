#!/usr/bin/env bun

import { cmd } from '@o/cli'

await cmd`Deploy to local Multipass VM`.run(async () => {
  const { buildWeb, buildDockerImage } = await import('./helpers/build')
  const {
    checkMultipass,
    createVM,
    setupVMSSH,
    getVMIP,
    getVMSSHKey,
    setupPortForward,
    showLocalStatus,
  } = await import('./helpers/multipass')
  const { checkUncloudCLI, initUncloud, pushImage, deployStack, showStatus } =
    await import('./helpers/uncloud')

  // parse args
  const args = process.argv.slice(2)
  const skipBuild = args.includes('--skip-build')
  const skipDocker = args.includes('--skip-docker')

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
})
