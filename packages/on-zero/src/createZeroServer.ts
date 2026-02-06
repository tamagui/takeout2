import { mustGetQuery } from '@rocicorp/zero'
import { PushProcessor } from '@rocicorp/zero/pg'
import { handleQueryRequest as zeroHandleQueryRequest } from '@rocicorp/zero/server'
import { zeroNodePg } from '@rocicorp/zero/server/adapters/pg'
import { assertString, randomId } from '@take-out/helpers'
import { Pool } from 'pg'

import { createPermissions } from './createPermissions'
import { createMutators } from './helpers/createMutators'
import { isInZeroMutation, mutatorContext } from './helpers/mutatorContext'
import { getMutationsPermissions } from './modelRegistry'
import { setCustomQueries } from './run'
import { getZQL, setAuthData, setSchema } from './state'
import { setRunner } from './zeroRunner'

import type {
  AsyncAction,
  AuthData,
  GenericModels,
  GetZeroMutators,
  Transaction,
} from './types'
import type {
  AnyQueryRegistry,
  HumanReadable,
  Query,
  Schema as ZeroSchema,
} from '@rocicorp/zero'
import type { TransactionProviderInput } from '@rocicorp/zero/pg'

export function createZeroServer<
  Schema extends ZeroSchema,
  Models extends GenericModels,
  ServerActions extends Record<string, unknown>,
>({
  createServerActions,
  database,
  schema,
  models,
  queries,
}: {
  /**
   * The DB connection string, same as ZERO_UPSTREAM_DB
   */
  database: string
  schema: Schema
  models: Models
  createServerActions: () => ServerActions
  queries?: AnyQueryRegistry
}) {
  setSchema(schema)

  const dbString = assertString(database, `createZeroServer "database"`)

  const zeroDb = zeroNodePg(
    schema,
    new Pool({
      connectionString: dbString,
      // handle self-signed certificates in production
      ssl: dbString.includes('sslmode=require')
        ? { rejectUnauthorized: false }
        : undefined,
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
    if (!queries) {
      throw new Error(
        'No queries registered with createZeroServer. ' +
          'Pass the syncedQueries registry to createZeroServer via the queries option.'
      )
    }

    // set authData globally for permission checks in query functions
    setAuthData(authData || ({} as AuthData))

    const response = await zeroHandleQueryRequest(
      (name, args) => {
        // permission.check is registered by on-zero at runtime, not in the user's query registry
        if (name === 'permission.check') {
          const { table, objOrId } = args as {
            table: string
            objOrId: string | Record<string, any>
          }
          const perm = getMutationsPermissions(table)
          if (!perm) {
            throw new Error(`[permission] no permission defined for table: ${table}`)
          }
          return (getZQL() as any)[table]
            .where((eb: any) => {
              return permissions.buildPermissionQuery(authData, eb, perm, objOrId, table)
            })
            .one()
        }

        const query = (mustGetQuery as any)(queries, name)
        return query.fn({ args, ctx: authData })
      },
      schema,
      request
    )

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
      return output
    } catch (err) {
      console.error(`Error running transaction(): ${err}`)
      throw err
    }
  }

  function query<R>(
    cb: (q: Transaction['query']) => Query<any, Schema, R>
  ): Promise<HumanReadable<R>> {
    return transaction(async (tx) => {
      return cb(tx.query)
    }) as any
  }

  // register for global run() helper
  if (queries) {
    setCustomQueries(queries)
  }

  // server uses transaction-based execution
  setRunner((queryObj) => {
    return transaction(async (tx) => {
      return tx.run(queryObj)
    })
  })

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
