import { json, number, string, table } from '@rocicorp/zero'
import type { TableInsertRow } from 'over-zero'
import { mutations, where } from 'over-zero'
import type { JobPriority, JobStatus } from 'start/types'
import type { JobName } from '~/jobs/definitions'

export type Job = TableInsertRow<typeof schema>

export const schema = table('job')
  .columns({
    id: string(),
    name: string<JobName>(),
    version: number(),
    status: string<JobStatus>(),
    priority: string<JobPriority>(),
    payload: json(),
    result: json().optional(),
    logs: string().optional(),
    error: string().optional(),
    progress: number(),
    maxRetries: number(),
    retryCount: number(),
    scheduledFor: number().optional(),
    startedAt: number().optional(),
    completedAt: number().optional(),
    createdAt: number(),
    updatedAt: number().optional(),
  })
  .primaryKey('id')

export const permissions = where('job', (_, auth) => {
  const role = auth?.role || ''
  return {
    read: _.cmpLit(role, '=', 'admin'),
    write: _.cmpLit(role, '=', 'admin'),
  }
})

export const mutate = mutations(schema, permissions)
