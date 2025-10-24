export type JobPayload = Record<string, unknown>

export type JobResult = {
  success: boolean
  [key: string]: unknown
}

export type JobContext = {
  id: string
  name: string
  version: number
  status: string
  priority: string
  progress: number
  retryCount: number
  maxRetries: number
}

export type JobHandler<TPayload = JobPayload> = (params: {
  job: JobContext
  payload: TPayload
  log: (message: string) => void
  updateProgress: (progress: number) => Promise<void>
}) => Promise<JobResult>

export type JobDefinition<TPayload = JobPayload> = {
  name: string
  version: number
  handler: JobHandler<TPayload>
  defaultPriority?: 'low' | 'normal' | 'high'
  defaultMaxRetries?: number
}
