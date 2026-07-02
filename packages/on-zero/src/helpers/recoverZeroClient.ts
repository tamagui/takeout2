import type { Emitter } from '@take-out/helpers'
import type { ZeroEvent } from '../types'
import type { UpdateNeededReason } from '@rocicorp/zero'
import type { Context, LogLevel, LogSink } from '@rocicorp/logger'

// per-reason guard window: the SAME reason re-failing right after its reload is
// surfaced as fatal instead of reload-storming on something the reload can't fix.
const RECOVER_GUARD_MS = 60_000

// if the scheduled reload never actually takes the page down (a consumer's
// scheduleReload deferred it, a native reload no-oped, or reload() threw) the
// module latch would stay set and kill EVERY later recovery for the page's
// life. time it out so recovery can try again — a real reload tears down the
// context long before this fires, so it only matters when the reload didn't
// land.
const RELOAD_LATCH_TIMEOUT_MS = 15_000

// the fatal local-store-loss signature Zero logs when the IndexedDB it expects
// is gone (evicted, or deleted by another tab).
const LOCAL_STORE_LOST = 'Expected IndexedDB not found'
const SQLITE_ERROR_NAME = 'SqliteError'
const SQLITE_STATEMENT_FINALIZED = 'This statement has been finalized'
const STORE_CLOSED = 'Store is closed'
const STORE_CLOSED_REPEAT_MIN_MS = 2_000
const STORE_CLOSED_REPEAT_MAX_MS = 60_000

export type ZeroRecoveryLogReason =
  | 'indexeddb-not-found'
  | 'sqlite-statement-finalized'
  | 'store-closed-repeat'
  | 'mutation-desync'
  | 'connection-cookie-invalid'
  | 'client-not-found'
  | 'connection-userid-mismatch'

export type ZeroRecoveryLogClassification = {
  reason: ZeroRecoveryLogReason
  reasonKey: string
  message: string
  dropLocalState: boolean
}

// a minimal synchronous key/value store the cross-reload guard persists into.
// web defaults to sessionStorage; native (Hermes) has none, so a consumer can
// inject an MMKV/sqlite-backed store to get cross-reload loop protection — the
// in-memory guard already covers within-a-page-load.
export type RecoveryGuardStorage = {
  getItem: (key: string) => string | null
  setItem: (key: string, value: string) => void
}

// what a scheduleReload consumer receives so it can gate/annotate the reload
// (soot: IDE-active gate + countdown toast + background-mutation fence; mobile:
// expo-updates reload) while still driving the SAME deletes-then-reload work.
export type ScheduleReloadContext = {
  reason: string
  reasonKey: string
  dropLocalState: boolean
  // deletes every affected instance's local store, awaits beforeReload, then
  // reloads. idempotent — safe to call once the consumer decides to proceed.
  performReload: () => Promise<void>
}

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
  // take over WHEN/HOW the recovery reload happens. default: immediate guarded
  // reload. the consumer decides (defer until safe, show a countdown, reload
  // natively) but still calls ctx.performReload to run the real work.
  scheduleReload?: (ctx: ScheduleReloadContext) => void
  // cross-reload guard backing store (defaults to sessionStorage on web). inject
  // a native KV so Hermes gets real cross-reload loop protection.
  guardStorage?: RecoveryGuardStorage
  // called with the joined log text for a classified recovery signature; return
  // true to treat it as benign and NOT recover (soot's cf cold-boot timeout).
  benignLogFilter?: (message: string) => boolean
  // injectable for tests; defaults to a real page reload.
  reload?: () => void
}

// one reload per page-load. the local-state deletes that must precede it are
// collected here so EVERY affected instance (a combined client has several) drops
// its own store before we reload — not just whichever instance fired first. they
// are thunks (not started promises) so a deferred reload can't leave the app
// running on an already-deleted store: the deletes run only when the reload
// actually proceeds.
let reloadScheduled = false
let reloadInProgress = false
let reloadLatchTimer: ReturnType<typeof setTimeout> | undefined
const pendingDeletes: Array<() => Promise<unknown>> = []

// within-a-page-load per-reason guard: real loop protection everywhere,
// including Hermes (no storage needed). a reload wipes it, which is why the
// injectable storage below survives across reloads.
const inMemoryGuard = new Map<string, number>()

function defaultGuardStorage(): RecoveryGuardStorage | undefined {
  try {
    if (typeof window === 'undefined' || !window.sessionStorage) return undefined
    return window.sessionStorage
  } catch {
    // sessionStorage access throws in some sandboxes / Hermes — no web store.
    return undefined
  }
}

// cross-page-load, per-reason guard: distinct keys mean a NewClientGroup recovery
// never suppresses a later SchemaVersionNotSupported one. the in-memory tier
// catches re-fires within a page-load (works on Hermes); the storage tier
// survives the reload, so a reason that reloaded then immediately re-fires is
// caught as a genuine fatal instead of reload-storming across loads.
function recoveryGuardOpen(
  reasonKey: string,
  guardStorage: RecoveryGuardStorage | undefined,
): boolean {
  const key = `on-zero-recover-${reasonKey}`
  const now = Date.now()

  const memLast = inMemoryGuard.get(key) ?? 0
  if (memLast > 0 && now - memLast < RECOVER_GUARD_MS) return false

  const storage = guardStorage ?? defaultGuardStorage()
  if (storage) {
    try {
      const rawLast = storage.getItem(key)
      const last = rawLast ? Number(rawLast) : 0
      if (last > 0 && now - last < RECOVER_GUARD_MS) return false
      storage.setItem(key, String(now))
    } catch {
      // storage unavailable mid-flight — the in-memory tier is the floor.
    }
  }

  inMemoryGuard.set(key, now)
  return true
}

// "Store is closed" is noisy during intentional instance replacement. One log is
// teardown noise; repeated logs seconds apart mean a live client is stuck using a
// closed local store and needs fresh local state.
let lastStoreClosedAtMs = 0

function armReloadLatchTimeout() {
  if (typeof setTimeout !== 'function') return
  if (reloadLatchTimer) clearTimeout(reloadLatchTimer)
  reloadLatchTimer = setTimeout(() => {
    reloadLatchTimer = undefined
    // re-open SCHEDULING only. a reload that never landed (still deferred behind
    // a consumer's IDE gate / countdown, which can hold for minutes) must not
    // kill future recovery — but the deferred performReload still owns the
    // pending delete thunks and, if it is already mid-flight (a slow
    // beforeReload can exceed this timeout), reloadInProgress must stay set so a
    // second recovery can't double-drive the reload. so touch neither
    // pendingDeletes nor reloadInProgress here.
    reloadScheduled = false
  }, RELOAD_LATCH_TIMEOUT_MS)
  // don't hold the event loop open (node/native) waiting on this defense timer.
  if (
    reloadLatchTimer &&
    typeof reloadLatchTimer === 'object' &&
    'unref' in reloadLatchTimer
  ) {
    reloadLatchTimer.unref()
  }
}

function disarmReloadLatchTimeout() {
  if (reloadLatchTimer) {
    clearTimeout(reloadLatchTimer)
    reloadLatchTimer = undefined
  }
}

// deletes every collected instance's local store, awaits beforeReload, then
// reloads. deferred a microtask so sibling instances failing in the same tick
// enqueue their deletes first. idempotent: a consumer that calls performReload
// twice (or after the latch timeout) only runs one reload.
function performReload(deps: ZeroRecoveryDeps): Promise<void> {
  if (reloadInProgress) return Promise.resolve()
  reloadInProgress = true
  // the consumer has committed to reloading, so the un-latch timeout has no job
  // now — disarm it before the (possibly slow) delete/beforeReload chain so it
  // can't fire mid-flight and re-open scheduling under an in-progress reload.
  disarmReloadLatchTimeout()
  // resolve the reload exactly as @rocicorp/zero does internally
  // (`getBrowserGlobal('location')?.reload()`, zero.js): read location off the
  // global and optional-chain through it. a non-DOM host with a `window` shim
  // but no real `location` (the sootsim tenant render-worker hides `location`
  // for isolation) then drops its stale IDB and no-ops the reload — letting the
  // host remount — instead of throwing "reading 'reload'" on undefined.
  const doReload = deps.reload ?? (() => globalThis.location?.reload?.())
  return Promise.resolve()
    .then(() => Promise.allSettled(pendingDeletes.splice(0).map((run) => run())))
    .then(() => deps.beforeReload?.())
    .catch(() => {})
    .then(() => {
      doReload()
    })
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
    pendingDeletes.push(() => Promise.resolve().then(deps.deleteLocalState))
  }
  // only ONE reload per page-load; a later trigger just contributes its delete.
  if (reloadScheduled) return
  if (!recoveryGuardOpen(reasonKey, deps.guardStorage)) {
    console.error(`[on-zero] ${message} — already recovered once, not reloading`)
    deps.zeroEvents.emit({ type: 'fatal', reason: message })
    return
  }
  reloadScheduled = true
  armReloadLatchTimeout()
  console.warn(`[on-zero] ${message} — recovering`)
  deps.zeroEvents.emit({ type: 'recovering', reason: message })

  const runReload = () => performReload(deps)
  if (deps.scheduleReload) {
    deps.scheduleReload({
      reason: message,
      reasonKey,
      dropLocalState,
      performReload: runReload,
    })
  } else {
    void runReload()
  }
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

function logArgText(arg: unknown): string {
  if (typeof arg === 'string') return arg
  if (arg instanceof Error) return `${arg.name} ${arg.message} ${arg.stack || ''}`
  if (arg && typeof arg === 'object') {
    const message = 'message' in arg ? (arg as { message?: unknown }).message : undefined
    const name = 'name' in arg ? (arg as { name?: unknown }).name : undefined
    if (typeof message === 'string')
      return `${typeof name === 'string' ? name : ''} ${message}`
  }
  return ''
}

function isBenignStoreClosedLog(text: string): boolean {
  if (/Mutator\s+".*"\s+error on server/i.test(text)) return true
  if (/Mutator\s+".*"\s+app error on client/i.test(text)) return true
  return false
}

// the mutation/connection desync class: the local client group is out of sync
// with the server's last-mutation-id / cookie / client record, so the store is
// unusable and must be dropped + recovered. these surface only through the error
// log, never the structured onClientStateNotFound callback. genuinely app-infra
// signatures (a consumer's synthesized ack-timeout marker, a cold-boot connect
// timeout) are NOT here — a consumer keeps those with benignLogFilter / its own
// handling.
function classifyMutationDesync(
  text: string,
): { reason: ZeroRecoveryLogReason; reasonKey: string; message: string } | undefined {
  if (text.includes('sent mutation ID') && text.includes('but expected')) {
    return {
      reason: 'mutation-desync',
      reasonKey: 'mutation-desync',
      message: 'mutation id desync',
    }
  }
  if (
    text.includes('oooMutation') ||
    text.includes('Server reported an out-of-order mutation')
  ) {
    return {
      reason: 'mutation-desync',
      reasonKey: 'mutation-desync',
      message: 'out-of-order mutation',
    }
  }
  if (text.includes('already processed')) {
    return {
      reason: 'mutation-desync',
      reasonKey: 'mutation-desync',
      message: 'mutation already processed',
    }
  }
  if (text.includes('InvalidConnectionRequestLastMutationID')) {
    return {
      reason: 'mutation-desync',
      reasonKey: 'mutation-desync',
      message: 'invalid connection last mutation id',
    }
  }
  if (text.includes('InvalidConnectionRequestBaseCookie')) {
    return {
      reason: 'connection-cookie-invalid',
      reasonKey: 'connection-cookie-invalid',
      message: 'invalid connection base cookie',
    }
  }
  if (text.includes('ClientNotFound') || text.includes('Client not found')) {
    return {
      reason: 'client-not-found',
      reasonKey: 'client-not-found',
      message: 'client not found',
    }
  }
  if (text.includes('connection userID mismatch')) {
    return {
      reason: 'connection-userid-mismatch',
      reasonKey: 'connection-userid-mismatch',
      message: 'connection user id mismatch',
    }
  }
  return undefined
}

export function classifyZeroRecoveryLog(
  level: LogLevel | string,
  args: readonly unknown[],
  nowMs = Date.now(),
): ZeroRecoveryLogClassification | undefined {
  if (level !== 'error') return undefined
  const text = args.map(logArgText).join(' ')
  if (text.includes(LOCAL_STORE_LOST)) {
    return {
      reason: 'indexeddb-not-found',
      reasonKey: 'local-store',
      message: 'local store lost',
      dropLocalState: true,
    }
  }
  if (text.includes(SQLITE_ERROR_NAME) && text.includes(SQLITE_STATEMENT_FINALIZED)) {
    return {
      reason: 'sqlite-statement-finalized',
      reasonKey: 'sqlite-statement-finalized',
      message: 'sqlite statement finalized',
      dropLocalState: true,
    }
  }
  const desync = classifyMutationDesync(text)
  if (desync) {
    return { ...desync, dropLocalState: true }
  }
  if (text.includes(STORE_CLOSED) && !isBenignStoreClosedLog(text)) {
    const prevMs = lastStoreClosedAtMs
    lastStoreClosedAtMs = nowMs
    if (
      prevMs > 0 &&
      nowMs - prevMs >= STORE_CLOSED_REPEAT_MIN_MS &&
      nowMs - prevMs <= STORE_CLOSED_REPEAT_MAX_MS
    ) {
      return {
        reason: 'store-closed-repeat',
        reasonKey: 'store-closed-repeat',
        message: 'local store closed repeatedly',
        dropLocalState: true,
      }
    }
  }
  return undefined
}

// watch error-level logs for the local-store-lost / desync signatures (the ones
// Zero surfaces only through the log, not the structured callbacks) and trigger
// the same recovery. forwards to the consumer sink, or to the console when there
// is none. wire this ONLY when the consumer didn't pass their own logSink, so a
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
      const recovery = classifyZeroRecoveryLog(level, args)
      if (!recovery) return
      if (deps.benignLogFilter) {
        const text = args.map(logArgText).join(' ')
        if (deps.benignLogFilter(text)) return
      }
      recover(deps, recovery.reasonKey, recovery.message, recovery.dropLocalState)
    },
    // call through the consumer sink so a class-based sink keeps its `this`,
    // rather than handing Zero a detached method reference.
    flush: consumerFlush ? () => consumerFlush.call(consumerLogSink) : undefined,
  }
}

// generic Zero stale-poke / stale-cookie signatures: the client's view is behind
// the server's snapshot cookie, which a plain reconnect resolves — this is not a
// fatal store-loss, so ConnectionMonitor reconnects instead of recovering.
export function isRecoverableZeroStalePokeMessage(message: string): boolean {
  return (
    message.includes('Server returned unexpected base cookie during sync') ||
    (message.includes('Received cookie') &&
      message.includes('is < than last snapshot cookie') &&
      message.includes('ignoring client view'))
  )
}

// test-only: the reload latch + pending deletes + in-memory guard are in-memory
// (a real page reload clears them); tests simulate that reset between successive
// "page loads". the injectable/sessionStorage guard is NOT cleared here — like a
// real reload, it survives, which is what catches an immediate re-fire.
export function resetRecoveryStateForTests() {
  reloadScheduled = false
  reloadInProgress = false
  if (reloadLatchTimer) {
    clearTimeout(reloadLatchTimer)
    reloadLatchTimer = undefined
  }
  pendingDeletes.length = 0
  lastStoreClosedAtMs = 0
  inMemoryGuard.clear()
}
