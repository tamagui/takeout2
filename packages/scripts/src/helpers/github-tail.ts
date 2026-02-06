/**
 * tail github actions ci logs for the latest run
 */

import { execSync, spawn } from 'node:child_process'

export interface GithubTailOptions {
  /** workflow name to look for (default: 'CI') */
  workflowName?: string
  /** job name to tail (default: 'build-test-and-deploy') */
  jobName?: string
  /** only show failed step logs */
  showOnlyFailed?: boolean
  /** force watch mode even for completed jobs */
  forceWatch?: boolean
}

function getFailedStepLogs(jobId: string, stepName: string): string {
  try {
    const logs = execSync(
      `gh run view --job ${jobId} --log 2>/dev/null | grep -A 100 -B 20 "${stepName}"`,
      {
        encoding: 'utf-8',
        shell: '/bin/bash',
        maxBuffer: 10 * 1024 * 1024,
      }
    )
    return logs
  } catch {
    try {
      const logs = execSync(`gh run view --job ${jobId} --log-failed 2>/dev/null`, {
        encoding: 'utf-8',
        maxBuffer: 10 * 1024 * 1024,
      })
      return logs
    } catch {
      return ''
    }
  }
}

async function watchJob(
  runId: string,
  jobId: string,
  jobName: string,
  showOnlyFailed: boolean
) {
  try {
    const jobsJson = execSync(`gh run view ${runId} --json jobs`, {
      encoding: 'utf-8',
    })
    const { jobs } = JSON.parse(jobsJson)
    const job = jobs.find((j: any) => j.name === jobName)

    if (job && job.status === 'completed') {
      console.info(`\nJob already completed with conclusion: ${job.conclusion}\n`)

      if (job.conclusion === 'failure') {
        const failedSteps =
          job.steps?.filter((s: any) => s.conclusion === 'failure') || []
        if (failedSteps.length > 0) {
          console.info(`❌ Failed step: ${failedSteps[0].name}\n`)
          console.info('🔍 Showing failure details...\n')
          console.info('─'.repeat(80))

          const failureLogs = getFailedStepLogs(jobId, failedSteps[0].name)
          if (failureLogs) {
            console.info(failureLogs)
          } else {
            execSync(`gh run view --job ${jobId} --log-failed`, {
              stdio: 'inherit',
            })
          }
        } else {
          execSync(`gh run view --job ${jobId} --log-failed`, {
            stdio: 'inherit',
          })
        }
      } else {
        if (!showOnlyFailed) {
          execSync(`gh run view --job ${jobId} --log`, {
            stdio: 'inherit',
          })
        }
      }

      process.exit(job.conclusion === 'success' ? 0 : 1)
    }
  } catch {
    // continue to watch mode
  }

  console.info('\n📡 Watching CI logs...\n')
  console.info('─'.repeat(80))

  const watchProcess = spawn('gh', ['run', 'watch', runId, '--exit-status'], {
    stdio: 'inherit',
  })

  watchProcess.on('exit', async (code) => {
    if (code !== 0) {
      console.info('\n❌ CI failed! Getting detailed logs...\n')
      console.info('─'.repeat(80))

      try {
        const jobsJson = execSync(`gh run view ${runId} --json jobs`, {
          encoding: 'utf-8',
        })
        const { jobs } = JSON.parse(jobsJson)
        const job = jobs.find((j: any) => j.name === jobName)

        if (job) {
          const failedSteps =
            job.steps?.filter((s: any) => s.conclusion === 'failure') || []
          if (failedSteps.length > 0) {
            console.info(
              `Failed steps: ${failedSteps.map((s: any) => s.name).join(', ')}\n`
            )

            for (const step of failedSteps) {
              console.info(`\n━━━ Logs for failed step: ${step.name} ━━━\n`)
              const stepLogs = getFailedStepLogs(jobId, step.name)
              if (stepLogs) {
                console.info(stepLogs)
              }
            }
          }
        }

        console.info('\n━━━ Summary of all failed steps ━━━\n')
        execSync(`gh run view --job ${jobId} --log-failed`, {
          stdio: 'inherit',
        })
      } catch {
        console.error('Could not retrieve detailed failure logs')
      }
    }

    process.exit(code || 0)
  })

  process.on('SIGINT', () => {
    watchProcess.kill()
    process.exit(0)
  })
}

export async function githubTail(options: GithubTailOptions = {}) {
  const {
    workflowName = 'CI',
    jobName = 'build-test-and-deploy',
    showOnlyFailed = false,
    forceWatch = false,
  } = options

  try {
    let latestCommit = execSync('git rev-parse HEAD', { encoding: 'utf-8' }).trim()
    let shortCommit = latestCommit.substring(0, 7)

    console.info(`Fetching CI logs for commit: ${shortCommit}`)

    let runsJson = execSync(
      `gh run list --commit ${latestCommit} --json databaseId,name,status,conclusion --limit 5`,
      { encoding: 'utf-8' }
    )
    let runs = JSON.parse(runsJson)
    let ciRun = runs.find((r: any) => r.name === workflowName)

    if (!ciRun) {
      console.info('No CI run found for local commit, checking remote...')

      latestCommit = execSync('git rev-parse origin/main', { encoding: 'utf-8' }).trim()
      shortCommit = latestCommit.substring(0, 7)

      console.info(`Fetching CI logs for remote commit: ${shortCommit}`)

      runsJson = execSync(
        `gh run list --commit ${latestCommit} --json databaseId,name,status,conclusion --limit 5`,
        { encoding: 'utf-8' }
      )
      runs = JSON.parse(runsJson)
      ciRun = runs.find((r: any) => r.name === workflowName)

      if (!ciRun) {
        console.info('No CI run for remote HEAD, getting latest CI run...')
        runsJson = execSync(
          `gh run list --workflow=${workflowName} --json databaseId,name,status,conclusion,headSha --limit 1`,
          { encoding: 'utf-8' }
        )
        runs = JSON.parse(runsJson)
        ciRun = runs[0]

        if (ciRun) {
          shortCommit = ciRun.headSha?.substring(0, 7) || 'unknown'
          console.info(`Using latest CI run for commit: ${shortCommit}`)
        }
      }
    }

    if (!ciRun) {
      console.error('No CI runs found')
      process.exit(1)
    }

    console.info(`CI Run: ${ciRun.status} (${ciRun.conclusion || 'in progress'})`)

    const jobsJson = execSync(`gh run view ${ciRun.databaseId} --json jobs`, {
      encoding: 'utf-8',
    })
    const { jobs } = JSON.parse(jobsJson)
    const buildJob = jobs.find((j: any) => j.name === jobName)

    if (!buildJob) {
      console.error(`No ${jobName} job found`)
      process.exit(1)
    }

    console.info(
      `\nJob: ${buildJob.name} - ${buildJob.status} (${buildJob.conclusion || 'in progress'})`
    )
    console.info('─'.repeat(80))

    if (buildJob.status === 'completed' && !forceWatch) {
      const logFlag =
        showOnlyFailed || buildJob.conclusion === 'failure' ? '--log-failed' : '--log'

      if (buildJob.conclusion === 'failure') {
        console.info('\n❌ Job failed! Showing failed steps...\n')
      } else if (showOnlyFailed) {
        console.info('\n🔍 Showing only failed steps...\n')
      }

      execSync(`gh run view --job ${buildJob.databaseId} ${logFlag}`, {
        stdio: 'inherit',
      })

      process.exit(buildJob.conclusion === 'success' ? 0 : 1)
    } else {
      await watchJob(ciRun.databaseId, buildJob.databaseId, jobName, showOnlyFailed)
    }
  } catch (error: any) {
    if (error.status === 1 && error.stdout?.includes('No jobs in progress')) {
      console.info('Job completed. Run again to see full logs.')
    } else {
      console.error('Error fetching CI logs:', error.message)
      process.exit(1)
    }
  }
}
