import { useQuery as zeroUseQuery } from '@rocicorp/zero/react'
import { useContext, useMemo, useRef, type Context } from 'react'

import { useZeroDebug } from './helpers/useZeroDebug'
import { resolveQuery, type PlainQueryFn } from './resolveQuery'

import type {
  AnyQueryRegistry,
  HumanReadable,
  Query,
  Schema as ZeroSchema,
} from '@rocicorp/zero'

// false = enabled, 'empty' = disabled (return null), 'last-value' = disabled (return cached)
export type QueryControlMode = false | 'empty' | 'last-value'

export type UseQueryOptions = {
  enabled?: boolean | undefined
  ttl?: 'always' | 'never' | number | undefined
}

type QueryResultDetails = ReturnType<typeof zeroUseQuery>[1]
export type QueryResult<TReturn> = readonly [HumanReadable<TReturn>, QueryResultDetails]

export type { PlainQueryFn }

export type UseQueryHook<Schema extends ZeroSchema> = {
  // overload 1: plain function with params
  <TArg, TTable extends keyof Schema['tables'] & string, TReturn>(
    fn: PlainQueryFn<TArg, Query<TTable, Schema, TReturn>>,
    params: TArg,
    options?: UseQueryOptions | boolean,
  ): QueryResult<TReturn>;

  // overload 2: plain function with no params
  <TTable extends keyof Schema['tables'] & string, TReturn>(
    fn: PlainQueryFn<void, Query<TTable, Schema, TReturn>>,
    options?: UseQueryOptions | boolean,
  ): QueryResult<TReturn>
}

const EMPTY_RESPONSE = [null, { type: 'unknown' }] as never

// determine if useQuery-style args are (fn, params, options) or (fn, options)
export function parseUseQueryArgs(paramsOrOptions: any, optionsArg: any) {
  const hasParams =
    optionsArg !== undefined ||
    (paramsOrOptions &&
      typeof paramsOrOptions === 'object' &&
      !('enabled' in paramsOrOptions) &&
      !('ttl' in paramsOrOptions))

  return {
    params: hasParams ? paramsOrOptions : undefined,
    options: hasParams ? optionsArg : paramsOrOptions,
  }
}

export function createUseQuery<Schema extends ZeroSchema>({
  DisabledContext,
  customQueries,
}: {
  DisabledContext: Context<QueryControlMode>
  customQueries: AnyQueryRegistry
}): UseQueryHook<Schema> {
  function useQuery(...args: any[]): any {
    const disableMode = useContext(DisabledContext)
    const lastRef = useRef<any>(EMPTY_RESPONSE)
    const [fn, paramsOrOptions, optionsArg] = args

    const { queryRequest, options } = useMemo(() => {
      const { params, options: opts } = parseUseQueryArgs(paramsOrOptions, optionsArg)
      const queryRequest = resolveQuery({ customQueries, fn, params })

      return { queryRequest, options: opts }
    }, [fn, paramsOrOptions, optionsArg])

    const out = zeroUseQuery(queryRequest, options)

    if (process.env.NODE_ENV === 'development') {
      if (process.env.DEBUG_ZERO_QUERIES === '1')
        // eslint-disable-next-line react-hooks/rules-of-hooks
        useZeroDebug(queryRequest, options, out)
    }

    if (!disableMode) {
      lastRef.current = out
      return out
    }

    if (disableMode === 'last-value') {
      return lastRef.current
    }

    return EMPTY_RESPONSE
  }

  return useQuery as UseQueryHook<Schema>
}
