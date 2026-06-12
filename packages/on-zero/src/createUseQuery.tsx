import { useQuery as zeroUseQuery } from '@rocicorp/zero/react'
import { useEmitterValue, type Emitter } from '@take-out/helpers'
import {
  useContext,
  useEffect,
  useMemo,
  useRef,
  useSyncExternalStore,
  type Context,
} from 'react'

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
function parseUseQueryArgs(paramsOrOptions: any, optionsArg: any) {
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

// --- direct (context-free) query path -------------------------------------

// zero-react's useQuery resolves its zero instance via useZero() → react
// context, i.e. the NEAREST mounted ZeroProvider. with multiple client
// instances nested on one page, every context-path query would materialize
// against the innermost provider's instance regardless of which instance owns
// the query. this hook is the context-free counterpart: it materializes the
// resolved query directly on the owning instance's mounted zero.
//
// tradeoffs vs the context path (acceptable for the bounded, tiny queries the
// non-inner instances own — see combineZeroClients):
//  - no cross-component view dedup (zero-react's viewStore): each hook
//    instance materializes its own view.
//  - no strict-mode double-render protection: a discarded render's view is
//    not destroyed until the owning zero closes.

const DISABLED_SUBSCRIBE = () => () => {}
// upstream zero-react returns [undefined, {type:'unknown'}] when disabled
const DISABLED_SNAPSHOT: readonly [undefined, { type: 'unknown' }] = [
  undefined,
  { type: 'unknown' },
]
const getDisabledSnapshot = () => DISABLED_SNAPSHOT

type DirectView = {
  subscribe: (notify: () => void) => () => void
  getSnapshot: () => readonly [unknown, { type: string }]
  destroy: () => void
}

// method syntax for bivariant param checks — the real Zero['materialize']
// generic signature must remain assignable to this structural slice. ttl is
// untyped pass-through here, matching the context path (zeroUseQuery's
// options are equally unchecked against upstream's TTL type).
type MaterializableZero = {
  materialize(
    query: any,
    options?: { ttl?: any },
  ): {
    addListener(cb: (data: any, resultType: string) => void): void
    destroy(): void
  }
}

function createDirectView(
  zero: MaterializableZero,
  queryRequest: unknown,
  ttl: UseQueryOptions['ttl'],
): DirectView {
  let snapshot: readonly [unknown, { type: string }] = DISABLED_SNAPSHOT
  const listeners = new Set<() => void>()

  // zero.materialize accepts a QueryRequest (it applies the instance context
  // itself) — the same public api the upstream ViewWrapper uses
  const view = zero.materialize(queryRequest, ttl === undefined ? undefined : { ttl })

  // addListener fires immediately with current data, so the snapshot is
  // populated before react's first getSnapshot. data must be cloned: the
  // underlying view mutates it in place, and useSyncExternalStore requires
  // immutable snapshots to detect changes.
  view.addListener((data, resultType) => {
    snapshot = [
      data === undefined ? undefined : structuredClone(data),
      { type: resultType },
    ]
    for (const listener of listeners) {
      listener()
    }
  })

  return {
    subscribe: (notify) => {
      listeners.add(notify)
      return () => listeners.delete(notify)
    },
    getSnapshot: () => snapshot,
    destroy: () => {
      // identity rotation closes the owning zero before react runs this
      // cleanup (the version bump that swaps the view is post-commit) — the
      // closed instance already removed the view's ttl connection record, so
      // zero's destroy asserts ("Connection not found"). destroy-after-close
      // is semantically a no-op; swallow it instead of killing the route.
      try {
        view.destroy()
      } catch {
        // instance closed first — nothing left to tear down
      }
    },
  }
}

export function createUseQueryDirect<Schema extends ZeroSchema>({
  DisabledContext,
  customQueries,
  getZero,
  zeroVersion,
}: {
  DisabledContext: Context<QueryControlMode>
  customQueries: AnyQueryRegistry
  // the owning instance's mounted zero (null before its provider mounts)
  getZero: () => MaterializableZero | null
  // bumps after commit whenever the mounted zero changes (mount, rotation)
  zeroVersion: Emitter<number>
}): UseQueryHook<Schema> {
  function useQueryDirect(...args: any[]): any {
    const disableMode = useContext(DisabledContext)
    const lastRef = useRef<any>(EMPTY_RESPONSE)
    const [fn, paramsOrOptions, optionsArg] = args

    const version = useEmitterValue(zeroVersion)
    const { params, options } = parseUseQueryArgs(paramsOrOptions, optionsArg)

    let enabled = true
    let ttl: UseQueryOptions['ttl']
    if (typeof options === 'boolean') {
      enabled = options
    } else if (options) {
      enabled = options.enabled !== false
      ttl = options.ttl
    }

    // key the view by VALUE (serialized params), not params object identity —
    // there is no view dedup on this path, so an unstable inline params object
    // must not re-materialize every render
    const paramsKey = params === undefined ? '' : JSON.stringify(params)

    const view = useMemo((): DirectView | null => {
      const zero = getZero()
      if (!enabled || !zero) return null
      const queryRequest = resolveQuery({ customQueries, fn, params })
      return createDirectView(zero, queryRequest, ttl)
      // params is keyed by paramsKey; version re-materializes on a new zero
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [fn, paramsKey, enabled, ttl, version])

    useEffect(() => {
      if (!view) return
      return () => view.destroy()
    }, [view])

    const out = useSyncExternalStore(
      view ? view.subscribe : DISABLED_SUBSCRIBE,
      view ? view.getSnapshot : getDisabledSnapshot,
      view ? view.getSnapshot : getDisabledSnapshot,
    )

    if (!disableMode) {
      lastRef.current = out
      return out
    }

    if (disableMode === 'last-value') {
      return lastRef.current
    }

    return EMPTY_RESPONSE
  }

  return useQueryDirect as UseQueryHook<Schema>
}
