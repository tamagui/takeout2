#!/usr/bin/env bun

import { cmd } from '@take-out/cli'

type DeployPlatform = 'sst' | 'uncloud'

await cmd`Run full CI/CD pipeline: test, build prod, deploy`
  .args(
    `--skip-tests boolean --skip-deploy boolean --dry-run boolean --deploy-only boolean --redeploy boolean --dev boolean`
  )
  .run(async ({ args, run }) => {
    const { time } = await import('@take-out/helpers')
    const { handleProcessExit } =
      await import('@take-out/scripts/helpers/handleProcessExit')
    const { printTiming, runParallel } = await import('@take-out/scripts/helpers/run')
    const sst = await import('../sst/helpers/deploy')
    const uncloud = await import('../uncloud/helpers/deploy')

    const { exit } = handleProcessExit({})

    // --dry-run is an alias for --skip-deploy
    const skipDeploy = args.skipDeploy || args.dryRun
    const skipTests = args.skipTests || args.deployOnly || args.redeploy
    const skipBuild = args.redeploy
    const devMode = args.dev

    const deployPlatform = await detectDeploymentPlatform()

    console.info('🚀 release')
    console.info(`Deploy platform: ${deployPlatform}`)

    const failures: Array<{ task: string; error: any }> = []
    const SEPARATOR = '\n' + '='.repeat(80)

    try {
      // step 1: run tests (unless --deploy-only or --skip-tests)
      if (!skipTests) {
        console.info('\n📋 running tests...')
        await run(`bun tko test e2e${devMode ? ' --dev' : ''}`, {
          prefix: 'test',
          timeout: time.ms.minutes(20),
          timing: 'tests',
        })
      }

      // step 2: build prod + deploy env setup + push image
      await runParallel([
        {
          name: 'deploy-env',
          async fn() {
            if (deployPlatform === 'sst') {
              await ensureAwsCredentials()
            } else {
              await uncloud.installUncloudCLI()
              await uncloud.setupSSHKey()
            }
          },
        },
        {
          name: 'build',
          condition: () => !skipBuild,
          fn: async () => {
            console.info('\n🏗️  building for production...')
            await Promise.all([
              run(`bun tko db build`, {
                prefix: 'migrations',
                timeout: time.ms.minutes(2),
                timing: 'db:build',
              }),
              run(`bun run web build`, {
                prefix: 'web-build',
                timeout: time.ms.minutes(5),
                timing: 'web:build (prod)',
              }),
            ])
            if (!skipDeploy) {
              await printTiming('prebuild docker image', () =>
                prebuildDockerImage(deployPlatform)
              )
            }
          },
        },
      ])

      // step 3: deploy
      if (!skipDeploy) {
        await printTiming('deploy to production', () => deployProduction(deployPlatform))
      }

      if (deployPlatform === 'sst' && process.env.DOCKER_IMAGE_TO_CLEAN) {
        await sst.cleanupDockerImage(process.env.DOCKER_IMAGE_TO_CLEAN)
      }

      console.info('\n✅ release completed successfully!')
      exit(0)
    } catch (error) {
      if (failures.some((t) => t.task.includes('docker'))) {
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
        } catch (logError) {
          console.error('Failed to capture docker logs:', logError)
        }
      }

      if (failures.length > 0) {
        console.error(SEPARATOR)
        console.error('RELEASE FAILURES')
        console.error('='.repeat(80))
        for (const failure of failures) {
          console.error(`\nTask: ${failure.task}`)
          console.error('-'.repeat(40))
          console.error('Error:', failure.error?.message || String(failure.error))
          console.error('')
        }
      } else {
        console.error('\nRelease failed:', error)
      }

      exit(1)
    }

    async function deployProduction(platform: DeployPlatform) {
      console.info(`\nDeploying to production via ${platform}...`)

      try {
        if (platform === 'sst') {
          await sst.deploy()
          await sst.runHealthCheck()
        } else {
          await uncloud.runDeploymentWithRollback()
          await uncloud.showDeploymentStatus?.()
          await uncloud.tailLogs?.()
          uncloud.showDeploymentInfo?.()
        }
      } catch (error) {
        failures.push({ task: 'deploy', error })
        throw error
      }
    }

    async function prebuildDockerImage(platform: DeployPlatform) {
      if (platform === 'sst') {
        await sst.buildAndPushDockerImage()
      }
      // uncloud builds docker image as part of deployment
    }

    async function detectDeploymentPlatform(): Promise<DeployPlatform> {
      const platform = process.env.DEPLOYMENT_PLATFORM?.toLowerCase()
      if (platform === 'uncloud' || platform === 'sst') {
        return platform as DeployPlatform
      }
      try {
        const envContent = await Bun.file('.env.production').text()
        if (envContent.includes('DEPLOYMENT_PLATFORM=uncloud')) return 'uncloud'
        if (envContent.includes('DEPLOY_HOST=') && envContent.includes('DEPLOY_USER='))
          return 'uncloud'
      } catch {
        // file doesn't exist (normal in CI)
      }
      return 'uncloud'
    }

    async function ensureAwsCredentials() {
      const { join } = await import('node:path')
      const { homedir } = await import('node:os')
      const fs = await import('node:fs')

      const awsDir = join(homedir(), '.aws')
      if (!fs.existsSync(awsDir)) {
        await fs.promises.mkdir(awsDir, { recursive: true })
        await fs.promises.writeFile(
          join(awsDir, 'config'),
          `[profile tamagui-prod]\nregion = us-west-1`
        )
        await fs.promises.writeFile(
          join(awsDir, 'credentials'),
          `[tamagui-prod]\naws_access_key_id=${process.env.AWS_ACCESS_KEY_ID}\naws_secret_access_key=${process.env.AWS_SECRET_ACCESS_KEY}`
        )
      }
    }
  })
