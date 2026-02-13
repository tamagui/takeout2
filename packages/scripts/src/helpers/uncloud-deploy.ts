/**
 * generic uncloud deployment helpers for ci/cd
 * shared across repos via @take-out/scripts/helpers/uncloud-deploy
 */

import { existsSync } from 'node:fs'
import { mkdir, writeFile } from 'node:fs/promises'
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

export interface SetupSSHKeyOptions {
  // env var containing the key path or content (default: DEPLOY_SSH_KEY)
  envVar?: string
  // filename to write in ~/.ssh/ (default: uncloud_deploy)
  keyName?: string
  // host to add to known_hosts (default: process.env.DEPLOY_HOST)
  host?: string
}

/**
 * resolve an ssh key from env - handles both file paths (local) and
 * raw/base64 key content (CI). writes to ~/.ssh/{keyName} and updates
 * the env var to point to the file.
 */
export async function setupSSHKey(options: SetupSSHKeyOptions = {}) {
  const envVar = options.envVar || 'DEPLOY_SSH_KEY'
  const keyName = options.keyName || 'uncloud_deploy'
  const host = options.host || process.env.DEPLOY_HOST

  if (!process.env[envVar]) {
    return
  }

  // expand ~ to home directory (node doesn't do this automatically)
  const sshKeyValue = process.env[envVar]!.replace(/^~/, homedir())

  // check if it's a path to an existing file (local usage) or key content (CI usage)
  if (existsSync(sshKeyValue)) {
    // local usage - ensure env has resolved path (not ~ prefix)
    process.env[envVar] = sshKeyValue
    console.info(`  using ssh key from: ${sshKeyValue}`)
    return
  }

  // CI usage - env var contains the actual key content
  console.info('🔑 setting up ssh key from environment...')
  const sshDir = join(homedir(), '.ssh')
  const keyPath = join(sshDir, keyName)

  if (!existsSync(sshDir)) {
    await mkdir(sshDir, { recursive: true })
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

  await writeFile(keyPath, keyContent, { mode: 0o600 })

  // add host to known_hosts
  if (host) {
    try {
      await run(`ssh-keyscan -H ${host} >> ${join(sshDir, 'known_hosts')}`, {
        silent: true,
        timeout: time.ms.seconds(10),
      })
    } catch {
      // ignore - ssh will prompt if needed
    }
  }

  // override env var to point to the file we created
  process.env[envVar] = keyPath
  console.info(`  ssh key written to ${keyPath}`)
}
