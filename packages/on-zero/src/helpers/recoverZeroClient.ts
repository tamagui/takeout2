import type { Emitter } from '@take-out/helpers'
import type { ZeroEvent } from '../types'
import type { UpdateNeededReason } from '@rocicorp/zero'
import type { Context, LogLevel, LogSink } from '@rocicorp/logger'

// per-reason guard window: the SAME reason re-failing right after its reload is
// surfaced as fatal instead of reload-storming on something the reload can't fix.
const RECOVER_GUARD_MS = 60_000

// the fatal local-store-loss signature Zero logs when the IndexedDB it expects
// is gone (evicted, or deleted by another tab).
const LOCAL_STORE_LOST = 'Expected IndexedDB not found'

export type ZeroRecoveryDeps = {
  // delete THIS client's local persistent state (its own scoped IDB). pass the
  // instance's `.delete`. recovery is per-instance, so a combined client drops
  // EVERY underlying store; the latch below keeps it to one reload.
  deleteLocalState: () => Promise<unknown>
  // recovery lifecycle for consumers (preview postMessage, toast, …).
  zeroEvents: Emitter<ZeroEvent | null>
  // awaited before the reload — e.g. wait for the dev origin to come back so the
  // reload doesn't land on a restarting server. optional.
  beforeReload?: () => Promise<void>
  // injectable for tests; defaults to a real page reload.
  reload?: () => void
}

// one reload per page-load. the local-state deletes that must precede it are
// collected here so EVERY affected instance (a combined client has several) drops
// its own store before we reload — not just whichever instance fired first.
let reloadScheduled = false
const pendingDeletes: Array<Promise<unknown>> = []

// cross-page-load, per-reason guard: distinct keys mean a NewClientGroup recovery
// never suppresses a later SchemaVersionNotSupported one. it survives the reload
// (sessionStorage), so a reason that reloaded then immediately re-fires is caught
// as a genuine fatal instead of reload-storming across loads.
function recoveryGuardOpen(reasonKey: string): boolean {
  try {
    const key = `on-zero-recover-${reasonKey}`
    const last = Number(window.sessionStorage.getItem(key) || 0)
    if (Date.now() - last < RECOVER_GUARD_MS) return false
    window.sessionStorage.setItem(key, String(Date.now()))
  } catch {
    // no sessionStorage (private mode) — fall back to the in-memory latch.
  }
  return true
}

function recover(
  deps: ZeroRecoveryDeps,
  reasonKey: string,
  message: string,
  dropLocalState: boolean,
): void {
  if (typeof window === 'undefined') return
  // each affected instance drops its OWN stale store, even when a reload is
  // already queued — otherwise a sibling's store survives the reload and
  // fatal-loops on the next boot. the single scheduled reload awaits these.
  if (dropLocalState) {
    pendingDeletes.push(
      Promise.resolve()
        .then(deps.deleteLocalState)
        .catch(() => {}),
    )
  }
  // only ONE reload per page-load; a later trigger just contributes its delete.
  if (reloadScheduled) return
  if (!recoveryGuardOpen(reasonKey)) {
    console.error(`[on-zero] ${message} — already recovered once, not reloading`)
    deps.zeroEvents.emit({ type: 'fatal', reason: message })
    return
  }
  reloadScheduled = true
  console.warn(`[on-zero] ${message} — recovering`)
  deps.zeroEvents.emit({ type: 'recovering', reason: message })
  const doReload = deps.reload ?? (() => window.location.reload())
  // defer one microtask so sibling instances failing in the same tick enqueue
  // their deletes first, then await them all before reloading.
  Promise.resolve()
    .then(() => Promise.allSettled(pendingDeletes))
    .then(() => deps.beforeReload?.())
    .catch(() => {})
    .finally(doReload)
}

// passing our own onUpdateNeeded/onClientStateNotFound DISABLES Zero's built-in
// reloadWithReason, so these handlers are the ONLY recovery — they must cover
// every reason or the app fatal-blanks forever.
export function makeZeroRecovery(deps: ZeroRecoveryDeps) {
  return {
    onUpdateNeeded(reason: UpdateNeededReason) {
      // every update-needed reason needs new client code → reload. but only
      // SchemaVersionNotSupported means the local rows are now incompatible:
      // mirror Zero's own decision (it disables the client group only for that
      // reason). NewClientGroup / VersionNotSupported are code-version mismatches
      // whose data is still valid — and delete() there would wipe the IndexedDB
      // OTHER live tabs of this user share (the store is keyed by user+storageKey,
      // not per-tab), e.g. the newer tab that triggered NewClientGroup.
      const dropLocalState = reason.type === 'SchemaVersionNotSupported'
      recover(
        deps,
        reason.type,
        `update needed (${reason.message || reason.type})`,
        dropLocalState,
      )
    },
    onClientStateNotFound() {
      // local/server sync state is gone or rejected — the store is unusable, so
      // drop it and reload into a fresh client.
      recover(deps, 'client-state-not-found', 'client state not found', true)
    },
  }
}

// preserve Zero's default console output: we MUST install a logSink to watch for
// the corruption signature, but doing so replaces Zero's built-in console sink —
// so when the consumer passes none, mirror Zero's key=value context prefix here
// instead of silently swallowing every log.
function logToConsole(
  level: LogLevel,
  context: Context | undefined,
  ...args: unknown[]
): void {
  const prefix = context
    ? Object.entries(context)
        .map(([key, value]) => (value === undefined ? key : `${key}=${value}`))
        .join(' ')
    : ''
  const method = level === 'debug' ? 'debug' : level
  console[method](...(prefix ? [prefix] : []), ...args)
}

// watch error-level logs for the local-store-lost signature (the one fatal Zero
// surfaces only through the log, not the structured callbacks) and trigger the
// same recovery. forwards to the consumer sink, or to the console when there is
// none. wire this ONLY when the consumer didn't pass their own logSink, so a
// consumer that owns log-based recovery isn't double-fired.
export function composeRecoveryLogSink(
  deps: ZeroRecoveryDeps,
  consumerLogSink?: LogSink,
): LogSink {
  const consumerFlush = consumerLogSink?.flush
  return {
    log(level: LogLevel, context: Context | undefined, ...args: unknown[]): void {
      if (consumerLogSink) consumerLogSink.log(level, context, ...args)
      else logToConsole(level, context, ...args)
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
        recover(deps, 'local-store', 'local store lost', true)
      }
    },
    // call through the consumer sink so a class-based sink keeps its `this`,
    // rather than handing Zero a detached method reference.
    flush: consumerFlush ? () => consumerFlush.call(consumerLogSink) : undefined,
  }
}

// test-only: the reload latch + pending deletes are in-memory (a real page reload
// clears them); tests simulate that reset between successive "page loads".
export function resetRecoveryStateForTests() {
  reloadScheduled = false
  pendingDeletes.length = 0
}
