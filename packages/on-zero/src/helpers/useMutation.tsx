import { useCallback, useEffect, useRef, useState } from 'react'

// a Zero mutator call returns this — two promises for the optimistic-local and
// the authoritative-server phases. we never make callers await either one.
type MutatorResultLike = {
  client: Promise<unknown>
  server: Promise<unknown>
}

// normalized error from either phase. `scope` says which run failed:
//   - 'client': the optimistic mutator threw locally (basically a real bug)
//   - 'server': the authoritative run rejected (permission/validation) and Zero
//     rolled the optimistic write back
// `kind` mirrors Zero's MutatorResultDetails error.type ('app' | 'zero').
export type MutationError = {
  scope: 'client' | 'server'
  kind: 'app' | 'zero'
  message: string
  details?: unknown
}

export type MutationState = {
  // a server round-trip from the latest call is in flight. only for guarding a
  // re-submit or a subtle "saving" affordance — never gate the rendered result
  // on this, the optimistic store already updated the UI.
  pending: boolean
  // latest-call error (client or server), or null. render it inline.
  error: MutationError | null
  reset: () => void
}

// global catch so a fire-and-forget mutation can never silently swallow a server
// rejection. apps register a handler (toast/log); with none registered we still
// surface in dev so a swallowed error is impossible.
const mutationErrorListeners = new Set<(error: MutationError) => void>()

export function onMutationError(cb: (error: MutationError) => void): () => void {
  mutationErrorListeners.add(cb)
  return () => {
    mutationErrorListeners.delete(cb)
  }
}

function emitMutationError(error: MutationError): void {
  if (mutationErrorListeners.size === 0) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('[on-zero] unhandled mutation error', error)
    }
    return
  }
  for (const cb of mutationErrorListeners) cb(error)
}

function toMutationError(
  scope: 'client' | 'server',
  details: unknown,
): MutationError | null {
  if (!details || typeof details !== 'object') return null
  const d = details as {
    type?: string
    error?: { type?: string; message?: string; details?: unknown }
  }
  if (d.type !== 'error') return null
  return {
    scope,
    kind: d.error?.type === 'app' ? 'app' : 'zero',
    message: d.error?.message || 'Mutation failed',
    details: d.error?.details,
  }
}

function rejectionToError(scope: 'client' | 'server', e: unknown): MutationError {
  return {
    scope,
    kind: 'zero',
    message: e instanceof Error ? e.message : String(e),
  }
}

/**
 * Wire a mutation result's optimistic-client and authoritative-server phases to
 * normalized errors, without awaiting either. Every error reaches the global
 * `onMutationError` catch (deduped — client and server can surface the same
 * failure); an optional `onError` sink receives them too (the hook uses it for
 * local state). Use this directly for a fire-and-forget call outside React:
 *
 *   observeMutation(zero.mutate.post.delete({ id }))
 *
 * Resolves once both phases settle. Never rejects.
 */
export function observeMutation(
  result: MutatorResultLike,
  onError?: (error: MutationError) => void,
): Promise<void> {
  let reportedGlobal = false
  const report = (err: MutationError | null) => {
    if (!err) return
    onError?.(err)
    // first error per call reaches the global catch
    if (!reportedGlobal) {
      reportedGlobal = true
      emitMutationError(err)
    }
  }
  const client = result.client
    .then((d) => report(toMutationError('client', d)))
    .catch((e) => report(rejectionToError('client', e)))
  const server = result.server
    .then((d) => report(toMutationError('server', d)))
    .catch((e) => report(rejectionToError('server', e)))
  return Promise.all([client, server]).then(() => undefined)
}

/**
 * Bind one Zero mutator to local pending/error state without ever awaiting it.
 *
 *   const [insertPost, state] = useMutation(zero.mutate.post.insert)
 *   insertPost({ ... })          // fires optimistically, returns immediately
 *   state.error                  // render inline; client OR server failures land here
 *   state.pending                // only to guard a re-submit, not to gate the UI
 *
 * The returned mutator has the exact same signature as the one passed in, so arg
 * types are preserved. It returns Zero's native `{ client, server }` for the rare
 * authoritative-wait escape hatch — product code should not await it. Every error
 * also flows to `onMutationError` so a fire-and-forget call is never silent.
 *
 * For N writes use one custom mutator that loops `tx.mutate` in a single
 * transaction, not N calls — that keeps it atomic and a single state.
 */
export function useMutation<Fn extends (...args: any[]) => MutatorResultLike>(
  mutator: Fn,
): [Fn, MutationState] {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<MutationError | null>(null)
  const seqRef = useRef(0)
  const mountedRef = useRef(true)
  const mutatorRef = useRef(mutator)
  mutatorRef.current = mutator

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  const reset = useCallback(() => {
    setError(null)
    setPending(false)
  }, [])

  const run = useCallback((...args: any[]) => {
    const result = mutatorRef.current(...args)
    const seq = ++seqRef.current
    setPending(true)
    setError(null)

    // latest-wins: only the most recent call's error/pending touch state
    const isCurrent = () => mountedRef.current && seq === seqRef.current
    observeMutation(result, (err) => {
      if (isCurrent()) setError(err)
    }).finally(() => {
      if (isCurrent()) setPending(false)
    })

    return result
  }, []) as Fn

  return [run, { pending, error, reset }]
}
