import { handleGetQueriesRequest, PushProcessor } from '@rocicorp/zero/pg'
import { zeroNodePg } from '@rocicorp/zero/server/adapters/pg'
import { assertString, randomId } from '@vxrn/helpers'
import { Pool } from 'pg'

import { createPermissions } from './createPermissions'
import { createMutators } from './helpers/createMutators'
import { isInZeroMutation, mutatorContext } from './helpers/mutatorContext'
import { setAuthData, setSchema } from './state'

import type {
  AsyncAction,
  AuthData,
  GenericModels,
  GetZeroMutators,
  Transaction,
} from './types'
import type {
  HumanReadable,
  Query,
  ReadonlyJSONValue,
  SyncedQuery,
  Schema as ZeroSchema,
} from '@rocicorp/zero'
import type { TransactionProviderInput } from '@rocicorp/zero/pg'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ServerQueries = Record<
  string,
  Record<string, SyncedQuery<any, any, any, any, any>>
>

export function createZeroServer<
  Schema extends ZeroSchema,
  Models extends GenericModels,
  ServerActions extends Record<string, unknown>,
>({
  createServerActions,
  database,
  schema,
  models,
  serverQueries,
}: {
  /**
   * The DB connection string, same as ZERO_UPSTREAM_DB
   */
  database: string
  schema: Schema
  models: Models
  createServerActions: () => ServerActions
  serverQueries?: ServerQueries
}) {
  setSchema(schema)

  const dbString = assertString(database, `createZeroServer "database"`)

  const zeroDb = zeroNodePg(
    schema,
    new Pool({
      connectionString: dbString,
    })
  )

  const permissions = createPermissions<Schema>({
    environment: 'server',
    schema,
  })

  const processor = new PushProcessor(zeroDb)

  const handleMutationRequest = async ({
    authData,
    request,
    skipAsyncTasks,
  }: {
    authData: AuthData | null
    request: Request
    skipAsyncTasks?: boolean
  }) => {
    // since mutations do DB work in transaction, avoid any async tasks during
    const asyncTasks: AsyncAction[] = []

    const mutators = createMutators({
      asyncTasks,
      can: permissions.can,
      createServerActions,
      environment: 'server',
      models,
      authData,
    })

    // @ts-expect-error type is ok but config in monorepo
    const response = await processor.process(mutators, request)

    // now finish
    if (!skipAsyncTasks && asyncTasks.length) {
      const id = randomId()
      console.info(`[push] complete, running async tasks ${asyncTasks.length} id ${id}`)
      Promise.all(asyncTasks.map((task) => task()))
        .then(() => {
          console.info(`[push] async tasks complete ${id}`)
        })
        .catch((err) => {
          console.error(`[push] error: async tasks failed 😞`, err)
        })
    }

    return {
      response,
      asyncTasks,
    }
  }

  const handleQueryRequest = async ({
    authData,
    request,
  }: {
    authData: AuthData | null
    request: Request
  }) => {
    function getQuery(name: string, args: readonly ReadonlyJSONValue[]) {
      // name format: "namespace.queryName" (e.g. "post.allPosts")
      const [namespace, queryName] = name.split('.')
      const q = serverQueries?.[namespace!]?.[queryName!]
      if (!q) {
        throw new Error(`No such query: ${name}`)
      }

      return {
        // @ts-expect-error zero bug atm
        query: q(...args),
      }
    }

    setAuthData(authData || {})
    const response = await handleGetQueriesRequest(getQuery, schema, request)

    return {
      response,
    }
  }

  const mutate = async (
    run: (tx: Transaction, mutators: GetZeroMutators<Models>) => Promise<void>,
    authData?: Pick<AuthData, 'email' | 'id'> & Partial<AuthData>
  ) => {
    const asyncTasks: Array<() => Promise<void>> = []

    const mutators = createMutators({
      models,
      environment: 'server',
      asyncTasks,
      authData: {
        id: '',
        email: 'admin@start.chat',
        role: 'admin',
        ...authData,
      },
      createServerActions,
      can: permissions.can,
    })

    await transaction(async (tx) => {
      await run(tx, mutators)
    })

    await Promise.all(asyncTasks.map((t) => t()))
  }

  async function transaction<
    CB extends (tx: Transaction) => Promise<any>,
    Returns extends CB extends (tx: Transaction) => Promise<infer X> ? X : never,
  >(query: CB): Promise<Returns> {
    try {
      if (isInZeroMutation()) {
        const { tx } = mutatorContext()
        return await query(tx)
      }
      // @ts-expect-error type
      const output = await zeroDb.transaction(query, dummyTransactionInput)
      return output as any
    } catch (err) {
      console.error(`Error running transaction(): ${err}`)
      throw err
    }
  }

  function query<R>(
    cb: (q: Transaction['query']) => Query<Schema, any, R>
  ): Promise<HumanReadable<R>> {
    return transaction(async (tx) => {
      return cb(tx.query)
    }) as any
  }

  // This is needed temporarily and will be cleaned up in the future.
  const dummyTransactionInput: TransactionProviderInput = {
    clientGroupID: 'unused',
    clientID: 'unused',
    mutationID: 42,
    upstreamSchema: 'unused',
  }

  return {
    handleMutationRequest,
    handleQueryRequest,
    transaction,
    mutate,
    query,
  }
}
