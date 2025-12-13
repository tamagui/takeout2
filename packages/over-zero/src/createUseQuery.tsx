import { defineQuery } from '@rocicorp/zero'
import { useQuery as zeroUseQuery } from '@rocicorp/zero/react'
import { use, useMemo, type Context } from 'react'

import { useZeroDebug } from './helpers/useZeroDebug'
import { getQueryName } from './queryRegistry'

import type {
  AnyCustomQuery,
  HumanReadable,
  Query,
  ReadonlyJSONValue,
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

export type UseQueryHook<Schema extends ZeroSchema> = {
  // overload 1: plain function with params
  <TArg, TTable extends keyof Schema['tables'] & string, TReturn>(
    fn: PlainQueryFn<TArg, Query<TTable, Schema, TReturn>>,
    params: TArg,
    options?: UseQueryOptions | boolean
  ): QueryResult<TReturn>;

  // overload 2: plain function with no params
  <TTable extends keyof Schema['tables'] & string, TReturn>(
    fn: PlainQueryFn<void, Query<TTable, Schema, TReturn>>,
    options?: UseQueryOptions | boolean
  ): QueryResult<TReturn>
}

export function createUseQuery<Schema extends ZeroSchema>({
  DisabledContext,
}: {
  DisabledContext: Context<boolean>
}): UseQueryHook<Schema> {
  const queryCache = new Map<string, AnyCustomQuery>()

  function useQuery(...args: any[]): any {
    const disabled = use(DisabledContext)
    const [fn, paramsOrOptions, optionsArg] = args

    const { actualQuery, options } = useMemo(() => {
      const queryName = getQueryName(fn)

      if (!queryName) {
        throw new Error(
          `Query function not registered. Make sure to export it from a queries file.`
        )
      }

      // determine if this is with params or no params
      const hasParams =
        optionsArg !== undefined ||
        (paramsOrOptions &&
          typeof paramsOrOptions === 'object' &&
          !('enabled' in paramsOrOptions) &&
          !('ttl' in paramsOrOptions))

      const params = hasParams ? paramsOrOptions : undefined
      const opts = hasParams ? optionsArg : paramsOrOptions

      let customQuery = queryCache.get(queryName)
      if (!customQuery) {
        // create a defineQuery wrapper for the plain function
        const definition = defineQuery(({ args }: { args: ReadonlyJSONValue }) => {
          return fn(args)
        })
        // manually create a callable CustomQuery structure
        const callable = (inputArgs?: ReadonlyJSONValue) => ({
          query: callable,
          args: inputArgs,
          '~': 'QueryRequest' as const,
        })
        callable.queryName = queryName
        callable.fn = definition.fn
        callable['~'] = definition['~']
        customQuery = callable as unknown as AnyCustomQuery
        queryCache.set(queryName, customQuery)
      }

      // call the CustomQuery with params if provided to get a QueryRequest
      const query =
        params !== undefined ? (customQuery as any)(params) : (customQuery as any)()

      return { actualQuery: query, options: opts }
    }, [fn, paramsOrOptions, optionsArg])

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

  return useQuery as UseQueryHook<Schema>
}
