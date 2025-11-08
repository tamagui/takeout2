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
import pc from 'picocolors'

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

    void run(`bun tko ci frontend`, {
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

async function deployUncloud() {
  console.info('\n📦 deploying to uncloud...')
  console.info()

  // check if uncloud is properly configured
  if (!process.env.DEPLOY_HOST || !process.env.ZERO_UPSTREAM_DB) {
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
    return
  }

  // setup ssh key for deployment
  if (process.env.DEPLOY_SSH_KEY) {
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

  // run uncloud deployment
  try {
    await run('bun tko uncloud deploy-prod', {
      prefix: 'deploy',
      timeout: time.ms.minutes(10),
      timing: 'uncloud deploy',
    })
  } catch (error) {
    failures.push({ task: 'deploy', error })
    throw error
  }

  console.info('\n✅ deployment complete!')
  console.info('\n📊 deployment status:')
  console.info()

  // show status
  try {
    await run('uc ls', {
      prefix: 'status',
      timeout: time.ms.seconds(30),
    })
  } catch {
    console.info(pc.gray('  (could not fetch status)'))
  }

  // run uncloud-specific health check
  console.info('\n🏥 checking deployment health...')
  try {
    await run('bun tko uncloud check-deployment', {
      prefix: 'health',
      timeout: time.ms.minutes(5),
      timing: 'uncloud health check',
    })
  } catch (error) {
    failures.push({ task: 'health check', error })
    throw error
  }

  // tail logs briefly to show deployment is working
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
