import {
  addContextToQuery,
  asQueryInternals,
  DEFAULT_TTL_MS,
  deepClone,
} from '@rocicorp/zero/bindings'
import { useEmitterValue, type Emitter } from '@take-out/helpers'
import { useContext, useMemo, useRef, useSyncExternalStore, type Context } from 'react'

import {
  emptyResponseFor,
  parseUseQueryArgs,
  type QueryControlMode,
  type UseQueryHook,
  type UseQueryOptions,
} from './createUseQuery'
import { resolveQuery } from './resolveQuery'

import type {
  AnyQueryRegistry,
  ReadonlyJSONValue,
  Schema as ZeroSchema,
} from '@rocicorp/zero'

// optional multi-instance adapter. normal apps should use zero-react's native
// useQuery path via createZeroClient; this exists only for nested providers
// where a non-innermost instance cannot be selected through react context.

// see createUseQuery.tsx — empty responses must match the typed contract:
// plural queries get [], singular get undefined. returning null breaks the
// obvious .filter / .find / .length on first render.
const DISABLED_SUBSCRIBE = () => () => {}

type DirectSnapshot = readonly [unknown, { type: string }]

type DirectView = {
  subscribe: (notify: () => void) => () => void
  getSnapshot: () => DirectSnapshot
}

export type MaterializableZero = {
  clientID: string
  context: unknown
  materialize(
    query: any,
    options?: { ttl?: any },
  ): {
    addListener(
      cb: (data: any, resultType: string, error?: DirectQueryError) => void,
    ): void
    destroy(): void
    updateTTL(ttl: any): void
  }
}

export type CreateUseQueryDirect<Schema extends ZeroSchema> = (props: {
  DisabledContext: Context<QueryControlMode>
  customQueries: AnyQueryRegistry
  getZero: () => MaterializableZero | null
  zeroVersion: Emitter<number>
}) => UseQueryHook<Schema>

type DirectResultType = 'unknown' | 'complete' | 'error'
type DirectQueryError = {
  error: 'app' | 'parse'
  message?: string
  details?: unknown
}

const emptyArray: readonly unknown[] = []
const resultTypeUnknown = { type: 'unknown' } as const
const resultTypeComplete = { type: 'complete' } as const
const resultTypeError = { type: 'error' } as const
const emptySnapshotSingularUnknown: DirectSnapshot = [undefined, resultTypeUnknown]
const emptySnapshotSingularComplete: DirectSnapshot = [undefined, resultTypeComplete]
const emptySnapshotSingularError: DirectSnapshot = [undefined, resultTypeError]
const emptySnapshotPluralUnknown: DirectSnapshot = [emptyArray, resultTypeUnknown]
const emptySnapshotPluralComplete: DirectSnapshot = [emptyArray, resultTypeComplete]
const emptySnapshotPluralError: DirectSnapshot = [emptyArray, resultTypeError]

function getDefaultSnapshot(singular: boolean) {
  return singular ? emptySnapshotSingularUnknown : emptySnapshotPluralUnknown
}

function makeError(retry: () => void, error?: DirectQueryError) {
  const message = error?.message ?? 'An unknown error occurred'
  return {
    type: 'error',
    retry,
    refetch: retry,
    error: {
      type: error?.error ?? 'app',
      message,
      ...(error?.details ? { details: error.details } : {}),
    },
  } as const
}

function getSnapshot(
  singular: boolean,
  data: unknown,
  resultType: DirectResultType,
  retry: () => void,
  error?: DirectQueryError,
): DirectSnapshot {
  if (singular && data === undefined) {
    if (resultType === 'complete') return emptySnapshotSingularComplete
    if (resultType === 'error')
      return error ? [undefined, makeError(retry, error)] : emptySnapshotSingularError
    return emptySnapshotSingularUnknown
  }

  // plural queries: data may arrive as null OR undefined from the zero view's
  // initial / disconnected snapshot. either way we expose [], not the raw
  // null/undefined — useQuery's contract is T[] for plural and callers do the
  // obvious .filter / .find / .length / for-of on the first render. without
  // this branch, a null first-snapshot crashes downstream.
  if (!singular && (data == null || (Array.isArray(data) && data.length === 0))) {
    if (resultType === 'complete') return emptySnapshotPluralComplete
    if (resultType === 'error')
      return error ? [emptyArray, makeError(retry, error)] : emptySnapshotPluralError
    return emptySnapshotPluralUnknown
  }

  if (resultType === 'complete') return [data, resultTypeComplete]
  if (resultType === 'error') return [data, makeError(retry, error)]
  return [data, resultTypeUnknown]
}

class DirectViewWrapper implements DirectView {
  private view: ReturnType<MaterializableZero['materialize']> | undefined
  private snapshot: DirectSnapshot
  private readonly listeners = new Set<() => void>()
  private destroyTimer: ReturnType<typeof setTimeout> | undefined

  constructor(
    private readonly query: any,
    private readonly zero: MaterializableZero,
    private ttl: UseQueryOptions['ttl'] | number,
    private readonly singular: boolean,
    private readonly onDematerialized: (view: DirectViewWrapper) => void,
  ) {
    this.snapshot = getDefaultSnapshot(singular)
    this.materializeIfNeeded()
  }

  private onData = (data: unknown, resultType: string, error?: DirectQueryError) => {
    const cloned = data === undefined ? undefined : deepClone(data as ReadonlyJSONValue)
    this.snapshot = getSnapshot(
      this.singular,
      cloned,
      resultType as DirectResultType,
      this.retry,
      error,
    )
    for (const listener of this.listeners) {
      listener()
    }
  }

  private retry = () => {
    this.destroyView()
    this.materializeIfNeeded()
  }

  private materializeIfNeeded() {
    if (this.view) return
    this.view = this.zero.materialize(this.query, { ttl: this.ttl })
    this.view.addListener(this.onData)
  }

  private destroyView() {
    const current = this.view
    this.view = undefined
    if (!current) return
    try {
      current.destroy()
    } catch {
      // the owning zero can close before react unsubscribes during rotation
    }
  }

  updateTTL(ttl: UseQueryOptions['ttl'] | number) {
    this.ttl = ttl
    this.view?.updateTTL(ttl)
  }

  subscribe = (notify: () => void) => {
    this.listeners.add(notify)
    if (this.destroyTimer !== undefined) {
      clearTimeout(this.destroyTimer)
      this.destroyTimer = undefined
    }
    this.materializeIfNeeded()

    return () => {
      this.listeners.delete(notify)
      if (this.listeners.size === 0) {
        this.destroyTimer = setTimeout(() => {
          this.destroyTimer = undefined
          if (this.listeners.size > 0) return
          this.destroyView()
          this.onDematerialized(this)
        }, 10)
      }
    }
  }

  getSnapshot = () => this.snapshot
}

class DirectViewStore {
  private readonly views = new Map<string, DirectViewWrapper>()

  getView(
    zero: MaterializableZero,
    queryRequest: unknown,
    enabled: boolean,
    ttl: UseQueryOptions['ttl'] | number,
  ): DirectView {
    const query = addContextToQuery(queryRequest as any, zero.context as any)
    const queryInternals = asQueryInternals(query)

    if (!enabled) {
      const snapshot = getDefaultSnapshot(queryInternals.format.singular)
      return {
        subscribe: DISABLED_SUBSCRIBE,
        getSnapshot: () => snapshot,
      }
    }

    const hash = `${zero.clientID}:${queryInternals.hash()}`
    let view = this.views.get(hash)
    if (!view) {
      view = new DirectViewWrapper(
        query,
        zero,
        ttl,
        queryInternals.format.singular,
        (dematerialized) => {
          if (this.views.get(hash) === dematerialized) {
            this.views.delete(hash)
          }
        },
      )
      this.views.set(hash, view)
    } else {
      view.updateTTL(ttl)
    }

    return view
  }
}

export function createUseQueryDirect<Schema extends ZeroSchema>({
  DisabledContext,
  customQueries,
  getZero,
  zeroVersion,
}: Parameters<CreateUseQueryDirect<Schema>>[0]): UseQueryHook<Schema> {
  // SSG: return an inert hook — see createUseQuery for the rationale. default
  // to the plural empty shape (most queries are plural; a singular caller can
  // tolerate [] better than the non-singular caller can tolerate null/undefined).
  if (typeof window === 'undefined') {
    return ((_fn: any) => emptyResponseFor(undefined)) as UseQueryHook<Schema>
  }

  const directViewStore = new DirectViewStore()

  function useQueryDirect(...args: any[]): any {
    const disableMode = useContext(DisabledContext)
    const [fn, paramsOrOptions, optionsArg] = args

    const version = useEmitterValue(zeroVersion)
    const { params, options } = parseUseQueryArgs(paramsOrOptions, optionsArg)

    let enabled = true
    let ttl: UseQueryOptions['ttl'] | number = DEFAULT_TTL_MS
    if (typeof options === 'boolean') {
      enabled = options
    } else if (options) {
      enabled = options.enabled !== false
      ttl = options.ttl ?? DEFAULT_TTL_MS
    }

    const paramsKey = params === undefined ? '' : JSON.stringify(params)

    // resolve the query once so we know its singular/plural format up front —
    // the no-zero / disabled snapshot needs to match that format so .filter /
    // .find / .length is safe on first render.
    const queryRequest = useMemo(
      () => resolveQuery({ customQueries, fn, params }),
      // params is keyed by paramsKey
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [fn, paramsKey],
    )

    const emptyForQuery = useMemo(() => emptyResponseFor(queryRequest), [queryRequest])
    const lastRef = useRef<any>(emptyForQuery)

    const view = useMemo((): DirectView | null => {
      const zero = getZero()
      if (!zero) return null
      return directViewStore.getView(zero, queryRequest, enabled, ttl)
      // version re-materializes on a new zero
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [queryRequest, enabled, ttl, version])

    const getEmpty = () => emptyForQuery as DirectSnapshot
    const out = useSyncExternalStore(
      view ? view.subscribe : DISABLED_SUBSCRIBE,
      view ? view.getSnapshot : getEmpty,
      view ? view.getSnapshot : getEmpty,
    )

    if (!disableMode) {
      lastRef.current = out
      return out
    }

    if (disableMode === 'last-value') {
      return lastRef.current
    }

    return emptyForQuery
  }

  return useQueryDirect as UseQueryHook<Schema>
}
