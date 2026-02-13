#!/usr/bin/env bun

import { cmd } from '@take-out/cli'

await cmd`Run checks, build with test env, and run all tests (unit + integration)`
  .args(
    `--skip-checks boolean --skip-unit boolean --skip-integration boolean --dev boolean --start boolean --unit boolean --integration boolean --filter string`
  )
  .run(async ({ args }) => {
    const { sleep, time } = await import('@take-out/helpers')
    const { getTestEnv } = await import('@take-out/scripts/helpers/get-test-env')
    const { handleProcessExit } =
      await import('@take-out/scripts/helpers/handleProcessExit')
    const { run, printTiming, runInline, runParallel, waitForRun } =
      await import('@take-out/scripts/helpers/run')
    const { waitForPort } = await import('@take-out/scripts/helpers/wait-for-port')

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

    // --unit/--integration shortcuts imply skipping the other + skipping checks
    const focused = args.unit || args.integration
    const skipChecks = args.skipChecks || focused
    const skipUnit = args.skipUnit || args.integration
    const skipIntegration = args.skipIntegration || args.unit
    const devMode = args.dev || args.unit
    const startOnly = args.start

    // filter from --filter or rest positional args
    const filter = args.filter || args.rest.join(' ')

    console.info('🧪 test')

    // --start: just start backend+frontend, no tests
    if (startOnly) {
      await startBackend()
      await waitForBackend()
      await startFrontend()
      // keep running until killed
      await new Promise(() => {})
      return
    }

    const failures: Array<{ task: string; error: any }> = []
    const SEPARATOR = '\n' + '='.repeat(80)

    try {
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
          condition: () => !skipIntegration,
          async fn() {
            await run('bunx playwright install --with-deps chromium', {
              prefix: 'playwright',
              timeout: time.ms.minutes(5),
              timing: 'playwright install',
            })
          },
        },

        {
          name: 'backend',
          condition: () => !skipUnit || !skipIntegration,
          fn: () => setupBackend(),
        },

        {
          name: 'build-and-test',
          fn: async () => {
            try {
              await run(`bun tko db build`, {
                prefix: 'migrations',
                timeout: time.ms.minutes(2),
                timing: 'db build',
              })

              if (!devMode && !skipIntegration) {
                // always dev build even non-dev mode
                await run(`bun web build`, {
                  prefix: 'web-build',
                  timeout: time.ms.minutes(5),
                  timing: 'web build (test)',
                  env: {
                    ALLOW_MISSING_ENV: '1',
                  },
                })
              }

              // run unit + integration in parallel once build is ready
              await Promise.all([
                !skipUnit && printTiming('unit tests', () => runUnitTests()),
                !skipIntegration &&
                  printTiming('integration tests', () => runIntegrationTests()),
              ])
            } catch (error) {
              failures.push({ task: 'build-and-test', error })
              throw error
            }
          },
        },
      ])

      console.info('\n✅ all tests passed!')
      exit(0)
    } catch (error) {
      if (failures.some((t) => t.task.includes('docker') || t.task.includes('backend'))) {
        await printDockerLogs()
      }

      if (failures.length > 0) {
        console.error(SEPARATOR)
        console.error('TEST FAILURES')
        console.error('='.repeat(80))
        for (const failure of failures) {
          console.error(`\nTask: ${failure.task}`)
          console.error('-'.repeat(40))
          console.error('Error:', failure.error?.message || String(failure.error))
          console.error('')
        }
      } else {
        console.error('\nTests failed:', error)
      }

      exit(1)
    }

    // -----------------------------------------------------------------------

    async function startBackend() {
      const testEnv = await getTestEnv()
      if (!process.env.SKIP_BACKEND_CLEAN) {
        await run('bun backend:clean', { env: testEnv })
      }
      void run('bun backend --no-color', {
        env: {
          ...testEnv,
          ZERO_LOG_LEVEL: 'warn',
        },
        detached: true,
      })
    }

    async function startFrontend() {
      const testEnv = await getTestEnv()
      if (devMode) {
        void run('bun one:dev', { env: testEnv, detached: true })
      } else {
        void run('bun web serve', {
          env: { ...testEnv, IS_TESTING: '1' },
          detached: true,
        })
      }
    }

    async function setupBackend() {
      await runInline('backend', async () => {
        await run('docker compose down', { env: await getTestEnv() })
        await startBackend()
        await waitForBackend()
      })
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
              // seed demo data for tests
              await run('bun scripts/db/seed-demo.ts', {
                env: testEnv,
                prefix: 'seed',
                timeout: time.ms.minutes(1),
              })
              console.info('✅ Seed data loaded!')
              return
            }
            throw new Error(`Migrations failed with exit code ${status.ExitCode}`)
          }

          if (i % 5 === 0) {
            console.info(`Migrations still running...`)
          }
        } catch (err) {
          if (`${err}`.includes('JSON Parse')) {
            continue
          }
          throw err
        }
      }

      throw new Error(`Migrations failed to complete within timeout`)
    }

    async function runUnitTests() {
      const testEnv = await getTestEnv()
      const cmd = filter ? `bun run test:unit ${filter}` : 'bun run test:unit'

      try {
        await run(cmd, {
          env: testEnv,
          prefix: 'tests',
          timeout: time.ms.minutes(5),
          timing: 'test suite',
        })
      } catch (error) {
        failures.push({ task: 'unit tests', error })
        throw error
      }
    }

    async function runIntegrationTests() {
      console.info('\nRunning integration tests...')

      try {
        await waitForRun('playwright install')
        await waitForRun('backend')

        await startFrontend()
        await waitForPort(8081)

        const testEnv = await getTestEnv()

        const integrationCmd = filter
          ? `cd src/test && bunx playwright test ${filter}`
          : 'cd src/test && bunx playwright test'
        await run(integrationCmd, {
          prefix: 'integration',
          env: testEnv,
          timeout: time.ms.minutes(8),
          timing: 'playwright tests',
        })
      } catch (error) {
        failures.push({ task: 'integration tests', error })
        throw error
      }
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
  })
