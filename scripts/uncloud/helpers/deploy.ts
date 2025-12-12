/**
 * uncloud deployment helpers for ci/cd
 */

import { existsSync } from 'node:fs'
import { mkdir, writeFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join } from 'node:path'

import { time } from '@take-out/helpers'
import { run } from '@take-out/scripts/helpers/run'
import pc from 'picocolors'

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

  // check all required vars exist
  if (!deployDb) errors.push('DEPLOY_DB is not set')
  if (!upstreamDb) errors.push('ZERO_UPSTREAM_DB is not set')
  if (!cvrDb) errors.push('ZERO_CVR_DB is not set')
  if (!changeDb) errors.push('ZERO_CHANGE_DB is not set')

  if (errors.length > 0) {
    return { valid: false, errors }
  }

  // extract hosts from database URLs
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

  // verify all database hosts match
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

const UNCLOUD_VERSION = '0.15.0'

export async function installUncloudCLI() {
  console.info('🔧 checking uncloud cli...')
  try {
    await run('uc --version', { silent: true, timeout: time.ms.seconds(5) })
    console.info(pc.gray('  uncloud cli already installed'))
  } catch {
    console.info(pc.gray(`  installing uncloud cli v${UNCLOUD_VERSION}...`))
    await run(
      `curl -fsS https://get.uncloud.run/install.sh | sh -s -- --version ${UNCLOUD_VERSION}`,
      {
        timeout: time.ms.seconds(30),
      }
    )
    console.info(pc.gray('  ✓ uncloud cli installed'))
  }
}

export async function setupSSHKey() {
  if (!process.env.DEPLOY_SSH_KEY) {
    return
  }

  const sshKeyValue = process.env.DEPLOY_SSH_KEY

  // check if it's a path to an existing file (local usage) or key content (CI usage)
  const isFilePath = existsSync(sshKeyValue)

  if (isFilePath) {
    // local usage - DEPLOY_SSH_KEY is already a valid file path
    console.info(pc.gray(`  using ssh key from: ${sshKeyValue}`))
    return
  }

  // CI usage - DEPLOY_SSH_KEY contains the actual key content
  console.info('🔑 setting up ssh key from environment...')
  const sshDir = join(homedir(), '.ssh')
  const keyPath = join(sshDir, 'uncloud_deploy')

  // create .ssh directory if needed
  if (!existsSync(sshDir)) {
    await mkdir(sshDir, { recursive: true })
  }

  // write ssh key content to file
  await writeFile(keyPath, sshKeyValue, { mode: 0o600 })

  // add host to known_hosts
  if (process.env.DEPLOY_HOST) {
    try {
      await run(
        `ssh-keyscan -H ${process.env.DEPLOY_HOST} >> ${join(sshDir, 'known_hosts')}`,
        {
          silent: true,
          timeout: time.ms.seconds(10),
        }
      )
    } catch {
      // ignore errors - ssh will prompt if needed
    }
  }

  // override env var to point to the file we created
  process.env.DEPLOY_SSH_KEY = keyPath
  console.info(pc.gray(`  ssh key written to ${keyPath}`))
}

export async function runDeployment() {
  await run('bun tko uncloud deploy-prod', {
    prefix: 'deploy',
    timeout: time.ms.minutes(15),
    timing: 'uncloud deploy',
  })
}

export async function showDeploymentStatus() {
  console.info('\n✅ deployment complete!')
  console.info('\n📊 deployment status:')
  console.info()

  try {
    await run('uc ls', {
      prefix: 'status',
      timeout: time.ms.seconds(30),
    })
  } catch {
    console.info(pc.gray('  (could not fetch status)'))
  }
}

export async function runHealthCheck() {
  console.info('\n🏥 checking deployment health...')
  await run('bun tko uncloud check-deployment', {
    prefix: 'health',
    timeout: time.ms.minutes(5),
    timing: 'uncloud health check',
  })
}

export async function tailLogs() {
  console.info('\n📜 recent deployment logs:')
  console.info()
  try {
    await run('uc logs web --tail 20', {
      prefix: 'logs',
      timeout: time.ms.seconds(10),
    })
  } catch {
    console.info(pc.gray('  (logs not available yet)'))
  }
}

export function showDeploymentInfo() {
  console.info('\n🎉 uncloud deployment successful!')
  console.info()
  const deployHost = process.env.DEPLOY_HOST
  if (deployHost) {
    console.info(pc.bold('access your app:'))
    console.info(pc.cyan(`  web app:     https://${deployHost}`))
    console.info(
      pc.cyan(`  ssh:         ssh ${process.env.DEPLOY_USER || 'root'}@${deployHost}`)
    )
    console.info()
    console.info(pc.gray('useful commands:'))
    console.info(pc.gray('  bun tko uncloud logs       # view logs'))
    console.info(pc.gray('  uc ls                       # list services'))
    console.info(pc.gray('  uc logs web -f              # follow web logs'))
  }
}

export function showMissingConfigWarning() {
  console.info(pc.yellow('⚠ uncloud deployment not fully configured'))
  console.info(pc.gray('\nmissing required variables:'))
  if (!process.env.DEPLOY_HOST) {
    console.info(pc.gray('  - DEPLOY_HOST'))
  }
  if (!process.env.DEPLOY_DB) {
    console.info(pc.gray('  - DEPLOY_DB'))
  }
  console.info(pc.gray('\nskipping deployment (builds succeeded)'))
  console.info(pc.gray('\nto enable deployment:'))
  console.info(pc.gray('  1. run: bun tko onboard'))
  console.info(pc.gray('  2. sync env to github: bun scripts/env/sync-to-github.ts'))
}
