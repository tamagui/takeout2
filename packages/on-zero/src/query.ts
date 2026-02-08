import { resolveQuery, type PlainQueryFn } from './resolveQuery'
import { getRunner } from './zeroRunner'

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
      'Custom queries not initialized. Ensure createZeroClient or createZeroServer has been called.'
    )
  }
  return customQueriesRef
}

// execute a query once (non-reactive counterpart to useQuery)
// defaults to 'complete' (fetches from server), pass 'cached' for local-only
export function query<
  Schema extends ZeroSchema,
  TArg,
  TTable extends keyof Schema['tables'] & string,
  TReturn,
>(
  fn: PlainQueryFn<TArg, Query<TTable, Schema, TReturn>>,
  params: TArg,
  mode?: 'cached'
): Promise<HumanReadable<TReturn>>

export function query<
  Schema extends ZeroSchema,
  TTable extends keyof Schema['tables'] & string,
  TReturn,
>(
  fn: PlainQueryFn<void, Query<TTable, Schema, TReturn>>,
  mode?: 'cached'
): Promise<HumanReadable<TReturn>>

export function query(fnArg: any, paramsOrMode?: any, modeArg?: 'cached'): Promise<any> {
  const hasParams = modeArg !== undefined || (paramsOrMode && paramsOrMode !== 'cached')
  const params = hasParams ? paramsOrMode : undefined
  const mode = hasParams ? modeArg : paramsOrMode

  const customQueries = getCustomQueries()
  const queryRequest = resolveQuery({ customQueries, fn: fnArg, params })
  const runner = getRunner()

  const out = runner(queryRequest as any, {
    type: mode === 'cached' ? 'unknown' : 'complete',
  })

  console.log('wtf', runner, out, queryRequest, customQueries, fnArg)

  return out
}
