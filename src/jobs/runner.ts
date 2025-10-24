import { database } from '~/database/database'
import { jobDefinitions } from './definitions'
import type { Job } from '~/data/models'

const POLL_INTERVAL = 1000
const MAX_CONCURRENT_JOBS = 5

export async function startJobRunner() {
  console.info('job runner starting...')

  let isRunning = true
  let activeJobs = 0

  process.on('SIGTERM', () => {
    console.info('received SIGTERM, shutting down gracefully...')
    isRunning = false
  })

  process.on('SIGINT', () => {
    console.info('received SIGINT, shutting down gracefully...')
    isRunning = false
  })

  while (isRunning) {
    try {
      if (activeJobs < MAX_CONCURRENT_JOBS) {
        const job = await fetchNextJob()

        if (job) {
          activeJobs++
          processJob(job)
            .catch((error) => {
              console.error('unhandled error processing job:', error)
            })
            .finally(() => {
              activeJobs--
            })
        } else {
          await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL))
        }
      } else {
        await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL))
      }
    } catch (error) {
      console.error('error in job runner loop:', error)
      await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL))
    }
  }

  console.info('waiting for active jobs to complete...')
  while (activeJobs > 0) {
    await new Promise((resolve) => setTimeout(resolve, 100))
  }

  console.info('job runner stopped')
  process.exit(0)
}

async function fetchNextJob(): Promise<Job | null> {
  const result = await database.query<Job>(
    `
    UPDATE job
    SET status = 'running', "startedAt" = NOW(), "updatedAt" = NOW()
    WHERE id = (
      SELECT id FROM job
      WHERE status = 'pending'
        AND ("scheduledFor" IS NULL OR "scheduledFor" <= NOW())
      ORDER BY priority DESC, "createdAt" ASC
      LIMIT 1
      FOR UPDATE SKIP LOCKED
    )
    RETURNING *
  `
  )

  return result.rows[0] || null
}

async function processJob(job: Job) {
  console.info(`processing job ${job.id} (${job.name} v${job.version})`)

  const definition = jobDefinitions.find((def) => def.name === job.name)

  if (!definition) {
    await updateJobStatus(job.id, {
      status: 'failed',
      error: `no job definition found for ${job.name}`,
      completedAt: new Date().toISOString(),
    })
    return
  }

  // version validation disabled for now - could add version support later
  // if (definition.version !== job.version) {
  //   await updateJobStatus(job.id, {
  //     status: 'failed',
  //     error: `version mismatch: job is v${job.version}, handler is v${definition.version}`,
  //     completedAt: new Date().toISOString(),
  //   })
  //   return
  // }

  const logs: string[] = []

  const log = (message: string) => {
    const timestamp = new Date().toISOString()
    const logEntry = `[${timestamp}] ${message}`
    logs.push(logEntry)
    console.info(`[job ${job.id}] ${message}`)
  }

  const updateProgress = async (progress: number) => {
    await updateJobStatus(job.id, {
      progress: Math.min(100, Math.max(0, progress)),
      logs: logs.join('\n'),
    })
  }

  try {
    const result = await definition.handler({
      job: {
        id: job.id,
        name: job.name,
        version: job.version,
        status: job.status,
        priority: job.priority,
        progress: job.progress,
        retryCount: job.retryCount,
        maxRetries: job.maxRetries,
      },
      payload: (job.payload as Record<string, unknown>) || {},
      log,
      updateProgress,
    })

    await updateJobStatus(job.id, {
      status: 'completed',
      result: result as Record<string, unknown>,
      logs: logs.join('\n'),
      progress: 100,
      completedAt: new Date().toISOString(),
    })

    console.info(`job ${job.id} completed successfully`)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    log(`error: ${errorMessage}`)

    const shouldRetry = job.retryCount < job.maxRetries

    if (shouldRetry) {
      await updateJobStatus(job.id, {
        status: 'pending',
        retryCount: job.retryCount + 1,
        logs: logs.join('\n'),
        error: errorMessage,
      })
      console.info(`job ${job.id} failed, retry ${job.retryCount + 1}/${job.maxRetries}`)
    } else {
      await updateJobStatus(job.id, {
        status: 'failed',
        error: errorMessage,
        logs: logs.join('\n'),
        completedAt: new Date().toISOString(),
      })
      console.error(`job ${job.id} failed permanently after ${job.retryCount} retries`)
    }
  }
}

async function updateJobStatus(
  jobId: string,
  updates: {
    status?: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
    result?: Record<string, unknown>
    logs?: string
    error?: string
    progress?: number
    retryCount?: number
    startedAt?: string
    completedAt?: string
  }
) {
  const setClauses: string[] = ['"updatedAt" = NOW()']
  const values: unknown[] = []
  let paramIndex = 1

  for (const [key, value] of Object.entries(updates)) {
    if (value !== undefined) {
      values.push(value)
      if (key === 'result') {
        setClauses.push(`"result" = $${paramIndex}::jsonb`)
      } else {
        setClauses.push(`"${key}" = $${paramIndex}`)
      }
      paramIndex++
    }
  }

  values.push(jobId)

  await database.query(
    `UPDATE job SET ${setClauses.join(', ')} WHERE id = $${paramIndex}`,
    values
  )
}
