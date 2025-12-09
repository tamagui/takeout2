import { syncedQuery } from '@rocicorp/zero'
import { useQuery as zeroUseQuery } from '@rocicorp/zero/react'
import { use, useMemo, type Context } from 'react'

import { useZeroDebug } from './helpers/useZeroDebug'
import { getQueryName } from './queryRegistry'

import type {
  HumanReadable,
  Query,
  ReadonlyJSONValue,
  SyncedQuery,
  Schema as ZeroSchema,
} from '@rocicorp/zero'

export type UseQueryOptions = {
  enabled?: boolean | undefined
  ttl?: 'always' | 'never' | number | undefined
}

type QueryResultDetails = ReturnType<typeof zeroUseQuery>[1]
export type QueryResult<TReturn> = readonly [HumanReadable<TReturn>, QueryResultDetails]

export type PlainQueryFn<
  TArg = any,
  TReturn extends Query<any, any, any> = Query<any, any, any>,
> = (args: TArg) => TReturn

// inline query type - only available when DisableInline is false
type InlineQuery<
  Schema extends ZeroSchema,
  TTable extends keyof Schema['tables'] & string,
  TReturn,
> =
  | Query<Schema, TTable, TReturn>
  | SyncedQuery<any, any, any, any, Query<Schema, TTable, TReturn>>

// the useQuery hook type with conditional inline overload
export type UseQueryHook<
  Schema extends ZeroSchema,
  DisableInline extends boolean = false,
> = {
  // overload 1: inline query (only when DisableInline is false)
  <TTable extends keyof Schema['tables'] & string, TReturn>(
    query: DisableInline extends true ? never : InlineQuery<Schema, TTable, TReturn>,
    options?: UseQueryOptions | boolean
  ): QueryResult<TReturn>;

  // overload 2: plain function with params
  <TArg, TTable extends keyof Schema['tables'] & string, TReturn>(
    fn: PlainQueryFn<TArg, Query<Schema, TTable, TReturn>>,
    params: TArg,
    options?: UseQueryOptions | boolean
  ): QueryResult<TReturn>;

  // overload 3: plain function with no params
  <TTable extends keyof Schema['tables'] & string, TReturn>(
    fn: PlainQueryFn<void, Query<Schema, TTable, TReturn>>,
    options?: UseQueryOptions | boolean
  ): QueryResult<TReturn>
}

export function createUseQuery<
  Schema extends ZeroSchema,
  const DisableInline extends boolean = false,
>({
  DisabledContext,
  disableInlineQueries = false as DisableInline,
}: {
  DisabledContext: Context<boolean>
  disableInlineQueries?: DisableInline
}): UseQueryHook<Schema, DisableInline> {
  const queryCache = new Map<string, SyncedQuery<any, any, any, any, any>>()
  const parseAny = (x: unknown[]): [ReadonlyJSONValue] => [x[0] as ReadonlyJSONValue]

  function useQuery(...args: any[]): any {
    const disabled = use(DisabledContext)
    const [queryOrFn, paramsOrOptions, optionsArg] = args

    // detect which calling pattern is being used
    const isPlainFunction = typeof queryOrFn === 'function' && !('queryName' in queryOrFn)

    const { actualQuery, options } = useMemo(() => {
      if (!isPlainFunction) {
        // pattern 1: original api - useQuery(query, options)
        return {
          actualQuery: queryOrFn,
          options: paramsOrOptions,
        }
      }

      const fn = queryOrFn
      const queryName = getQueryName(fn)

      if (!queryName) {
        throw new Error(`No query name?`)
      }

      // determine if this is pattern 2 (with params) or pattern 3 (no params)
      const hasParams =
        optionsArg !== undefined ||
        (paramsOrOptions &&
          typeof paramsOrOptions === 'object' &&
          !('enabled' in paramsOrOptions) &&
          !('ttl' in paramsOrOptions))

      const params = hasParams ? paramsOrOptions : undefined
      const opts = hasParams ? optionsArg : paramsOrOptions

      let synced = queryCache.get(queryName)
      if (!synced) {
        synced = syncedQuery(queryName, parseAny, (arg: ReadonlyJSONValue) => {
          return fn(arg)
        })
        queryCache.set(queryName, synced)
      }

      // call the SyncedQuery with params if provided
      const query = params !== undefined ? (synced as any)(params) : synced

      return { actualQuery: query, options: opts }
    }, [queryOrFn, paramsOrOptions, optionsArg, isPlainFunction])

    console.info('running', { actualQuery, options, queryOrFn })

    const out = zeroUseQuery(actualQuery, options)

    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line react-hooks/rules-of-hooks
      useZeroDebug(actualQuery, options, out)
    }

    if (disabled) {
      return [null, { type: 'unknown' }] as never
    }

    return out
  }

  return useQuery as UseQueryHook<Schema, DisableInline>
}
