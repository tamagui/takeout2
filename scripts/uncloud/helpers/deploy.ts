/**
 * uncloud deployment helpers for ci/cd
 * re-exports shared helpers from @take-out/scripts, adds takeout-specific deploy logic
 */

import { homedir } from 'node:os'

import { time } from '@take-out/helpers'
import { run } from '@take-out/scripts/helpers/run'
import {
  checkUncloudConfigured,
  installUncloudCLI as _installUncloudCLI,
  setupSSHKey as _setupSSHKey,
  verifyDatabaseConfig,
} from '@take-out/scripts/helpers/uncloud-deploy'
import pc from 'picocolors'

export { checkUncloudConfigured, verifyDatabaseConfig }

// load production env so DEPLOY_HOST etc are available for rollback/health checks
let envLoaded = false
async function ensureEnv() {
  if (envLoaded) return
  envLoaded = true
  const { loadEnv } = await import('@take-out/scripts/helpers/env-load')
  await loadEnv('production').catch((err) => {
    console.warn('warning: could not load production env:', err?.message || err)
  })
}

const UNCLOUD_VERSION = '0.16.0'

export async function installUncloudCLI() {
  return _installUncloudCLI(UNCLOUD_VERSION)
}

export async function setupSSHKey() {
  return _setupSSHKey()
}

export async function runDeployment(opts?: { skipLock?: boolean }) {
  await ensureEnv()
  const flags = [
    opts?.skipLock && '--skip-lock',
    opts?.skipLock && '--skip-build',
    opts?.skipLock && '--skip-docker',
  ]
    .filter(Boolean)
    .join(' ')
  await run(`bun run:prod tko uncloud deploy-prod${flags ? ` ${flags}` : ''}`, {
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
    timeout: time.ms.minutes(10),
    timing: 'uncloud health check',
  })
}

async function getSSHCmd(): Promise<string> {
  await ensureEnv()
  const deployHost = process.env.DEPLOY_HOST
  if (!deployHost) {
    throw new Error('DEPLOY_HOST not set — cannot build SSH command for rollback')
  }
  const deployUser = process.env.DEPLOY_USER || 'root'
  const sshKey = (
    process.env.DEPLOY_SSH_KEY || `${homedir()}/.ssh/uncloud_deploy`
  ).replace(/^~/, homedir())
  return `ssh -i ${sshKey} -o StrictHostKeyChecking=no ${deployUser}@${deployHost}`
}

async function rollbackToPrevious(): Promise<boolean> {
  console.info(
    pc.yellow('\n⚠️  health check failed, attempting rollback to previous image...')
  )

  const ssh = await getSSHCmd()

  try {
    // check if :previous image exists
    const { stdout } = await run(
      `${ssh} "docker image inspect takeout-web:previous >/dev/null 2>&1 && echo EXISTS || echo NONE"`,
      { captureOutput: true, silent: true }
    )

    if (stdout.trim() !== 'EXISTS') {
      console.error(pc.red('  no previous image available for rollback'))
      return false
    }

    // restore previous image as :latest
    await run(`${ssh} "docker tag takeout-web:previous takeout-web:latest"`, {
      silent: true,
    })
    console.info(pc.yellow('  restored takeout-web:previous → takeout-web:latest'))

    // re-deploy with the restored image (skip lock — caller already holds it)
    console.info(pc.yellow('  re-deploying with previous image...'))
    await runDeployment({ skipLock: true })

    // re-check health
    console.info(pc.yellow('  verifying rollback health...'))
    await runHealthCheck()

    console.info(pc.green('  ✅ rollback successful, production restored'))
    return true
  } catch (err) {
    console.error(
      pc.red('  rollback also failed:'),
      err instanceof Error ? err.message : err
    )
    return false
  }
}

export async function runDeploymentWithRollback(): Promise<void> {
  await runDeployment()

  try {
    await runHealthCheck()
  } catch (healthError) {
    const rolledBack = await rollbackToPrevious()

    if (rolledBack) {
      // production is restored but CI should still fail
      throw new Error(
        'deployment health check failed. rolled back to previous image successfully, ' +
          'but failing CI so the broken build is investigated.'
      )
    }

    // rollback also failed, re-throw original error
    throw healthError
  }
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
