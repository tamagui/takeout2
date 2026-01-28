#!/usr/bin/env bun

/**
 * @description Run full CI/CD pipeline with builds, tests, and deployment
 */

import { existsSync } from 'node:fs'
import { mkdir, writeFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join } from 'node:path'

import { sleep, time } from '@take-out/helpers'
import { args } from '@take-out/scripts/helpers/args'
import { checkPort } from '@take-out/scripts/helpers/check-port'
import { getTestEnv } from '@take-out/scripts/helpers/get-test-env'
import { handleProcessExit } from '@take-out/scripts/helpers/handleProcessExit'
import {
  printTiming,
  run,
  runInline,
  runParallel,
  waitForRun,
} from '@take-out/scripts/helpers/run'
import { waitForPort } from '@take-out/scripts/helpers/wait-for-port'

import * as sstDeploy from '../sst/helpers/deploy'
import * as uncloudDeploy from '../uncloud/helpers/deploy'

const { exit } = handleProcessExit({
  onExit: async () => {
    try {
      await run('docker compose down --no-color', {
        silent: true,
        timeout: time.ms.minutes(1),
      })
    } catch {
      // ignore errors during cleanup
    }
  },
})

const opts = args(`
  --skip-checks boolean
  --skip-tests boolean
  --skip-build boolean
  --dev boolean
  --skip-web-build boolean
  --skip-deploy boolean
  --dry-run boolean
  --redeploy boolean
`)

// --dry-run is an alias for --skip-deploy
const skipDeploy = opts.skipDeploy || opts.dryRun
const skipChecks = opts.skipChecks || opts.redeploy
const skipBuild = opts.skipBuild || opts.redeploy
const skipTests = opts.skipTests || opts.redeploy
const skipWebBuild = opts.skipWebBuild
const devMode = opts.dev
const redeploy = opts.redeploy

console.info('🏃 CI/CD')
console.info(`Node version: ${process.version}`)
console.info(`Bun version: ${Bun.version}`)

// Track failures for clean error reporting at the end
const failures: Array<{ task: string; error: any }> = []

const SEPARATOR = '\n' + '='.repeat(80)

try {
  // clear port 8081 before starting
  await ensurePort8081Clear()

  await runParallel([
    {
      name: 'checks',
      condition: () => !skipChecks,
      async fn() {
        await run('bun check:all', {
          prefix: 'checks',
          timeout: time.ms.minutes(3),
          timing: 'bun check',
        })
      },
    },
    {
      name: 'playwright-install',
      condition: () => !skipTests,
      async fn() {
        await run('npx playwright install chromium', {
          prefix: 'playwright',
          timeout: time.ms.minutes(5),
          timing: 'playwright install',
        })
      },
    },
    {
      name: 'aws-env',
      async fn() {
        await ensureAwsCredentials()
      },
    },
    // TODO: re-enable database backup once backup script is available
    // {
    //   name: 'backup-database',
    //   condition: () => !skipDeploy,
    //   fn: async () => {
    //     await backupProductionDatabase()
    //   },
    // },
    {
      name: 'unit-tests',
      condition: () => !skipTests,
      fn: async () => {
        await setupBackend()
        await runUnitTests()
      },
    },
    {
      name: 'build',
      condition: () => !skipBuild,
      fn: async () => {
        try {
          if (devMode) {
            void run(`bun run ci frontend-dev`, {
              detached: true,
            })
            await sleep(4000)
          } else if (!skipWebBuild) {
            await run(`bun run web build`, {
              prefix: 'web-build',
              timeout: time.ms.minutes(5),
              timing: 'web:build',
            })
          }
          await printTiming('production build tests', () => runIntegrationTests())
        } catch (error) {
          failures.push({ task: 'build', error })
          throw error
        }
      },
    },
  ])

  if (!skipDeploy) {
    await printTiming('deploy to production', () => deployProduction())
  }

  console.info('\n✅ CI completed successfully!')
  exit(0)
} catch (error) {
  if (failures.some((t) => t.task.includes('docker'))) {
    await printDockerLogs()
  }

  if (failures.length > 0) {
    console.error(SEPARATOR)
    console.error('CI FAILURES')
    console.error('='.repeat(80))

    for (const failure of failures) {
      console.error(`\nTask: ${failure.task}`)
      console.error('-'.repeat(40))
      // Only show the error message, not the full stack trace
      const errorMessage = failure.error?.message || String(failure.error)
      console.error('Error:', errorMessage)
      console.error('')
    }
  } else {
    console.error('\nCI failed:', error)
  }

  process.exit(1)
}

async function setupBackend() {
  await runInline('backend', async () => {
    // make sure any existing running stuff is down first so waitForBackend works
    await run(`docker compose down`, {
      env: await getTestEnv(),
    })
    void run(`bun run ci start-backend`, {
      detached: true,
    })
    await waitForBackend()
  })
}

async function printDockerLogs() {
  try {
    console.info(SEPARATOR)
    console.info('DOCKER LOGS')
    console.info(SEPARATOR)
    const { stdout: psOutput } = await run('docker compose ps', {
      captureOutput: true,
      silent: true,
      timeout: time.ms.minutes(1),
    })
    const { stdout: logsOutput } = await run(
      'docker compose logs --tail=300 --no-color',
      {
        captureOutput: true,
        silent: true,
        timeout: time.ms.minutes(1),
      }
    )
    console.info(`Docker ps:\n${psOutput}\n\nDocker logs:\n${logsOutput}`)
    console.info('='.repeat(80))
  } catch (logError) {
    console.error('Failed to capture docker logs:', logError)
  }
}

async function waitForBackend() {
  console.info('Waiting for migrations to complete...')
  const testEnv = await getTestEnv()

  for (let i = 0; i < 120; i++) {
    await sleep(2000)

    const { stdout } = await run(`docker compose ps --all --format json migrate`, {
      env: testEnv,
      silent: true,
      captureOutput: true,
    })

    try {
      const status = JSON.parse(stdout)

      if (status.State === 'exited') {
        if (status.ExitCode === 0) {
          console.info('✅ Migrations completed successfully!')
          return
        }
        throw new Error(`Migrations failed with exit code ${status.ExitCode}`)
      }

      if (i % 5 === 0) {
        console.info(`Migrations still running...`)
      }
    } catch (err) {
      // can run before service starts
      if (`${err}`.includes('JSON Parse')) {
        continue
      }
      throw err
    }
  }

  throw new Error(`Migrations failed to complete within timeout`)
}

async function runUnitTests() {
  if (skipTests) {
    return
  }

  const testEnv = await getTestEnv()

  try {
    await run('bun run test:unit', {
      env: testEnv,
      prefix: 'tests',
      timeout: time.ms.minutes(5),
      timing: 'test suite',
    })
  } catch (error) {
    failures.push({ task: 'tests', error })
    throw error
  }
}

async function runIntegrationTests() {
  if (skipTests) {
    return
  }

  console.info('\nRunning production integration tests...')

  try {
    await waitForRun('playwright install')

    void run(`bun run ci start-frontend`, {
      detached: true,
    })

    await waitForPort(8081)

    const testEnv = await getTestEnv()

    await run('cd src/test && bunx playwright test', {
      prefix: 'e2e',
      env: testEnv,
      timeout: time.ms.minutes(5),
      timing: 'playwright tests',
    })
  } catch (error) {
    failures.push({ task: 'integration tests', error })
    throw error
  }
}

async function deployProduction() {
  console.info('\nDeploying to production...')

  // detect deployment platform
  const deploymentPlatform = await detectDeploymentPlatform()
  console.info(`Using deployment platform: ${deploymentPlatform}`)

  if (deploymentPlatform === 'uncloud') {
    await deployUncloud()
  } else {
    await deploySST()
  }
}

async function detectDeploymentPlatform(): Promise<'sst' | 'uncloud'> {
  // check for explicit platform in env (this works in both CI and local)
  const platform = process.env.DEPLOYMENT_PLATFORM?.toLowerCase()
  if (platform === 'uncloud' || platform === 'sst') {
    return platform as 'sst' | 'uncloud'
  }

  // check .env.production for platform hint (local fallback)
  try {
    const envContent = await Bun.file('.env.production').text()
    if (envContent.includes('DEPLOYMENT_PLATFORM=uncloud')) {
      return 'uncloud'
    }
    if (envContent.includes('DEPLOY_HOST=') && envContent.includes('DEPLOY_USER=')) {
      // uncloud is configured
      return 'uncloud'
    }
  } catch {
    // file doesn't exist or can't be read (normal in CI)
  }

  // default to uncloud (safer default - no cloudflare api needed)
  return 'uncloud'
}

async function deploySST() {
  // handle Docker image for ECR
  if (skipBuild) {
    const lastImage = await sstDeploy.loadLastDockerImage()
    if (lastImage) {
      console.info(`\nUsing last Docker image from previous build: ${lastImage}`)
      process.env.WEB_APP_DOCKER_IMAGE = lastImage
    } else {
      console.warn(
        `\n⚠️ No saved Docker image found. SST will build a new image during deployment.`
      )
    }
  } else {
    await printTiming('build docker image for ECR', () =>
      sstDeploy.buildAndPushDockerImage()
    )
  }

  // deploy to SST
  try {
    await sstDeploy.deploy()
  } catch (error) {
    failures.push({ task: 'deploy', error })
    throw error
  }

  // cleanup
  if (process.env.DOCKER_IMAGE_TO_CLEAN) {
    await sstDeploy.cleanupDockerImage(process.env.DOCKER_IMAGE_TO_CLEAN)
  }

  // health check
  try {
    await sstDeploy.runHealthCheck()
  } catch (error) {
    failures.push({ task: 'health check', error })
    throw error
  }
}

async function deployUncloud() {
  console.info('\n📦 deploying to uncloud...')
  console.info()

  // check if uncloud is properly configured
  const isConfigured = await uncloudDeploy.checkUncloudConfigured()
  if (!isConfigured) {
    uncloudDeploy.showMissingConfigWarning()
    return
  }

  // install uncloud cli if not present
  await uncloudDeploy.installUncloudCLI()

  // setup ssh key for deployment
  await uncloudDeploy.setupSSHKey()

  // run uncloud deployment
  try {
    await uncloudDeploy.runDeployment()
  } catch (error) {
    failures.push({ task: 'deploy', error })
    throw error
  }

  // show status
  await uncloudDeploy.showDeploymentStatus()

  // run health check
  try {
    await uncloudDeploy.runHealthCheck()
  } catch (error) {
    failures.push({ task: 'health check', error })
    throw error
  }

  // tail logs
  await uncloudDeploy.tailLogs()

  // show deployment info
  uncloudDeploy.showDeploymentInfo()
}

// TODO: re-enable once backup script is available
// async function backupProductionDatabase() {
//   console.info('\nBacking up production database...')
//
//   try {
//     await run('bun sst shell --stage=production ./src/database/scripts/backup.ts', {
//       prefix: 'backup',
//       timeout: time.ms.minutes(6), // 6 minutes to account for 5 minute pg_dump timeout + overhead
//       timing: 'database backup',
//     })
//   } catch (error: any) {
//     const errorMessage = error?.message || String(error)
//
//     // check if it's a timeout or connection issue
//     if (errorMessage.includes('timeout') || errorMessage.includes('connection')) {
//       console.warn(
//         '⚠️ Database backup failed due to timeout or connection issue (non-critical)'
//       )
//       console.warn('   This may indicate a large database or network issues.')
//       console.warn('   Consider running backup manually if needed.')
//     } else {
//       console.warn('⚠️ Database backup failed (non-critical):', errorMessage)
//     }
//
//     failures.push({ task: 'database backup (non-critical)', error })
//   }
// }

async function ensureAwsCredentials() {
  const awsDir = join(homedir(), '.aws')
  if (!existsSync(awsDir)) {
    await mkdir(awsDir, { recursive: true })
    await writeFile(
      join(awsDir, 'config'),
      `[profile tamagui-prod]
region = us-west-1`
    )
    await writeFile(
      join(awsDir, 'credentials'),
      `[tamagui-prod]
aws_access_key_id=${process.env.AWS_ACCESS_KEY_ID}
aws_secret_access_key=${process.env.AWS_SECRET_ACCESS_KEY}`
    )
  }
}

// ----------- helpers -----------

async function ensurePort8081Clear() {
  const isPortTaken = await checkPort(8081)
  if (isPortTaken) {
    console.error(
      '❌ Port 8081 is already in use. Please stop the existing server before running CI.'
    )
    process.exit(1)
  }
}
