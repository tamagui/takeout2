/**
 * generic uncloud deployment helpers for ci/cd
 */

import fs from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

import { time } from '@take-out/helpers'

import { run } from './run'

export async function checkUncloudConfigured(): Promise<boolean> {
  return Boolean(process.env.DEPLOY_HOST && process.env.DEPLOY_DB)
}

export async function verifyDatabaseConfig(): Promise<{
  valid: boolean
  errors: string[]
}> {
  const errors: string[] = []

  const deployDb = process.env.DEPLOY_DB
  const upstreamDb = process.env.ZERO_UPSTREAM_DB
  const cvrDb = process.env.ZERO_CVR_DB
  const changeDb = process.env.ZERO_CHANGE_DB

  if (!deployDb) errors.push('DEPLOY_DB is not set')
  if (!upstreamDb) errors.push('ZERO_UPSTREAM_DB is not set')
  if (!cvrDb) errors.push('ZERO_CVR_DB is not set')
  if (!changeDb) errors.push('ZERO_CHANGE_DB is not set')

  if (errors.length > 0) {
    return { valid: false, errors }
  }

  const getHost = (url: string): string | null => {
    try {
      const match = url.match(/@([^:/]+)/)
      return match?.[1] || null
    } catch {
      return null
    }
  }

  const deployHost = getHost(deployDb!)
  const upstreamHost = getHost(upstreamDb!)
  const cvrHost = getHost(cvrDb!)
  const changeHost = getHost(changeDb!)

  if (deployHost && upstreamHost && deployHost !== upstreamHost) {
    errors.push(
      `ZERO_UPSTREAM_DB host (${upstreamHost}) does not match DEPLOY_DB host (${deployHost})`
    )
  }
  if (deployHost && cvrHost && deployHost !== cvrHost) {
    errors.push(
      `ZERO_CVR_DB host (${cvrHost}) does not match DEPLOY_DB host (${deployHost})`
    )
  }
  if (deployHost && changeHost && deployHost !== changeHost) {
    errors.push(
      `ZERO_CHANGE_DB host (${changeHost}) does not match DEPLOY_DB host (${deployHost})`
    )
  }

  return { valid: errors.length === 0, errors }
}

export async function installUncloudCLI(version = '0.16.0') {
  console.info('🔧 checking uncloud cli...')
  try {
    await run('uc --version', { silent: true, timeout: time.ms.seconds(5) })
    console.info('  uncloud cli already installed')
  } catch {
    console.info(`  installing uncloud cli v${version}...`)
    await run(
      `curl -fsS https://get.uncloud.run/install.sh | sh -s -- --version ${version}`,
      { timeout: time.ms.seconds(30) }
    )
    console.info('  ✓ uncloud cli installed')
  }
}

export async function setupSSHKey() {
  if (!process.env.DEPLOY_SSH_KEY) {
    return
  }

  const sshKeyValue = process.env.DEPLOY_SSH_KEY

  // check if it's a path to an existing file (local usage) or key content (CI usage)
  if (fs.existsSync(sshKeyValue)) {
    console.info(`  using ssh key from: ${sshKeyValue}`)
    return
  }

  // CI usage - DEPLOY_SSH_KEY contains the actual key content
  console.info('🔑 setting up ssh key from environment...')
  const sshDir = join(homedir(), '.ssh')
  const keyPath = join(sshDir, 'uncloud_deploy')

  if (!fs.existsSync(sshDir)) {
    await fs.promises.mkdir(sshDir, { recursive: true })
  }

  // decode base64-encoded keys (github secrets often store keys as base64)
  let keyContent = sshKeyValue
  if (
    !sshKeyValue.includes('-----BEGIN') &&
    /^[A-Za-z0-9+/=\s]+$/.test(sshKeyValue.trim())
  ) {
    console.info('  detected base64-encoded key, decoding...')
    keyContent = Buffer.from(sshKeyValue.trim(), 'base64').toString('utf-8')
  }

  // ensure trailing newline (github secrets can strip it)
  if (!keyContent.endsWith('\n')) {
    keyContent += '\n'
  }

  await fs.promises.writeFile(keyPath, keyContent, { mode: 0o600 })

  // add host to known_hosts
  if (process.env.DEPLOY_HOST) {
    try {
      await run(
        `ssh-keyscan -H ${process.env.DEPLOY_HOST} >> ${join(sshDir, 'known_hosts')}`,
        { silent: true, timeout: time.ms.seconds(10) }
      )
    } catch {
      // ignore - ssh will prompt if needed
    }
  }

  // override env var to point to the file we created
  process.env.DEPLOY_SSH_KEY = keyPath
  console.info(`  ssh key written to ${keyPath}`)
}
