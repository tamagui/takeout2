/**
 * uncloud deployment helpers for ci/cd
 */

import { existsSync } from 'node:fs'
import { mkdir, writeFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { time } from '@vxrn/helpers'
import { run } from '@vxrn/scripts/helpers/run'
import pc from 'picocolors'

export async function checkUncloudConfigured(): Promise<boolean> {
  return Boolean(process.env.DEPLOY_HOST && process.env.ZERO_UPSTREAM_DB)
}

export async function installUncloudCLI() {
  console.info('🔧 checking uncloud cli...')
  try {
    await run('uc --version', { silent: true, timeout: time.ms.seconds(5) })
    console.info(pc.gray('  uncloud cli already installed'))
  } catch {
    console.info(pc.gray('  installing uncloud cli...'))
    await run('curl -fsS https://get.uncloud.run/install.sh | sh', {
      timeout: time.ms.seconds(30),
    })
    console.info(pc.gray('  ✓ uncloud cli installed'))
  }
}

export async function setupSSHKey() {
  if (!process.env.DEPLOY_SSH_KEY) {
    return
  }

  console.info('🔑 setting up ssh key...')
  const sshDir = join(homedir(), '.ssh')
  const keyPath = join(sshDir, 'uncloud_deploy')

  // create .ssh directory if needed
  if (!existsSync(sshDir)) {
    await mkdir(sshDir, { recursive: true })
  }

  // write ssh key
  await writeFile(keyPath, process.env.DEPLOY_SSH_KEY, { mode: 0o600 })

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
    timeout: time.ms.minutes(10),
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
    console.info(pc.cyan(`  ssh:         ssh ${process.env.DEPLOY_USER || 'root'}@${deployHost}`))
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
  if (!process.env.ZERO_UPSTREAM_DB) {
    console.info(pc.gray('  - ZERO_UPSTREAM_DB'))
  }
  console.info(pc.gray('\nskipping deployment (builds succeeded)'))
  console.info(pc.gray('\nto enable deployment:'))
  console.info(pc.gray('  1. run: bun tko onboard'))
  console.info(pc.gray('  2. sync env to github: bun scripts/env/sync-to-github.ts'))
}
