#!/usr/bin/env bun

/**
 * @description Run full CI/CD pipeline with tests, builds, and deployment
 */

import {
  CreateRepositoryCommand,
  DescribeImagesCommand,
  ECRClient,
  GetAuthorizationTokenCommand,
} from '@aws-sdk/client-ecr'
import { sleep, slugify, time } from '@vxrn/helpers'
import { existsSync } from 'node:fs'
import { mkdir, writeFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { parseArgs } from 'node:util'
import { checkPort } from '@vxrn/scripts/helpers/check-port'
import { getTestEnv } from '@vxrn/scripts/helpers/get-test-env'
import { handleProcessExit } from '@vxrn/scripts/helpers/handleProcessExit'
import {
  printTiming,
  run,
  runInline,
  runParallel,
  waitForRun,
} from '@vxrn/scripts/helpers/run'
import { waitForPort } from '@vxrn/scripts/helpers/wait-for-port'

if (process.env.ONE_SERVER_URL?.includes('localhost')) {
  throw new Error(
    `bun loaded ci.ts with .env.development which will break production build`
  )
}

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

const { values } = parseArgs({
  args: process.argv.slice(2),
  options: {
    'skip-checks': {
      type: 'boolean',
      default: false,
    },
    'skip-tests': {
      type: 'boolean',
      default: false,
    },
    'skip-build': {
      type: 'boolean',
      default: false,
    },
    // avoid production build just run frontend in dev mdoe for faster testing
    dev: {
      type: 'boolean',
      default: false,
    },
    'skip-web-build': {
      type: 'boolean',
      default: false,
    },
    'skip-deploy': {
      type: 'boolean',
      default: false,
    },
    'dry-run': {
      type: 'boolean',
      default: false,
    },
    redeploy: {
      type: 'boolean',
      default: false,
    },
  },
})

// --dry-run is an alias for --skip-deploy
if (values['dry-run']) {
  values['skip-deploy'] = true
}

if (values.redeploy) {
  values['skip-checks'] = true
  values['skip-build'] = true
  values['skip-tests'] = true
}

console.info('🏃 CI/CD')
console.info(`Node version: ${process.version}`)
console.info(`Bun version: ${Bun.version}`)

// Track failures for clean error reporting at the end
const failures: Array<{ task: string; error: any }> = []

const SEPARATOR = '\n' + '='.repeat(80)

try {
  await runParallel([
    {
      name: 'checks',
      condition: () => !values['skip-checks'],
      async fn() {
        await ensurePort8081Clear()
        await run('bun check', {
          prefix: 'checks',
          timeout: time.ms.minutes(1),
          timing: 'bun check',
        })
      },
    },
    {
      name: 'playwright-install',
      async fn() {
        await ensurePlaywrightBrowsers()
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
    //   condition: () => !values['skip-deploy'],
    //   fn: async () => {
    //     await backupProductionDatabase()
    //   },
    // },
    {
      name: 'unit-tests',
      condition: () => !values['skip-tests'],
      fn: async () => {
        await setupBackend()
        await runUnitTests()
      },
    },
    {
      name: 'build',
      condition: () => !values['skip-build'],
      fn: async () => {
        try {
          if (values['dev']) {
            void run(`bun tko ci frontend-dev`, {
              detached: true,
            })
            await sleep(4000)
          } else if (!values['skip-web-build']) {
            await run(`bun tko web build`, {
              prefix: 'web-build',
              timeout: time.ms.minutes(5),
              timing: 'web:build',
            })
          }
          await Promise.all([
            printTiming('production build tests', () => runIntegrationTests()),
            printTiming('prebuild docker image', () => prebuildDockerImage()),
          ])
        } catch (error) {
          failures.push({ task: 'build', error })
          throw error
        }
      },
    },
  ])

  // if we skipped build, try to use the last saved Docker image
  if (values['skip-build'] && !values['skip-deploy']) {
    const lastImage = await readLastDockerImage()
    if (lastImage) {
      console.info(`\nUsing last Docker image from previous build: ${lastImage}`)
      process.env.WEB_APP_DOCKER_IMAGE = lastImage
    } else {
      console.warn(
        `\n⚠️ No saved Docker image found. SST will build a new image during deployment.`
      )
    }
  }

  if (!values['skip-deploy']) {
    await printTiming('deploy to production', () => deployProduction())
  }

  // cleanup docker image after successful deployment
  if (process.env.DOCKER_IMAGE_TO_CLEAN) {
    try {
      console.info('\nCleaning up local Docker image...')
      await run(`docker rmi ${process.env.DOCKER_IMAGE_TO_CLEAN}`, {
        silent: true,
        timeout: time.ms.minutes(1),
      })
      console.info('Docker image cleaned up successfully')
    } catch {
      // ignore cleanup errors - not critical
      console.info('Could not clean up Docker image (may already be removed)')
    }
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
    void run(`bun tko ci backend`, {
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
  if (values['skip-tests']) {
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
  if (values['skip-tests']) {
    return
  }

  console.info('\nRunning production integration tests...')

  try {
    await waitForRun('playwright install')

    void run(`bun tko ci frontend-prod`, {
      detached: true,
    })

    await waitForPort(8081)

    const testEnv = await getTestEnv()

    await run('bunx playwright test', {
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

  try {
    await run('bun sst unlock --stage production', {
      prefix: 'deploy',
      timeout: time.ms.minutes(2),
      timing: 'sst unlock',
    })
  } catch (error) {
    failures.push({ task: 'deploy', error })
    throw error
  }

  try {
    await run('bun tko sst deploy production', {
      prefix: 'deploy',
      timeout: time.ms.minutes(10),
      timing: 'sst deploy',
    })
  } catch (error) {
    failures.push({ task: 'deploy', error })
    throw error
  }

  // Only run health check if deployment succeeded
  console.info('\nChecking deployment health...')
  try {
    await run('bun ./scripts/ci/check-deployment.ts', {
      prefix: 'health',
      timeout: time.ms.minutes(10),
      timing: 'deployment health check',
    })
  } catch (error) {
    failures.push({ task: 'health check', error })
    throw error
  }
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

async function ensurePlaywrightBrowsers() {
  console.info('Checking Playwright browsers...')

  // check if chromium is installed by running playwright install --dry-run
  try {
    const { stdout } = await run('bunx playwright install --dry-run chromium', {
      captureOutput: true,
      silent: true,
      timeout: time.ms.seconds(30),
    })

    // if output contains "is already installed", we're good
    if (
      stdout.includes('is already installed') ||
      stdout.includes('browsers are already installed')
    ) {
      console.info('✅ Playwright chromium browser already installed')
      return
    }
  } catch {
    // dry-run failed or browsers not installed, continue to install
  }

  console.info('Installing Playwright chromium browser...')
  await run('bunx playwright install chromium', {
    prefix: 'playwright',
    timeout: time.ms.minutes(5),
    timing: 'playwright install',
  })
}

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

async function prebuildDockerImage() {
  if (values['skip-deploy']) {
    return
  }

  console.info('\nBuilding Docker image for production...')

  const accountId = await getAwsAccountId()

  if (!accountId) {
    console.warn(
      `⚠️ No accountId - maybe running locally, falling back to sst building image`
    )
    return
  }

  const ecrClient = new ECRClient({
    region: 'us-west-1',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  })

  const repositoryName = 'start-dot-chat/webapp'
  const ecrRegistry = `${accountId}.dkr.ecr.us-west-1.amazonaws.com`
  const imageUri = `${ecrRegistry}/${repositoryName}`

  try {
    // create ecr repository if it doesn't exist
    await ecrClient.send(
      new CreateRepositoryCommand({
        repositoryName,
      })
    )
    console.info(`Created ECR repository: ${repositoryName}`)
  } catch (error: any) {
    if (!error.name?.includes('RepositoryAlreadyExistsException')) {
      throw error
    }
    console.info(`ECR repository already exists: ${repositoryName}`)
  }

  // get ecr login token
  const authTokenResponse = await ecrClient.send(new GetAuthorizationTokenCommand({}))
  const authData = authTokenResponse.authorizationData?.[0]
  if (!authData?.authorizationToken) {
    throw new Error('Failed to get ECR authorization token')
  }

  // decode the token (it's base64 encoded username:password)
  const decodedToken = Buffer.from(authData.authorizationToken, 'base64').toString(
    'utf-8'
  )
  const [username, password] = decodedToken.split(':')

  // build the docker image
  const gitSha = await run('git rev-parse HEAD', {
    captureOutput: true,
    silent: true,
    timeout: time.ms.seconds(5),
  })
  const shortSha = gitSha.stdout.trim().substring(0, 7)
  const timestamp = slugify(new Date().toISOString())
  const imageTag = `${shortSha}-${timestamp}`
  const fullImageUri = `${imageUri}:${imageTag}`

  console.info(`Building Docker image: ${fullImageUri}...`)
  await run(`bun tko web build-docker -t ${fullImageUri} --load .`, {
    prefix: 'docker-build',
    timeout: time.ms.minutes(10),
  })

  console.info('Logging into ECR...')
  await run(
    `echo "${password}" | docker login --username ${username} --password-stdin ${ecrRegistry}`,
    { timeout: time.ms.minutes(1), silent: true }
  )

  console.info(`Pushing image to ECR...`)
  await run(`docker push ${fullImageUri}`, {
    prefix: 'docker-push',
    timeout: time.ms.minutes(5),
  })

  // get the image digest
  const describeResponse = await ecrClient.send(
    new DescribeImagesCommand({
      repositoryName,
      imageIds: [{ imageTag }],
    })
  )

  const imageDigest = describeResponse.imageDetails?.[0]?.imageDigest
  if (!imageDigest) {
    throw new Error('Failed to get image digest')
  }

  const imageWithDigest = `${imageUri}@${imageDigest}`
  console.info(`Docker image pushed successfully: ${imageWithDigest}`)

  // set the environment variable for sst deploy
  process.env.WEB_APP_DOCKER_IMAGE = imageWithDigest

  // save the image URI for future use
  await saveLastDockerImage(imageWithDigest)

  // store image tag for cleanup later
  process.env.DOCKER_IMAGE_TO_CLEAN = fullImageUri
}

async function getAwsAccountId(): Promise<string> {
  const { stdout } = await run(
    'aws sts get-caller-identity --query Account --output text',
    {
      captureOutput: true,
      timeout: time.ms.minutes(1),
    }
  )
  return stdout.trim()
}

async function saveLastDockerImage(imageUri: string): Promise<void> {
  const distDir = join(process.cwd(), 'dist')
  if (!existsSync(distDir)) {
    await mkdir(distDir, { recursive: true })
  }
  const filePath = join(distDir, '.last-docker-image')
  await writeFile(filePath, imageUri, 'utf-8')
  console.info(`Saved Docker image URI to ${filePath}`)
}

async function readLastDockerImage(): Promise<string | null> {
  const filePath = join(process.cwd(), 'dist', '.last-docker-image')
  if (!existsSync(filePath)) {
    return null
  }
  try {
    const content = await Bun.file(filePath).text()
    return content.trim()
  } catch (error) {
    console.warn(`Failed to read last Docker image: ${error}`)
    return null
  }
}

async function ensurePort8081Clear() {
  const isPortTaken = await checkPort(8081)
  if (isPortTaken) {
    console.error(
      '❌ Port 8081 is already in use. Please stop the existing server before running CI.'
    )
    process.exit(1)
  }
}
