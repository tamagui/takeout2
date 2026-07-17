import {
  createZeroServer,
  runAsyncTaskEntries,
  type AsyncTaskEntry,
  type BackgroundTaskScheduler,
  type HandleMutationRequestOptions,
} from 'on-zero/server'
import { createZeroSQLiteServer, type SqlStatementMetadata } from 'on-zero/sqlite'

import type { Config, MutatorContext } from 'on-zero'
import type { Schema as ZeroSchema } from '@rocicorp/zero'

type AppAuthData = {
  email: string
  id: string
  role: 'admin' | undefined
}

declare module 'on-zero' {
  interface Config {
    authData: AppAuthData
  }
}

type Models = {
  project: {
    mutate: {
      create: (context: MutatorContext, input: { id: string }) => Promise<void>
    }
  }
}

type Actions = Record<string, never>
type PostgresServer = ReturnType<typeof createZeroServer<ZeroSchema, Models, Actions>>
type SQLiteServer = ReturnType<typeof createZeroSQLiteServer<ZeroSchema, Models, Actions>>

declare const postgresServer: PostgresServer
declare const sqliteServer: SQLiteServer
declare const taskEntries: AsyncTaskEntry[]

const authData: Config['authData'] = {
  email: 'admin@example.com',
  id: 'admin',
  role: 'admin',
}

const sqliteWrite: SqlStatementMetadata = {
  table: 'project_records',
  publicTable: 'project',
  kind: 'upsert',
}
void sqliteWrite

void runAsyncTaskEntries(taskEntries, {
  background(promise) {
    void promise
  },
})

const scheduleBackgroundTask: BackgroundTaskScheduler = (promise) => {
  void promise
}
const mutationRequest: HandleMutationRequestOptions = {
  authData,
  request: new Request('https://example.com/api/zero/push'),
  scheduleBackgroundTask,
}
void postgresServer.handleMutationRequest(mutationRequest)

postgresServer.mutate.project.create(
  { id: 'pg' },
  { authData: { email: authData.email, id: authData.id, role: authData.role } },
)
sqliteServer.mutate.project.create(
  { id: 'sqlite' },
  { authData: { email: authData.email, id: authData.id, role: authData.role } },
)

// @ts-expect-error consumer auth augmentation must remain enforced
postgresServer.mutate.project.create({ id: 'invalid' }, { authData: { id: 'admin' } })
