// http-pull transport: runs a stock @rocicorp/zero client over stateless HTTP
// by intercepting its /sync/v51/connect WebSocket with a shim that translates
// pull responses into v51 pokes. ported from the orez zero-http spike — the
// wire contract (lexicographic string cookies, gotQueriesPatch poke-part
// ordering, bounded FIFO push batching, updateAuth, 401→Unauthorized frame,
// teardown drain) is pinned by the tests in ./httpPull/ and documented in
// ~/orez/plans/zero-http.md. do not "simplify" any of it without re-running
// those tests against a stock zero client.

type WebSocketProtocols = string | string[] | undefined
type SocketEventType = 'open' | 'message' | 'close' | 'error'
type SocketListener = ((event: any) => void) | { handleEvent(event: any): void }

type WebSocketConstructor = {
  new (url: string | URL, protocols?: WebSocketProtocols): any
  CONNECTING?: number
  OPEN?: number
  CLOSING?: number
  CLOSED?: number
}

type DesiredQueryPatchOp =
  | { op: 'clear' }
  | { op: 'put' | 'del'; hash: string; [key: string]: unknown }

type GotQueryPatchOp = { op: 'clear' } | { op: 'put' | 'del'; hash: string }

// a shipped desired-query put carries an AST (client-resolved by a
// queryTransform, or an ad-hoc query's inline ast) OR name+args for the server
// to resolve. name+args is the auth-sensitive path: the permission transform
// stays server-side, so a client cannot forge the AST.
type QueryPatchOp =
  | { op: 'put'; hash: string; ast: unknown }
  | { op: 'put'; hash: string; name: string; args: readonly unknown[] }
  | { op: 'del'; hash: string }
  | { op: 'clear' }

// transforms a named query's (name, args) into its Zero v51 AST. providing one
// turns the query-aware extension on and resolves desired queries CLIENT-side
// (ship the AST). use for a native host with no query registry, or a trusted
// harness. omit it (with queryForward) to ship name+args and resolve SERVER-side.
export type QueryTransform = (name: string, args: readonly unknown[]) => unknown

type ServerGotQueries = { version: number; patch: GotQueryPatchOp[] }

type PullResponse =
  | {
      cookie: number
      lastMutationIDChanges: Record<string, number>
      rowsPatch: unknown[]
      unchanged?: false
      gotQueries?: ServerGotQueries
    }
  | {
      cookie: number | null
      unchanged: true
      gotQueries?: ServerGotQueries
    }

type PushBody = Record<string, unknown> & {
  mutations: unknown[]
}

type PushBatch = {
  body: unknown
  frameCount: number
  mutationCount: number
}

type TransportState = {
  readonly pageID: string
  readonly transportID: string
  readonly origin: URL
  readonly originString: string
  readonly pullOriginString: string
  readonly pushOriginString: string
  readonly fetch: typeof fetch
  readonly nativeWebSocket: WebSocketConstructor | undefined
  readonly sockets: Set<ZeroHttpSocket>
  readonly pullIntervalMs: number | undefined
  readonly wakeEnabled: boolean
  readonly queryTransform: QueryTransform | undefined
  readonly queryForward: boolean
  readonly queryAware: boolean
  nextPokeID: number
  nextSocketGeneration: number
  readonly activeSocketGenerationByClient: Map<string, number>
  readonly activeSocketByClient: Map<string, ZeroHttpSocket>
  readonly lifecycle: ((event: HttpPullLifecycleEvent) => void) | undefined
}

const COOKIE_WIDTH = 20
// the stock zero-cache pusher drains queued frames into a single request once
// its current request completes. keep the same backpressure relief here, but
// cap the number of mutations so one response cannot monopolize the HTTP
// transport indefinitely under a sustained producer.
const MAX_PUSH_BATCH_MUTATIONS = 64
// @rocicorp/zero 1.6 starts this deadline before its async createSocket work.
// the connect URL's `ts` is captured at the same attempt boundary.
const ZERO_CONNECT_TIMEOUT_MS = 10_000

export type HttpPullTransport = {
  pull(): Promise<void>
  readonly connections: number
  readonly pageID: string
  readonly transportID: string
  uninstall(): void
}

export type HttpPullTransportOptions = {
  origin: string
  // optional authoritative sync endpoint bases. websocket interception and
  // wake stay on origin, while pull/push POST to their configured bases.
  pullOrigin?: string
  pushOrigin?: string
  fetch?: typeof fetch
  // when set, every open connection also pulls on this interval so
  // server-initiated changes arrive without a client-side trigger
  pullIntervalMs?: number
  // when true, each connection also opens a notification-only wake socket to
  // <origin>/wake and pulls immediately on any wake, demoting the interval
  // poll to a safety net. the wake channel carries no data ("pull now" only)
  // and zero correctness weight: a lost or duplicated wake can never cause
  // missed or wrong data because convergence comes from the pull protocol.
  wake?: boolean
  // when provided, the query-aware extension is on and desired queries are
  // resolved client-side to an AST before shipping (native host / trusted
  // harness). omit for the baseline dialect (client-local got-query synthesis).
  queryTransform?: QueryTransform
  // turns the query-aware extension on WITHOUT a client-side transform: desired
  // queries ship as name+args for the SERVER (consumer worker) to resolve with
  // auth. the production path for permission-transformed queries.
  queryForward?: boolean
  // receives the structured connection lifecycle. when omitted, on-zero logs
  // failures so production errors retain their owners without logging routine
  // connection and mutation traffic.
  lifecycle?: (event: HttpPullLifecycleEvent) => void
}

export type HttpPullLifecycleEvent = {
  type:
    | 'created'
    | 'listener'
    | 'open'
    | 'close'
    | 'failure'
    | 'superseded'
    | 'aborted'
    | 'push'
  pageID: string
  transportID: string
  zeroInstanceID: string
  clientGroupID: string
  connectionAttemptID: string
  socketID: string
  generation: number
  activeGeneration: number
  clientID: string
  wsid: string
  timestamp: number
  attemptStartedAt: number | undefined
  attemptAgeMs: number | undefined
  listener?: SocketEventType
  code?: number
  reason?: string
  pushFrameCount?: number
  mutationCount?: number
}

type HttpPullPageRegistry = {
  readonly pageID: string
  nextTransportGeneration: number
  readonly transportsByOrigin: Map<string, HttpPullTransport>
}

const HTTP_PULL_PAGE_REGISTRY = Symbol.for('on-zero.http-pull.page-registry')

function isHttpPullPageRegistry(value: unknown): value is HttpPullPageRegistry {
  return (
    typeof value === 'object' &&
    value !== null &&
    'pageID' in value &&
    typeof value.pageID === 'string' &&
    'nextTransportGeneration' in value &&
    typeof value.nextTransportGeneration === 'number' &&
    'transportsByOrigin' in value &&
    value.transportsByOrigin instanceof Map
  )
}

function getHttpPullPageRegistry(): HttpPullPageRegistry {
  const existing = Reflect.get(globalThis, HTTP_PULL_PAGE_REGISTRY)
  if (isHttpPullPageRegistry(existing)) return existing
  const registry: HttpPullPageRegistry = {
    pageID: `page-${Date.now().toString(36)}`,
    nextTransportGeneration: 0,
    transportsByOrigin: new Map(),
  }
  Reflect.set(globalThis, HTTP_PULL_PAGE_REGISTRY, registry)
  return registry
}

function logHttpPullLifecycle(event: HttpPullLifecycleEvent) {
  if (process.env.NODE_ENV === 'test' || event.type !== 'failure') return
  console.error(`[on-zero:http-pull] ${JSON.stringify(event)}`)
}

export function installHttpPullTransport(
  opts: HttpPullTransportOptions,
): HttpPullTransport {
  const pageRegistry = getHttpPullPageRegistry()
  const transportID = `${pageRegistry.pageID}:transport:${++pageRegistry.nextTransportGeneration}`
  const previousWebSocket = globalThis.WebSocket as WebSocketConstructor | undefined
  const fetchImpl = opts.fetch ?? globalThis.fetch
  if (!fetchImpl) {
    throw new Error('installHttpPullTransport requires a fetch implementation')
  }

  const state: TransportState = {
    pageID: pageRegistry.pageID,
    transportID,
    origin: new URL(opts.origin),
    originString: trimTrailingSlash(new URL(opts.origin).toString()),
    pullOriginString: trimTrailingSlash(
      new URL(opts.pullOrigin ?? opts.origin).toString(),
    ),
    pushOriginString: trimTrailingSlash(
      new URL(opts.pushOrigin ?? opts.origin).toString(),
    ),
    // the transport invokes this as `state.fetch(...)` — without binding,
    // window.fetch sees `state` as its receiver and browsers throw
    // "Illegal invocation" (node's fetch doesn't care, so tests can't catch it)
    fetch: fetchImpl.bind(globalThis),
    nativeWebSocket: previousWebSocket,
    sockets: new Set(),
    pullIntervalMs: opts.pullIntervalMs,
    wakeEnabled: opts.wake ?? false,
    queryTransform: opts.queryTransform,
    queryForward: opts.queryForward === true,
    queryAware: opts.queryTransform !== undefined || opts.queryForward === true,
    nextPokeID: 0,
    nextSocketGeneration: 0,
    activeSocketGenerationByClient: new Map(),
    activeSocketByClient: new Map(),
    lifecycle: opts.lifecycle ?? logHttpPullLifecycle,
  }

  const Shim = class {
    static CONNECTING = 0
    static OPEN = 1
    static CLOSING = 2
    static CLOSED = 3

    constructor(url: string | URL, protocols?: WebSocketProtocols) {
      if (shouldIntercept(state.origin, url)) {
        return new ZeroHttpSocket(state, url, protocols)
      }
      if (!state.nativeWebSocket) {
        throw new Error(`No native WebSocket available for ${String(url)}`)
      }
      return new state.nativeWebSocket(url, protocols)
    }
  }

  globalThis.WebSocket = Shim as unknown as typeof WebSocket

  const transport: HttpPullTransport = {
    pull: async () => {
      await Promise.all([...state.sockets].map((socket) => socket.pull()))
    },
    get connections() {
      return state.sockets.size
    },
    pageID: state.pageID,
    transportID: state.transportID,
    uninstall: () => {
      if (globalThis.WebSocket === (Shim as unknown as typeof WebSocket)) {
        globalThis.WebSocket = previousWebSocket as typeof WebSocket
      }
      const registered = pageRegistry.transportsByOrigin.get(state.originString)
      if (registered === transport) {
        pageRegistry.transportsByOrigin.delete(state.originString)
      }
    },
  }
  return transport
}

// per-origin idempotent install for app usage (ProvideZero rotates zero
// instances against the same server; installing per rotation would chain
// shims unboundedly). installed transports live for the page lifetime.
export function ensureHttpPullTransport(
  opts: HttpPullTransportOptions,
): HttpPullTransport {
  const pageRegistry = getHttpPullPageRegistry()
  const key = trimTrailingSlash(new URL(opts.origin).toString())
  const existing = pageRegistry.transportsByOrigin.get(key)
  if (existing) return existing
  const transport = installHttpPullTransport(opts)
  pageRegistry.transportsByOrigin.set(key, transport)
  return transport
}

class ZeroHttpSocket {
  readonly CONNECTING = 0
  readonly OPEN = 1
  readonly CLOSING = 2
  readonly CLOSED = 3

  readonly url: string
  readyState = this.CONNECTING

  private readonly connectURL: URL
  private authToken: string | undefined
  private readonly listeners: Record<SocketEventType, Set<SocketListener>> = {
    open: new Set(),
    message: new Set(),
    close: new Set(),
    error: new Set(),
  }
  private readonly clientID: string
  private readonly clientGroupID: string
  private readonly wsid: string
  private cookie: string | null
  private pendingGotQueriesPatch: GotQueryPatchOp[] = []
  // query-aware extension state: the accumulated un-acked desired-query delta
  // to ship, a client-side query-state version that bumps on each change, and
  // the version/length of the delta the in-flight pull sent (to clear the
  // acked prefix on the server's ack).
  private desiredQueryPatch: QueryPatchOp[] = []
  private queryVersion = 0
  private sentQueryVersion: number | undefined
  private sentQueryPatchLen = 0
  private pullInFlight: Promise<void> | undefined
  private pullAfterCurrent = false
  private pendingPushes: unknown[] = []
  private pushInFlight = false
  private nextLocalCookieID: number
  private openTimer: ReturnType<typeof setTimeout> | undefined
  private pullTimer: ReturnType<typeof setInterval> | undefined
  private wakeSocket: { close(): void } | undefined
  private wakeReconnectTimer: ReturnType<typeof setTimeout> | undefined
  private readonly generation: number
  private readonly zeroInstanceID: string
  private readonly connectionAttemptID: string
  private readonly socketID: string
  private readonly attemptStartedAt: number | undefined
  private settled = false

  constructor(
    private readonly state: TransportState,
    url: string | URL,
    protocols?: WebSocketProtocols,
  ) {
    this.connectURL = toHttpURL(url)
    this.url = String(url)
    this.clientID = this.connectURL.searchParams.get('clientID') ?? ''
    this.clientGroupID = this.connectURL.searchParams.get('clientGroupID') ?? ''
    this.wsid = this.connectURL.searchParams.get('wsid') ?? `zero-http-${Date.now()}`
    this.generation = ++this.state.nextSocketGeneration
    this.zeroInstanceID = `${this.state.pageID}:zero:${this.clientID}`
    this.connectionAttemptID = `${this.zeroInstanceID}:attempt:${this.wsid}`
    this.socketID = `${this.state.transportID}:socket:${this.generation}`
    const attemptStartedAtParam = this.connectURL.searchParams.get('ts')
    const attemptStartedAt = Number(attemptStartedAtParam)
    this.attemptStartedAt =
      attemptStartedAtParam !== null && Number.isFinite(attemptStartedAt)
        ? attemptStartedAt
        : undefined
    const previousSocket = this.state.activeSocketByClient.get(this.clientID)
    this.state.activeSocketGenerationByClient.set(this.clientID, this.generation)
    this.state.activeSocketByClient.set(this.clientID, this)
    previousSocket?.supersede()
    this.emitLifecycle('created')
    const baseCookie = this.connectURL.searchParams.get('baseCookie')
    this.cookie = baseCookie ? baseCookie : null
    // the local cookie ID is encoded into the suffix of any cookie we
    // already advanced past (toLocalWebSocketCookie). reconnects rehydrate
    // this.cookie from the URL baseCookie param replicache persisted, so we
    // must resume the counter from its suffix — otherwise the first poke on
    // the new socket re-emits an identical suffix and replicache trips
    // "cookie did not change, but patch is not empty" and drops the patch.
    const suffixMatch = this.cookie?.match(/#(\d+)$/)
    this.nextLocalCookieID = suffixMatch ? Number(suffixMatch[1]) : 0

    const decoded = decodeSecProtocol(protocols)
    this.authToken = decoded.authToken
    this.queueDesiredQueries(decoded.initConnectionMessage?.[1])

    this.state.sockets.add(this)
    // open on the next task so Zero can attach its listeners. open() checks the
    // attempt timestamp first, so async socket construction that outlived Zero's
    // deadline closes without delivering an event to abandoned state.
    this.openTimer = setTimeout(() => this.open(), 0)
  }

  addEventListener(type: SocketEventType, listener: SocketListener | null) {
    if (listener) {
      this.listeners[type]?.add(listener)
      this.emitLifecycle('listener', { listener: type })
    }
  }

  removeEventListener(type: SocketEventType, listener: SocketListener | null) {
    if (listener) this.listeners[type]?.delete(listener)
  }

  dispatchEvent(event: { type: SocketEventType }) {
    this.emit(event.type, event)
    return true
  }

  send(data: string) {
    if (this.readyState !== this.OPEN) {
      throw new Error('cannot send on a socket that is not open')
    }
    const message = JSON.parse(data) as [string, any]
    switch (message[0]) {
      case 'initConnection':
      case 'changeDesiredQueries':
        this.queueDesiredQueries(message[1])
        this.requestPullAfterCurrent()
        return
      case 'updateAuth':
        this.authToken = (message[1] as { auth?: string }).auth
        return
      case 'push':
        this.enqueuePush(message[1])
        return
      case 'ping':
        this.emitMessage(['pong', {}])
        return
      case 'pull':
        this.run(this.answerMutationRecoveryPull(message[1]))
        return
      case 'deleteClients':
      case 'ackMutationResponses':
        return
      default:
        throw new Error(`unsupported zero-http upstream message ${message[0]}`)
    }
  }

  close(code = 1000, reason = '') {
    if (!this.settle('close', { code, reason })) return
    this.emit('close', { code, reason, wasClean: code <= 1001 })
  }

  pull(): Promise<void> {
    if (this.readyState !== this.OPEN) return Promise.resolve()
    if (this.pullInFlight) return this.pullInFlight
    this.pullInFlight = this.fetchPull(this.clientGroupID, this.cookie, true)
      .then((response) => {
        if (this.state.queryAware) this.applyServerGotQueries(response)
        if (response.unchanged) {
          this.emitGotQueriesPatch(response.cookie)
          return
        }
        this.emitPoke(response)
      })
      .catch((error) => {
        this.fail(error)
        throw error
      })
      .finally(async () => {
        const pullAgain = this.pullAfterCurrent
        this.pullAfterCurrent = false
        this.pullInFlight = undefined
        if (pullAgain && this.readyState !== this.CLOSED) await this.pull()
      })
    return this.pullInFlight
  }

  private open() {
    if (this.readyState !== this.CONNECTING) return
    const attemptAgeMs = this.getAttemptAgeMs()
    if (attemptAgeMs !== undefined && attemptAgeMs >= ZERO_CONNECT_TIMEOUT_MS) {
      const reason = `zero-http connection attempt ${this.wsid} expired after ${Math.round(
        attemptAgeMs,
      )}ms before socket construction completed`
      if (!this.settle('aborted', { code: 1000, reason })) return
      this.emit('close', { code: 1000, reason, wasClean: true })
      return
    }
    this.readyState = this.OPEN
    this.emitLifecycle('open')
    this.emit('open', {})
    this.emitMessage(['connected', { wsid: this.wsid, timestamp: Date.now() }])
    setTimeout(() => this.run(this.pull()), 0)
    if (this.state.pullIntervalMs) {
      this.pullTimer = setInterval(() => {
        this.run(this.pull())
      }, this.state.pullIntervalMs)
    }
    if (this.state.wakeEnabled) this.openWakeChannel()
  }

  // notification-only wake channel: a real WebSocket to <origin>/wake that
  // carries no data. any frame means "pull now", so a wake triggers an
  // immediate (coalesced) pull — push-shaped propagation without waiting on
  // the poll interval. advisory only: if it drops we reconnect, and the
  // interval poll remains the safety net that guarantees convergence.
  private openWakeChannel() {
    const Native = this.state.nativeWebSocket
    if (!Native || this.wakeSocket || this.readyState !== this.OPEN) return
    const wsBase = this.state.originString.replace(/^http/, 'ws')
    const url = `${wsBase}/wake?clientID=${encodeURIComponent(this.clientID)}`
    let socket: {
      onmessage: (() => void) | null
      onclose: (() => void) | null
      onerror: (() => void) | null
      close(): void
    }
    try {
      socket = new Native(url) as unknown as typeof socket
    } catch {
      return
    }
    this.wakeSocket = socket
    const reconnect = () => {
      if (this.wakeSocket !== socket) return
      this.wakeSocket = undefined
      if (this.readyState !== this.OPEN || this.wakeReconnectTimer) return
      this.wakeReconnectTimer = setTimeout(() => {
        this.wakeReconnectTimer = undefined
        this.openWakeChannel()
      }, 500)
    }
    // route through requestPullAfterCurrent, NOT pull() directly: a wake that
    // lands while a pull is already in flight must set pullAfterCurrent so the
    // in-flight pull re-runs and picks up the woken change. calling pull()
    // directly would return the existing promise and silently drop the wake,
    // leaving convergence to the safety poll (a burst-storm latency bug).
    socket.onmessage = () => this.requestPullAfterCurrent()
    socket.onclose = reconnect
    socket.onerror = reconnect
  }

  private closeWakeChannel() {
    if (this.wakeReconnectTimer) {
      clearTimeout(this.wakeReconnectTimer)
      this.wakeReconnectTimer = undefined
    }
    const socket = this.wakeSocket
    this.wakeSocket = undefined
    if (socket) {
      try {
        socket.close()
      } catch {
        // best effort: an already-closing wake socket is harmless
      }
    }
  }

  private queueDesiredQueries(body: unknown) {
    const desiredQueriesPatch = (body as { desiredQueriesPatch?: unknown })
      ?.desiredQueriesPatch
    if (!Array.isArray(desiredQueriesPatch)) return
    if (!this.state.queryAware) {
      // baseline dialect: synthesize the got-query ack locally
      this.pendingGotQueriesPatch.push(...gotQueriesPatch(desiredQueriesPatch))
      return
    }
    // query-aware: accumulate the desired-query delta to ship to the server. a
    // put ships its inline ast, or a client-resolved ast (queryTransform), or
    // name+args for the server to resolve (queryForward). the server owns the
    // got-query ack.
    const transform = this.state.queryTransform
    for (const op of desiredQueriesPatch as DesiredQueryPatchOp[]) {
      if (op.op === 'clear') {
        this.desiredQueryPatch.push({ op: 'clear' })
      } else if (op.op === 'del') {
        this.desiredQueryPatch.push({ op: 'del', hash: op.hash })
      } else if (op.op === 'put') {
        const inline = (op as { ast?: unknown }).ast
        const name = (op as { name?: string }).name ?? ''
        const args = ((op as { args?: readonly unknown[] }).args ??
          []) as readonly unknown[]
        if (this.state.queryForward) {
          this.desiredQueryPatch.push({ op: 'put', hash: op.hash, name, args })
        } else if (inline !== undefined) {
          this.desiredQueryPatch.push({ op: 'put', hash: op.hash, ast: inline })
        } else if (transform) {
          this.desiredQueryPatch.push({
            op: 'put',
            hash: op.hash,
            ast: transform(name, args),
          })
        }
      }
    }
    this.queryVersion++
  }

  private async push({ body, frameCount, mutationCount }: PushBatch) {
    const response = (await this.postJSON('/push', body)) as {
      pushResponse?: unknown
    }
    this.emitLifecycle('push', {
      pushFrameCount: frameCount,
      mutationCount,
    })
    // mutation RECOVERY pushes carry a PREVIOUS client's pending mutations,
    // and the server response echoes that old clientID. zero-cache's pusher
    // groups results by clientID and only delivers a client its OWN results
    // (recovered mutations settle via lastMutationIDChanges in pokes); the
    // raw response would trip zero's "received mutation for the wrong
    // client" assert and kill the connection. mirror the same filtering.
    this.emitMessage([
      'pushResponse',
      filterMutationResultsToClient(response.pushResponse, this.clientID),
    ])
    this.requestPullAfterCurrent()
  }

  private enqueuePush(body: unknown) {
    this.pendingPushes.push(body)
    if (this.pushInFlight) return
    this.run(this.drainPushes())
  }

  private async drainPushes() {
    this.pushInFlight = true
    try {
      while (this.readyState !== this.CLOSED && this.pendingPushes.length > 0) {
        await this.push(this.takePushBatch())
      }
    } finally {
      this.pushInFlight = false
    }
  }

  private takePushBatch(): PushBatch {
    const first = this.pendingPushes.shift()
    const firstBody = parsePushBody(first)
    if (!firstBody) {
      return { body: first, frameCount: 1, mutationCount: 0 }
    }

    const mutations = [...firstBody.mutations]
    let frameCount = 1
    while (this.pendingPushes.length > 0) {
      const nextBody = parsePushBody(this.pendingPushes[0])
      if (
        !nextBody ||
        !areCompatiblePushBodies(firstBody, nextBody) ||
        mutations.length + nextBody.mutations.length > MAX_PUSH_BATCH_MUTATIONS
      ) {
        break
      }
      this.pendingPushes.shift()
      mutations.push(...nextBody.mutations)
      frameCount++
    }

    return {
      body: frameCount === 1 ? firstBody : { ...firstBody, mutations },
      frameCount,
      mutationCount: mutations.length,
    }
  }

  private requestPullAfterCurrent() {
    if (this.pullInFlight) {
      this.pullAfterCurrent = true
      return
    }
    this.run(this.pull())
  }

  // in query-aware mode the got-query ack is authoritative from the server:
  // take the server's gotQueries.patch as the got patch to emit (replacing
  // local synthesis), and clear the acked prefix of the shipped desired delta
  // once the server acks that version (the ack never leads its row effects —
  // invariant 13 — so the client marks a query got only after its rows land).
  private applyServerGotQueries(response: PullResponse) {
    const got = response.gotQueries
    this.pendingGotQueriesPatch = got ? got.patch : []
    if (
      got &&
      this.sentQueryVersion !== undefined &&
      got.version >= this.sentQueryVersion
    ) {
      this.desiredQueryPatch.splice(0, this.sentQueryPatchLen)
      this.sentQueryVersion = undefined
    }
  }

  private async answerMutationRecoveryPull(body: {
    clientGroupID: string
    cookie: string | null
    requestID: string
  }) {
    const response = await this.fetchPull(body.clientGroupID, body.cookie, false)
    const cookie = toWebSocketCookie(response.cookie)
    this.emitMessage([
      'pull',
      {
        requestID: body.requestID,
        cookie: cookie ?? this.cookie ?? '0',
        lastMutationIDChanges: response.unchanged ? {} : response.lastMutationIDChanges,
      },
    ])
  }

  private async fetchPull(
    clientGroupID: string,
    cookie: string | null,
    includeQueries: boolean,
  ) {
    const body: Record<string, unknown> = {
      clientID: this.clientID,
      clientGroupID,
      cookie: toHttpCookie(cookie),
    }
    // ship the un-acked desired-query delta with the pull; remember what we
    // sent so the server ack can clear exactly that prefix. a recovery pull
    // (includeQueries=false) never carries desires.
    if (includeQueries && this.state.queryAware && this.desiredQueryPatch.length > 0) {
      this.sentQueryVersion = this.queryVersion
      this.sentQueryPatchLen = this.desiredQueryPatch.length
      body.queries = { version: this.queryVersion, patch: [...this.desiredQueryPatch] }
    } else {
      this.sentQueryVersion = undefined
    }
    return (await this.postJSON('/pull', body)) as PullResponse
  }

  private async postJSON(path: '/pull' | '/push', body: unknown) {
    const base =
      path === '/push' ? this.state.pushOriginString : this.state.pullOriginString
    const response = await this.state.fetch(`${base}${path}`, {
      method: 'POST',
      headers: {
        authorization: this.authToken ? `Bearer ${this.authToken}` : '',
        'content-type': 'application/json',
      },
      body: JSON.stringify(body),
    })
    if (!response.ok) {
      throw new ZeroHttpResponseError(path, response.status)
    }
    return response.json()
  }

  private run(promise: Promise<void>) {
    void promise.catch((error) => this.fail(error))
  }

  private fail(error: unknown) {
    if (this.readyState === this.CLOSED) return
    this.emitLifecycle('failure', { reason: errorMessage(error) })
    if (isAuthHTTPError(error)) {
      this.emitMessage([
        'error',
        {
          kind: 'Unauthorized',
          message: error.message,
          origin: 'server',
        },
      ])
      if (this.readyState !== this.CLOSED) this.close(1000, error.message)
      return
    }
    if (isStaleClientCookieError(error)) {
      // the client's cookie is AHEAD of the server watermark — the server
      // lost or reset its change-tracking state (replica reset / restore).
      // mirror zero-cache's InvalidConnectionRequestBaseCookie error frame so
      // the stock client drops its local db and rebuilds from scratch instead
      // of reconnect-looping on 409 forever.
      this.emitMessage([
        'error',
        {
          kind: 'InvalidConnectionRequestBaseCookie',
          message: error.message,
          origin: 'server',
        },
      ])
      if (this.readyState !== this.CLOSED) this.close(1000, error.message)
      return
    }
    this.emit('error', { error })
    this.close(1011, errorMessage(error))
  }

  private emitPoke(response: Exclude<PullResponse, { unchanged: true }>) {
    const currentServer = toHttpCookie(this.cookie)
    let nextCookie: string
    if (currentServer !== null && response.cookie < currentServer) {
      // the server watermark is BEHIND the client: a real reset/restore. mirror
      // the 409 stale path instead of poking the client backwards.
      throw new Error(
        `zero-http pull returned stale cookie ${response.cookie} for ${this.cookie}`,
      )
    } else if (currentServer !== null && response.cookie === currentServer) {
      // same server watermark but a non-empty patch: a query-aware membership
      // delta (a desired-query change recomputes rows without advancing the
      // change log). bump a client-local cookie id so replicache sees a changed
      // cookie — otherwise it trips "cookie did not change, but patch is not
      // empty" and drops the patch.
      nextCookie = toLocalWebSocketCookie(response.cookie, ++this.nextLocalCookieID)
    } else {
      nextCookie = toWebSocketCookie(response.cookie) as string
    }

    const pokeID = `zero-http-${++this.state.nextPokeID}`
    const gotQueries = this.pendingGotQueriesPatch
    this.pendingGotQueriesPatch = []

    this.emitMessage([
      'pokeStart',
      {
        pokeID,
        baseCookie: this.cookie,
        schemaVersions: {
          minSupportedVersion: 1,
          maxSupportedVersion: 1,
        },
        timestamp: Date.now(),
      },
    ])
    this.emitMessage([
      'pokePart',
      {
        pokeID,
        lastMutationIDChanges: response.lastMutationIDChanges,
        rowsPatch: response.rowsPatch,
      },
    ])
    if (gotQueries.length > 0) {
      this.emitMessage([
        'pokePart',
        {
          pokeID,
          gotQueriesPatch: gotQueries,
        },
      ])
    }
    this.emitMessage(['pokeEnd', { pokeID, cookie: nextCookie }])
    this.cookie = nextCookie
  }

  private emitGotQueriesPatch(cookie: number | null) {
    if (this.pendingGotQueriesPatch.length === 0) return

    const serverCookie = cookie ?? toHttpCookie(this.cookie)
    if (serverCookie === null) return
    const nextCookie = toLocalWebSocketCookie(serverCookie, ++this.nextLocalCookieID)
    const pokeID = `zero-http-${++this.state.nextPokeID}`
    const gotQueries = this.pendingGotQueriesPatch
    this.pendingGotQueriesPatch = []

    this.emitMessage([
      'pokeStart',
      {
        pokeID,
        baseCookie: this.cookie,
        schemaVersions: {
          minSupportedVersion: 1,
          maxSupportedVersion: 1,
        },
        timestamp: Date.now(),
      },
    ])
    this.emitMessage([
      'pokePart',
      {
        pokeID,
        gotQueriesPatch: gotQueries,
      },
    ])
    this.emitMessage(['pokeEnd', { pokeID, cookie: nextCookie }])
    this.cookie = nextCookie
  }

  private emitMessage(message: unknown) {
    if (this.readyState !== this.OPEN) return
    this.emit('message', { data: JSON.stringify(message) })
  }

  private emit(type: SocketEventType, event: any) {
    const handler = (this as unknown as Record<string, unknown>)[`on${type}`]
    if (typeof handler === 'function') handler.call(this, event)
    for (const listener of this.listeners[type]) {
      if (typeof listener === 'function') listener(event)
      else listener.handleEvent(event)
    }
  }

  private supersede() {
    this.settle('superseded')
  }

  private settle(
    type: Extract<HttpPullLifecycleEvent['type'], 'close' | 'superseded' | 'aborted'>,
    detail: Pick<HttpPullLifecycleEvent, 'code' | 'reason'> = {},
  ) {
    if (this.settled) return false
    this.settled = true
    if (this.openTimer !== undefined) clearTimeout(this.openTimer)
    if (this.pullTimer !== undefined) clearInterval(this.pullTimer)
    this.closeWakeChannel()
    this.readyState = this.CLOSED
    this.state.sockets.delete(this)
    if (this.state.activeSocketByClient.get(this.clientID) === this) {
      this.state.activeSocketByClient.delete(this.clientID)
      this.state.activeSocketGenerationByClient.delete(this.clientID)
    }
    this.emitLifecycle(type, detail)
    return true
  }

  private getAttemptAgeMs() {
    return this.attemptStartedAt === undefined
      ? undefined
      : performance.now() - this.attemptStartedAt
  }

  private emitLifecycle(
    type: HttpPullLifecycleEvent['type'],
    detail: Pick<
      HttpPullLifecycleEvent,
      'listener' | 'code' | 'reason' | 'pushFrameCount' | 'mutationCount'
    > = {},
  ) {
    this.state.lifecycle?.({
      type,
      pageID: this.state.pageID,
      transportID: this.state.transportID,
      zeroInstanceID: this.zeroInstanceID,
      clientGroupID: this.clientGroupID,
      connectionAttemptID: this.connectionAttemptID,
      socketID: this.socketID,
      generation: this.generation,
      activeGeneration:
        this.state.activeSocketGenerationByClient.get(this.clientID) ?? this.generation,
      clientID: this.clientID,
      wsid: this.wsid,
      timestamp: Date.now(),
      attemptStartedAt: this.attemptStartedAt,
      attemptAgeMs: this.getAttemptAgeMs(),
      ...detail,
    })
  }
}

function parsePushBody(value: unknown): PushBody | undefined {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return
  if (!('mutations' in value) || !Array.isArray(value.mutations)) return
  // the runtime checks above establish the only fields batching reads.
  return value as PushBody
}

function areCompatiblePushBodies(left: PushBody, right: PushBody) {
  return (
    left.clientGroupID === right.clientGroupID &&
    left.pushVersion === right.pushVersion &&
    left.schemaVersion === right.schemaVersion
  )
}

function shouldIntercept(origin: URL, url: string | URL) {
  const candidate = toHttpURL(url)
  if (candidate.origin !== origin.origin) return false
  return candidate.pathname === `${trimTrailingSlash(origin.pathname)}/sync/v51/connect`
}

function toHttpURL(url: string | URL) {
  const parsed = new URL(url)
  if (parsed.protocol === 'ws:') parsed.protocol = 'http:'
  if (parsed.protocol === 'wss:') parsed.protocol = 'https:'
  return parsed
}

function trimTrailingSlash(value: string) {
  return value.endsWith('/') ? value.slice(0, -1) : value
}

function decodeSecProtocol(protocols: WebSocketProtocols):
  | {
      authToken?: string
      initConnectionMessage?: [string, Record<string, unknown>]
    }
  | Record<string, never> {
  const protocol = Array.isArray(protocols) ? protocols[0] : protocols
  if (!protocol) return {}
  try {
    const decoded = decodeURIComponent(protocol)
    const json = new TextDecoder().decode(
      Uint8Array.from(globalThis.atob(decoded), (char) => char.charCodeAt(0)),
    )
    const parsed = JSON.parse(json) as {
      authToken?: string
      initConnectionMessage?: unknown
    }
    return {
      authToken: parsed.authToken,
      initConnectionMessage: Array.isArray(parsed.initConnectionMessage)
        ? (parsed.initConnectionMessage as [string, Record<string, unknown>])
        : undefined,
    }
  } catch {
    return {}
  }
}

function gotQueriesPatch(patch: DesiredQueryPatchOp[]) {
  const got: GotQueryPatchOp[] = []
  for (const op of patch) {
    if (op.op === 'clear') got.push({ op: 'clear' })
    else if (op.hash) got.push({ op: op.op, hash: op.hash })
  }
  return got
}

function toHttpCookie(cookie: string | null): number | null {
  if (cookie === null || cookie === '') return null
  const parsed = Number(cookie.slice(0, COOKIE_WIDTH))
  if (!Number.isFinite(parsed)) {
    throw new Error(`zero-http cookie is not numeric: ${cookie}`)
  }
  return parsed
}

function toWebSocketCookie(cookie: number | null): string | null {
  return cookie === null ? null : String(cookie).padStart(COOKIE_WIDTH, '0')
}

function toLocalWebSocketCookie(cookie: number, localID: number): string {
  return `${String(cookie).padStart(COOKIE_WIDTH, '0')}#${String(localID).padStart(
    6,
    '0',
  )}`
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error)
}

class ZeroHttpResponseError extends Error {
  constructor(
    readonly path: '/pull' | '/push',
    readonly status: number,
  ) {
    super(`zero-http ${path} failed with ${status}`)
  }
}

function isAuthHTTPError(error: unknown): error is ZeroHttpResponseError {
  return (
    error instanceof ZeroHttpResponseError &&
    (error.status === 401 || error.status === 403)
  )
}

// keep only this client's own mutation results — zero-cache's pusher does the
// same per-client fan-out (results for clients without a live connection are
// dropped; their LMID advance arrives via the next pull's
// lastMutationIDChanges, which is how recovered mutations settle).
function filterMutationResultsToClient(pushResponse: unknown, clientID: string) {
  if (!pushResponse || typeof pushResponse !== 'object') return pushResponse
  const mutations = (pushResponse as { mutations?: unknown }).mutations
  if (!Array.isArray(mutations)) return pushResponse
  return {
    ...pushResponse,
    mutations: mutations.filter(
      (m) => (m as { id?: { clientID?: string } })?.id?.clientID === clientID,
    ),
  }
}

function isStaleClientCookieError(error: unknown): error is ZeroHttpResponseError {
  return (
    error instanceof ZeroHttpResponseError &&
    error.path === '/pull' &&
    error.status === 409
  )
}
