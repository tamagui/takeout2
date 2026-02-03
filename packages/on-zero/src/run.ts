import { resolveQuery, type PlainQueryFn } from './resolveQuery'
import { getRunner, type RunOptions } from './zeroRunner'

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

// run a query once and return results (non-reactive)
export function run<
  Schema extends ZeroSchema,
  TArg,
  TTable extends keyof Schema['tables'] & string,
  TReturn,
>(
  fn: PlainQueryFn<TArg, Query<TTable, Schema, TReturn>>,
  params: TArg,
  options?: RunOptions
): Promise<HumanReadable<TReturn>>

export function run<
  Schema extends ZeroSchema,
  TTable extends keyof Schema['tables'] & string,
  TReturn,
>(
  fn: PlainQueryFn<void, Query<TTable, Schema, TReturn>>,
  options?: RunOptions
): Promise<HumanReadable<TReturn>>

export function run(
  fnArg: any,
  paramsOrOptions?: any,
  optionsArg?: RunOptions
): Promise<any> {
  const hasParams =
    optionsArg !== undefined || (paramsOrOptions && !('type' in paramsOrOptions))
  const params = hasParams ? paramsOrOptions : undefined
  const options = hasParams ? optionsArg : paramsOrOptions

  const customQueries = getCustomQueries()
  const queryRequest = resolveQuery({ customQueries, fn: fnArg, params })
  const runner = getRunner()

  return runner(queryRequest as any, options)
}
