/**
 * SST deployment helpers for ci/cd
 */

import fs from 'node:fs'
import { join } from 'node:path'

import {
  CreateRepositoryCommand,
  DescribeImagesCommand,
  ECRClient,
  GetAuthorizationTokenCommand,
} from '@aws-sdk/client-ecr'
import { slugify, time } from '@take-out/helpers'
import { run } from '@take-out/scripts/helpers/run'

export async function buildAndPushDockerImage() {
  console.info('\nBuilding Docker image for ECR...')

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

export async function loadLastDockerImage(): Promise<string | null> {
  const filePath = join(process.cwd(), 'dist', '.last-docker-image')
  if (!fs.existsSync(filePath)) {
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

export async function cleanupDockerImage(imageTag: string) {
  try {
    console.info('\nCleaning up local Docker image...')
    await run(`docker rmi ${imageTag}`, {
      silent: true,
      timeout: time.ms.minutes(1),
    })
    console.info('Docker image cleaned up successfully')
  } catch {
    // ignore cleanup errors - not critical
    console.info('Could not clean up Docker image (may already be removed)')
  }
}

export async function deploy() {
  await run('bun sst unlock --stage production', {
    prefix: 'deploy',
    timeout: time.ms.minutes(2),
    timing: 'sst unlock',
  })

  await run('bun tko sst deploy production', {
    prefix: 'deploy',
    timeout: time.ms.minutes(10),
    timing: 'sst deploy',
  })
}

export async function runHealthCheck() {
  console.info('\nChecking deployment health...')
  const url = process.env.ONE_SERVER_URL || 'https://api.takeout.com'
  const response = await fetch(`${url}/health`, {
    signal: AbortSignal.timeout(time.ms.seconds(30)),
  })
  if (!response.ok) {
    throw new Error(`Health check failed with status ${response.status}`)
  }
  console.info('✅ Health check passed')
}

// ----------- helpers -----------

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
  if (!fs.existsSync(distDir)) {
    await fs.promises.mkdir(distDir, { recursive: true })
  }
  const filePath = join(distDir, '.last-docker-image')
  await fs.promises.writeFile(filePath, imageUri, 'utf-8')
  console.info(`Saved Docker image URI to ${filePath}`)
}
