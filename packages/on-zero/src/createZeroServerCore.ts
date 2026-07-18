import {
  PushProcessor,
  handleQueryRequest as zeroHandleQueryRequest,
} from '@rocicorp/zero/server'

import { runAsyncTaskEntries } from './asyncTasks'
import {
  createAsyncTaskCollector,
  createZeroDirectServerRuntime,
  resolveServerQuery,
  type TransactionAttemptLifecycle,
  type ZeroServerCommonOptions,
  type ZeroServerDatabase,
} from './createZeroDirectServer'
import { createMutators } from './helpers/createMutators'
import { runWithAuthScope } from './helpers/mutatorContext'
import { runWithQueryContext } from './helpers/queryContext'

import type { AuthData, GenericModels } from './types'
import type { Schema as ZeroSchema } from '@rocicorp/zero'

type AlreadyProcessedMutation = {
  id: {
    clientID: string
    id: number
  }
  result: {
    error: 'alreadyProcessed'
    details?: unknown
  }
}

type PushRequestBody = {
  clientGroupID?: unknown
}

export type BackgroundTaskScheduler = (promise: Promise<void>) => void

export type HandleMutationRequestOptions = {
  authData: AuthData | null
  request: Request
  scheduleBackgroundTask?: BackgroundTaskScheduler
  skipAsyncTasks?: boolean
}

export type PersistAlreadyProcessedArgs = {
  clientGroupID: string
  mutations: AlreadyProcessedMutation[]
  upstreamSchema: string
}

type ZeroServerCoreOptions<
  Schema extends ZeroSchema,
  Models extends GenericModels,
  ServerActions extends Record<string, unknown>,
> = ZeroServerCommonOptions<Schema, Models, ServerActions> & {
  createDatabase: () => ZeroServerDatabase
  persistAlreadyProcessed?: (args: PersistAlreadyProcessedArgs) => Promise<void>
}

export function createZeroServerCore<
  Schema extends ZeroSchema,
  Models extends GenericModels,
  ServerActions extends Record<string, unknown>,
>({
  createDatabase,
  createServerActions,
  defaultAllowAdminRole = 'all',
  defaultMutateAuthData,
  models,
  mutations: mutationValidators,
  persistAlreadyProcessed,
  queries,
  schema,
  validateMutation,
  validateQuery,
}: ZeroServerCoreOptions<Schema, Models, ServerActions>) {
  const { permissions, server } = createZeroDirectServerRuntime({
    createDatabase,
    createServerActions,
    defaultAllowAdminRole,
    defaultMutateAuthData,
    models,
    mutations: mutationValidators,
    queries,
    schema,
    validateMutation,
    validateQuery,
  })

  const handleMutationRequest = async ({
    authData,
    request,
    scheduleBackgroundTask,
    skipAsyncTasks,
  }: HandleMutationRequestOptions) => {
    const tasks = createAsyncTaskCollector()
    const recoveryRequest = request.clone()
    const mutators = createMutators({
      enqueueTask: tasks.enqueueTask,
      can: permissions.can,
      createServerActions,
      environment: 'server',
      models,
      authData,
      validateMutation,
      mutationValidators,
    })
    const processor = new PushProcessor(
      withTransactionLifecycle(createDatabase(), tasks.lifecycle),
      undefined,
      // zero replays prior-client mutations during recovery; the response
      // acknowledges them, while real processor failures still log as errors.
      'error',
    )
    const response = await processor.process(mutators, request)

    if (persistAlreadyProcessed) {
      const parsed = await parseAlreadyProcessed(recoveryRequest, response)
      if (parsed) await persistAlreadyProcessed(parsed)
    }

    if (!skipAsyncTasks && tasks.committed.length) {
      const entries = tasks.committed.map((entry) => ({
        ...entry,
        task: () => runWithAuthScope(authData, entry.task),
      }))
      await runAsyncTaskEntries(entries, { background: scheduleBackgroundTask })
    }

    return {
      response,
      asyncTasks: tasks.committed,
    }
  }

  const handleQueryRequest = async ({
    authData,
    request,
  }: {
    authData: AuthData | null
    request: Request
  }) => {
    if (!queries) {
      throw new Error(
        'No queries registered with createZeroServer. ' +
          'Pass the syncedQueries registry to createZeroServer via the queries option.',
      )
    }

    const handler = (name: string, args: unknown) =>
      resolveServerQuery({
        authData,
        name,
        args,
        queries,
        permissions,
        validateQuery,
      })

    const userID = typeof authData?.id === 'string' ? authData.id : undefined
    const response = await runWithQueryContext(
      { authData: authData || ({} as AuthData) },
      () =>
        // the legacy overload omits userID when auth does not identify a user.
        userID === undefined
          ? zeroHandleQueryRequest(handler, schema, request)
          : zeroHandleQueryRequest({ handler, schema, request, userID }),
    )

    return { response }
  }

  return {
    handleMutationRequest,
    handleQueryRequest,
    ...server,
  }
}

export type ZeroServer<
  Schema extends ZeroSchema,
  Models extends GenericModels,
  ServerActions extends Record<string, unknown>,
> = ReturnType<typeof createZeroServerCore<Schema, Models, ServerActions>>

function withTransactionLifecycle(
  database: ZeroServerDatabase,
  lifecycle: TransactionAttemptLifecycle,
): ZeroServerDatabase {
  return {
    async transaction(callback, input) {
      try {
        const value = await database.transaction(async (tx, hooks) => {
          lifecycle.beginAttempt()
          try {
            const result = await callback(tx, hooks)
            lifecycle.completeAttempt()
            return result
          } catch (error) {
            lifecycle.rollbackAttempt()
            throw error
          }
        }, input)
        lifecycle.commitTransaction()
        return value
      } catch (error) {
        lifecycle.rollbackTransaction()
        throw error
      }
    },
  }
}

async function parseAlreadyProcessed(
  request: Request,
  response: unknown,
): Promise<PersistAlreadyProcessedArgs | undefined> {
  const mutations = alreadyProcessedMutations(response)
  if (mutations.length === 0) return

  const upstreamSchema = new URL(request.url).searchParams.get('schema')
  if (!upstreamSchema) return

  const body = (await request.json()) as PushRequestBody
  if (typeof body.clientGroupID !== 'string') return

  return {
    clientGroupID: body.clientGroupID,
    mutations,
    upstreamSchema,
  }
}

function alreadyProcessedMutations(response: unknown): AlreadyProcessedMutation[] {
  if (!response || typeof response !== 'object') return []
  const mutations = (response as { mutations?: unknown }).mutations
  if (!Array.isArray(mutations)) return []

  return mutations.filter((mutation): mutation is AlreadyProcessedMutation => {
    if (!mutation || typeof mutation !== 'object') return false
    const id = (mutation as { id?: unknown }).id
    const result = (mutation as { result?: unknown }).result
    return (
      !!id &&
      typeof id === 'object' &&
      typeof (id as { clientID?: unknown }).clientID === 'string' &&
      typeof (id as { id?: unknown }).id === 'number' &&
      !!result &&
      typeof result === 'object' &&
      (result as { error?: unknown }).error === 'alreadyProcessed'
    )
  })
}

export type {
  ValidateMutationArgs,
  ValidateMutationFn,
  ValidateQueryArgs,
  ValidateQueryFn,
  ZeroServerCommonOptions,
  ZeroServerDatabase,
} from './createZeroDirectServer'
