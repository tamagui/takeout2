import { useQuery as zeroUseQuery } from '@rocicorp/zero/react'
import { addContextToQuery, asQueryInternals } from '@rocicorp/zero/bindings'
import { useContext, useMemo, useRef, type Context } from 'react'

import { useZeroDebug } from './helpers/useZeroDebug'
import { resolveQuery, type PlainQueryFn } from './resolveQuery'

import type {
  AnyQueryRegistry,
  HumanReadable,
  Query,
  Schema as ZeroSchema,
} from '@rocicorp/zero'

// false = enabled, 'empty' = disabled (return empty), 'last-value' = disabled (return cached)
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

// shape the "empty" / loading / disabled response to match the typed contract:
// plural queries get [], singular queries get undefined. returning null for a
// plural query (the old `EMPTY_RESPONSE` constant) broke callers that do the
// obvious .filter / .find / .length on the result during the first render.
const EMPTY_PLURAL = Object.freeze([])
const RESULT_UNKNOWN = Object.freeze({ type: 'unknown' as const })
const EMPTY_RESPONSE_PLURAL = Object.freeze([EMPTY_PLURAL, RESULT_UNKNOWN]) as never
const EMPTY_RESPONSE_SINGULAR = Object.freeze([undefined, RESULT_UNKNOWN]) as never

// inspect a resolved query (a Query OR a QueryRequest, i.e. what resolveQuery
// returns from a defineQueries-registered fn) to find its singular/plural
// format. QueryRequests carry a `.query.fn({args, ctx})` that materializes
// the underlying Query — singular vs plural is determined entirely by the
// user-authored query body (`.one()` vs not), so passing an empty `ctx` is
// safe here.
export function emptyResponseFor(queryRequest: unknown): readonly [unknown, { type: string }] {
  try {
    const query = addContextToQuery(queryRequest as any, {} as never)
    const internals = asQueryInternals(query)
    return internals.format.singular ? EMPTY_RESPONSE_SINGULAR : EMPTY_RESPONSE_PLURAL
  } catch {
    // SSG factory / no-resolved-query — default to plural so callers' iteration
    // (.filter / .find / .length / for-of) is always safe.
    return EMPTY_RESPONSE_PLURAL
  }
}

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
  // SSG: return an inert hook. on-zero's bundled React copy isn't the same
  // one the SSG build's renderer initialises, so hook dispatch returns null.
  // an empty response matches how the wrapper behaves under DisabledContext
  // anyway, so consumers see the same shape across SSG and the disabled
  // client path. checking here (factory-time) instead of per-call keeps
  // hook order stable so rules-of-hooks stays happy. we default to the plural
  // shape (data = []) because most queries are plural; a singular query under
  // SSG that depends on undefined-vs-[] is exotic enough to handle at the call
  // site.
  if (typeof window === 'undefined') {
    return (() => EMPTY_RESPONSE_PLURAL) as UseQueryHook<Schema>
  }

  function useQuery(...args: any[]): any {
    const disableMode = useContext(DisabledContext)
    const lastRef = useRef<any>(EMPTY_RESPONSE_PLURAL)
    const [fn, paramsOrOptions, optionsArg] = args

    const { queryRequest, options } = useMemo(() => {
      const { params, options: opts } = parseUseQueryArgs(paramsOrOptions, optionsArg)
      const queryRequest = resolveQuery({ customQueries, fn, params })

      return { queryRequest, options: opts }
    }, [fn, paramsOrOptions, optionsArg])

    // when disabled, force enabled=false through to zero's useQuery so its
    // viewStore returns a disabled view (no zero.clientID read, no view
    // subscription) and the stub Zero handed in by ProvideZero stays inert.
    // we still call zeroUseQuery unconditionally so hook order stays stable
    // across DisabledContext changes — the disable check after only affects
    // the return value.
    const effectiveOptions = disableMode
      ? typeof options === 'boolean'
        ? false
        : { ...(options ?? {}), enabled: false }
      : options
    const out = zeroUseQuery(queryRequest, effectiveOptions)

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
      // first render under last-value mode: lastRef is still the plural default —
      // reshape to match this query's actual format so a singular query gets
      // undefined instead of [].
      if (lastRef.current === EMPTY_RESPONSE_PLURAL) {
        return emptyResponseFor(queryRequest)
      }
      return lastRef.current
    }

    return emptyResponseFor(queryRequest)
  }

  return useQuery as UseQueryHook<Schema>
}
