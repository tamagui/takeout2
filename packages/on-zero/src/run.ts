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
// defaults to 'complete' (fetches from server), pass 'complete' to have client fetch from server
export function run<
  Schema extends ZeroSchema,
  TArg,
  TTable extends keyof Schema['tables'] & string,
  TReturn,
>(
  fn: PlainQueryFn<TArg, Query<TTable, Schema, TReturn>>,
  params: TArg,
  mode?: 'complete'
): Promise<HumanReadable<TReturn>>

export function run<
  Schema extends ZeroSchema,
  TTable extends keyof Schema['tables'] & string,
  TReturn,
>(
  fn: PlainQueryFn<void, Query<TTable, Schema, TReturn>>,
  mode?: 'complete'
): Promise<HumanReadable<TReturn>>

export function run(fnArg: any, paramsOrMode?: any, modeArg?: 'complete'): Promise<any> {
  const hasParams = modeArg !== undefined || (paramsOrMode && paramsOrMode !== 'complete')
  const params = hasParams ? paramsOrMode : undefined
  const mode = hasParams ? modeArg : paramsOrMode

  const customQueries = getCustomQueries()
  const queryRequest = resolveQuery({ customQueries, fn: fnArg, params })
  const runner = getRunner()

  const out = runner(
    queryRequest as any,
    mode === 'complete'
      ? {
          type: 'complete',
        }
      : undefined
  )

  return out
}
