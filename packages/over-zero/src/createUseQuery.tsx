import { useQuery as zeroUseQuery } from '@rocicorp/zero/react'
import { use, useMemo, type Context } from 'react'

import { useZeroDebug } from './helpers/useZeroDebug'
import { getQueryName } from './queryRegistry'

import type {
  AnyQueryRegistry,
  HumanReadable,
  Query,
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
  customQueries,
}: {
  DisabledContext: Context<boolean>
  customQueries: AnyQueryRegistry
}): UseQueryHook<Schema> {
  function useQuery(...args: any[]): any {
    const disabled = use(DisabledContext)
    const [fn, paramsOrOptions, optionsArg] = args

    const { queryRequest, options } = useMemo(() => {
      const queryName = getQueryName(fn)
      if (!queryName) {
        const fnName = fn?.name || 'anonymous'
        throw new Error(
          `Query function '${fnName}' not registered. ` +
            `Ensure it is exported from a queries file and passed to createZeroClient via groupedQueries.`
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

      // look up the CustomQuery from the shared registry
      // queryName is "namespace.name" format, e.g., "user.userById"
      const [namespace, name] = queryName.split('.', 2)
      const customQuery = (customQueries as any)[namespace]?.[name]

      if (!customQuery) {
        throw new Error(
          `CustomQuery '${queryName}' not found. ` +
            `Check that the query is exported and the namespace/name matches.`
        )
      }

      const queryRequest = params !== undefined ? customQuery(params) : customQuery()

      return { queryRequest, options: opts }
    }, [fn, paramsOrOptions, optionsArg])

    const out = zeroUseQuery(queryRequest as any, options)

    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line react-hooks/rules-of-hooks
      useZeroDebug(queryRequest as any, options, out)
    }

    if (disabled) {
      return [null, { type: 'unknown' }] as never
    }

    return out
  }

  return useQuery as UseQueryHook<Schema>
}
