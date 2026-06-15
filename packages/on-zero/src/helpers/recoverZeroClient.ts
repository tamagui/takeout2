import type { Emitter } from '@take-out/helpers'
import type { ZeroEvent } from '../types'
import type { UpdateNeededReason } from '@rocicorp/zero'
import type { Context, LogLevel, LogSink } from '@rocicorp/logger'

// per-reason loop-guard window. a boot that immediately re-fails within this
// window emits 'fatal' instead of reload-storming.
const RECOVER_GUARD_MS = 60_000

// the fatal local-store-loss signature Zero logs when the IndexedDB it expects
// is gone (evicted, or deleted by another tab).
const LOCAL_STORE_LOST = 'Expected IndexedDB not found'

export type ZeroRecoveryDeps = {
  // delete THIS client's local persistent state (its own scoped IDB). pass the
  // instance's `.delete`. recovery is per-instance, so a combined client drops
  // every underlying store; the shared guard below keeps it to ONE reload.
  deleteLocalState: () => Promise<unknown>
  // recovery lifecycle for consumers (preview postMessage, toast, …).
  zeroEvents: Emitter<ZeroEvent | null>
  // awaited before the reload — e.g. wait for the dev origin to come back so the
  // reload doesn't land on a restarting server. optional.
  beforeReload?: () => Promise<void>
  // injectable for tests; defaults to a real page reload.
  reload?: () => void
}

// distinct keys per reason: a NewClientGroup recovery must never suppress a
// later SchemaVersionNotSupported one.
function recoveryGuardOpen(reasonKey: string): boolean {
  try {
    const key = `on-zero-recover-${reasonKey}`
    const last = Number(window.sessionStorage.getItem(key) || 0)
    if (Date.now() - last < RECOVER_GUARD_MS) return false
    window.sessionStorage.setItem(key, String(Date.now()))
  } catch {
    // no sessionStorage (private mode) — allow the attempt rather than wedge.
  }
  return true
}

function recover(deps: ZeroRecoveryDeps, reasonKey: string, message: string): void {
  if (typeof window === 'undefined') return
  if (!recoveryGuardOpen(reasonKey)) {
    console.error(`[on-zero] ${message} — already recovered once, not reloading`)
    deps.zeroEvents.emit({ type: 'fatal', reason: message })
    return
  }
  console.warn(`[on-zero] ${message} — resetting local state and reloading`)
  deps.zeroEvents.emit({ type: 'recovering', reason: message })
  const doReload = deps.reload ?? (() => window.location.reload())
  Promise.resolve()
    .then(() => deps.deleteLocalState())
    .catch(() => {})
    .then(() => deps.beforeReload?.())
    .catch(() => {})
    .finally(doReload)
}

// every recoverable Zero failure resolves to the same cure: drop stale local
// state and reload, so the fresh boot re-mints the client against the current
// schema (and, when the consumer keys storage by a schema signature, a fresh
// local store). passing our own onUpdateNeeded/onClientStateNotFound DISABLES
// Zero's built-in reloadWithReason, so these handlers are the ONLY recovery —
// they MUST cover every reason or the app fatal-blanks forever.
export function makeZeroRecovery(deps: ZeroRecoveryDeps) {
  return {
    // all update-needed reasons (NewClientGroup / VersionNotSupported /
    // SchemaVersionNotSupported) mean new client code is required, so the cure
    // is a reload; deleting local state first re-keys a fresh store on schema
    // moves and clears corruption on the others.
    onUpdateNeeded(reason: UpdateNeededReason) {
      recover(deps, reason.type, `update needed (${reason.message || reason.type})`)
    },
    // local/server sync state is gone (GC, CVR reset, or server rejection); the
    // instance is dead and must be replaced.
    onClientStateNotFound() {
      recover(deps, 'client-state-not-found', 'client state not found')
    },
  }
}

// compose the consumer's logSink (if any) with a watcher that triggers the same
// recovery on the local-store-lost signature — the one fatal Zero surfaces only
// through the log, not the structured callbacks.
export function composeRecoveryLogSink(
  deps: ZeroRecoveryDeps,
  consumerLogSink?: LogSink,
): LogSink {
  return {
    log(level: LogLevel, context: Context | undefined, ...args: unknown[]): void {
      consumerLogSink?.log(level, context, ...args)
      if (level !== 'error') return
      const text = args
        .map((arg) =>
          typeof arg === 'string'
            ? arg
            : arg && typeof arg === 'object' && 'message' in arg
              ? String((arg as { message: unknown }).message)
              : '',
        )
        .join(' ')
      if (text.includes(LOCAL_STORE_LOST)) {
        recover(deps, 'local-store', 'local store lost')
      }
    },
    flush: consumerLogSink?.flush,
  }
}
