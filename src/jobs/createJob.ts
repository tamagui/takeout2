import type { JobDefinition, JobPayload } from './types'

export function createJob<TPayload = JobPayload>(
  definition: Omit<JobDefinition<TPayload>, 'version'> & { version?: number }
): JobDefinition<TPayload> {
  return {
    version: 1,
    defaultPriority: 'normal',
    defaultMaxRetries: 3,
    ...definition,
  }
}
