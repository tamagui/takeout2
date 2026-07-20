import { getInstanceForQueryFn } from './instanceRegistry'
import { resolveQuery, type PlainQueryFn } from './resolveQuery'
import { isInZeroMutation, mutatorContext } from './helpers/mutatorContext'
import { getAmbientRunner, getRunner } from './zeroRunner'

import type {
  AnyQueryRegistry,
  HumanReadable,
  Query,
  Schema as ZeroSchema,
} from '@rocicorp/zero'

let customQueriesRef: AnyQueryRegistry | null = null

export function setCustomQueries(queries: AnyQueryRegistry) {
  customQueriesRef = queries
}

function getCustomQueries(): AnyQueryRegistry {
  if (!customQueriesRef) {
    throw new Error(
      'Custom queries not initialized. Ensure client or server bindings have been created.',
    )
  }
  return customQueriesRef
}

// execute a query once (non-reactive counterpart to useQuery)
// defaults to 'unknown', pass 'complete' to have client fetch from server
export function run<
  Schema extends ZeroSchema,
  TTable extends keyof Schema['tables'] & string,
  TReturn,
>(
  query: Query<TTable, Schema, TReturn>,
  mode?: 'complete',
): Promise<HumanReadable<TReturn>>

export function run<
  Schema extends ZeroSchema,
  TArg,
  TTable extends keyof Schema['tables'] & string,
  TReturn,
>(
  fn: PlainQueryFn<TArg, Query<TTable, Schema, TReturn>>,
  params: TArg,
  mode?: 'complete',
): Promise<HumanReadable<TReturn>>

export function run<
  Schema extends ZeroSchema,
  TTable extends keyof Schema['tables'] & string,
  TReturn,
>(
  fn: PlainQueryFn<void, Query<TTable, Schema, TReturn>>,
  mode?: 'complete',
): Promise<HumanReadable<TReturn>>

export function run(
  queryOrFn: any,
  paramsOrMode?: any,
  modeArg?: 'complete',
): Promise<any> {
  const hasParams = modeArg !== undefined || (paramsOrMode && paramsOrMode !== 'complete')
  const params = hasParams ? paramsOrMode : undefined
  const mode = hasParams ? modeArg : paramsOrMode
  const options =
    mode === 'complete'
      ? ({
          type: 'complete',
        } as const)
      : undefined

  if (queryOrFn && queryOrFn['ast']) {
    // inline zql - on client it only resolves against cache, on server fully
    return getRunner()(queryOrFn, options)
  }

  const inMutation = isInZeroMutation()
  if (inMutation && mutatorContext().environment === 'server') {
    throw new Error(
      'run(namedQuery) cannot be used inside a Zero mutation. Use tx.run(zql...) for transactional mutation reads.',
    )
  }

  // with multiple client instances mounted, a named query executes against
  // the instance that claimed its namespace, not whichever mounted last
  const instance = getInstanceForQueryFn(queryOrFn)
  const customQueries = instance?.customQueries ?? getCustomQueries()
  const queryRequest = resolveQuery({ customQueries, fn: queryOrFn, params })

  return getAmbientRunner(instance)(queryRequest as any, options)
}
