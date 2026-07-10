import { Zero } from '@rocicorp/zero'
import { afterEach, describe, expect, test, vi } from 'vitest'

import { zeroHttpFixtureMutators, zeroHttpFixtureSchema } from './fixtureSchema'
import { ensureHttpPullTransport, installHttpPullTransport } from '../httpPullTransport'

const ORIGIN = 'https://zero-http.local'

type RequestRecord = {
  url: string
  path: string
  headers: Record<string, string>
  body: any
}

const zeros: Zero<any, any>[] = []
const transports: Array<{ uninstall(): void }> = []
let storageID = 0

afterEach(async () => {
  while (zeros.length) await zeros.pop()?.close()
  while (transports.length) transports.pop()?.uninstall()
  vi.useRealTimers()
})

describe('zero-http transport', () => {
  test('connect + complete hydrates a stock Zero materialized query', async () => {
    const requests: RequestRecord[] = []
    let cookie = 0
    const fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const request = recordRequest(input, init)
      requests.push(request)
      expect(request.path).toBe('/pull')
      expect(request.headers.authorization).toBe('Bearer token-u1')
      return jsonResponse({
        cookie: ++cookie,
        lastMutationIDChanges: {},
        rowsPatch: [
          { op: 'clear' },
          { op: 'put', tableName: 'user', value: { id: 'u1', name: 'ada' } },
          {
            op: 'put',
            tableName: 'project',
            value: { id: 'p1', ownerId: 'u1', name: 'control' },
          },
          {
            op: 'put',
            tableName: 'member',
            value: { id: 'm1', projectId: 'p1', userId: 'u1' },
          },
        ],
      })
    })
    const transport = install(fetch)
    const zero = createZero()

    const view = zero.query.project.related('members').materialize()
    const data = await waitForComplete(view)
    view.destroy()

    expect(transport.connections).toBe(1)
    expect(data).toEqual([
      {
        id: 'p1',
        ownerId: 'u1',
        name: 'control',
        members: [{ id: 'm1', projectId: 'p1', userId: 'u1' }],
      },
    ])
    expect(requests[0].body.cookie).toBeNull()
    expect(requests[0].body.clientID).toEqual(expect.any(String))
    expect(requests[0].body.clientGroupID).toEqual(expect.any(String))
  })

  test('push frames POST to /push, resolve server promises, and schedule a follow-up pull', async () => {
    const requests: RequestRecord[] = []
    const fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const request = recordRequest(input, init)
      requests.push(request)

      if (request.path === '/pull') {
        return jsonResponse({ cookie: request.body.cookie, unchanged: true })
      }

      expect(request.path).toBe('/push')
      const mutation = request.body.mutations[0]
      return jsonResponse({
        pushResponse: {
          mutations: [
            {
              id: { clientID: mutation.clientID, id: mutation.id },
              result: {},
            },
          ],
        },
      })
    })
    install(fetch)
    const zero = createZero()

    await eventually(() =>
      expect(requests.filter((request) => request.path === '/pull').length).toBe(1),
    )
    const pullsBeforePush = requests.filter((request) => request.path === '/pull').length

    const mutation = zero.mutate.project.create({
      id: 'p1',
      ownerId: 'u1',
      name: 'created',
    })
    await mutation.client
    await mutation.server

    const push = requests.find((request) => request.path === '/push')
    expect(push?.headers.authorization).toBe('Bearer token-u1')
    expect(push?.body).toMatchObject({
      clientGroupID: expect.any(String),
      pushVersion: 1,
      requestID: expect.any(String),
      mutations: [
        {
          type: 'custom',
          name: 'project|create',
          id: 1,
          clientID: expect.any(String),
          args: [{ id: 'p1', ownerId: 'u1', name: 'created' }],
        },
      ],
    })
    await eventually(() =>
      expect(requests.filter((request) => request.path === '/pull').length).toBe(
        pullsBeforePush + 1,
      ),
    )
  })

  test('updateAuth frame updates bearer headers for later requests', async () => {
    const requests: RequestRecord[] = []
    const fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const request = recordRequest(input, init)
      requests.push(request)
      expect(request.path).toBe('/pull')
      return jsonResponse({ cookie: request.body.cookie, unchanged: true })
    })
    const transport = install(fetch)
    const { socket } = openRawSocketWithMessages({ authToken: 'token-old' })

    await eventually(() => expect(requests.length).toBe(1))
    expect(requests[0].headers.authorization).toBe('Bearer token-old')

    socket.send(JSON.stringify(['updateAuth', { auth: 'token-new' }]))
    await transport.pull()

    expect(requests.at(-1)?.headers.authorization).toBe('Bearer token-new')
  })

  test('push frames are serialized per socket', async () => {
    const firstPushStarted = defer<void>()
    const releaseFirstPush = defer<void>()
    const pushIDs: number[] = []
    const fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const request = recordRequest(input, init)
      if (request.path === '/pull') {
        return jsonResponse({ cookie: request.body.cookie, unchanged: true })
      }

      expect(request.path).toBe('/push')
      const mutationID = request.body.mutations[0].id
      pushIDs.push(mutationID)
      if (mutationID === 1) {
        firstPushStarted.resolve()
        await releaseFirstPush.promise
      }
      return jsonResponse({
        pushResponse: {
          mutations: request.body.mutations.map((mutation: any) => ({
            id: { clientID: mutation.clientID, id: mutation.id },
            result: {},
          })),
        },
      })
    })
    install(fetch)
    const { messages, socket } = openRawSocketWithMessages()

    await eventually(() =>
      expect(messages.some((message) => message[0] === 'connected')).toBe(true),
    )
    socket.send(JSON.stringify(['push', pushBody(1)]))
    await firstPushStarted.promise
    socket.send(JSON.stringify(['push', pushBody(2)]))
    await sleep(25)

    expect(pushIDs).toEqual([1])
    releaseFirstPush.resolve()
    await eventually(() => expect(pushIDs).toEqual([1, 2]))
    await eventually(() =>
      expect(messages.filter((message) => message[0] === 'pushResponse')).toHaveLength(2),
    )
    expect(
      messages
        .filter((message) => message[0] === 'pushResponse')
        .map((message) => message[1].mutations[0].id.id),
    ).toEqual([1, 2])
  })

  test('cookie discipline skips unchanged pokes, chains changed pokes, and coalesces concurrent pulls', async () => {
    const requests: RequestRecord[] = []
    const responses: Array<any | Promise<any>> = [
      {
        cookie: 1,
        lastMutationIDChanges: {},
        rowsPatch: [{ op: 'clear' }],
      },
      { cookie: 1, unchanged: true },
      {
        cookie: 2,
        lastMutationIDChanges: {},
        rowsPatch: [
          { op: 'clear' },
          {
            op: 'put',
            tableName: 'project',
            value: { id: 'p2', ownerId: 'u1', name: 'second' },
          },
        ],
      },
      {
        cookie: 3,
        lastMutationIDChanges: {},
        rowsPatch: [
          { op: 'clear' },
          {
            op: 'put',
            tableName: 'project',
            value: { id: 'p3', ownerId: 'u1', name: 'third' },
          },
        ],
      },
    ]
    const deferred = defer<any>()
    responses.push(deferred.promise)

    let inFlight = 0
    let maxInFlight = 0
    const fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      inFlight++
      maxInFlight = Math.max(maxInFlight, inFlight)
      try {
        const request = recordRequest(input, init)
        requests.push(request)
        const response = responses.shift()
        if (!response) throw new Error('missing canned response')
        return jsonResponse(await response)
      } finally {
        inFlight--
      }
    })
    const transport = install(fetch)
    const messages = openRawSocket()

    await eventually(() =>
      expect(messages.some((message) => message[0] === 'pokeEnd')).toBe(true),
    )
    expect(requests[0].body.cookie).toBeNull()
    expect(findMessage(messages, 'pokeStart')[1].baseCookie).toBeNull()
    expect(findMessage(messages, 'pokeEnd')[1].cookie).toBe('00000000000000000001')
    messages.length = 0

    await transport.pull()
    expect(messages.filter((message) => message[0].startsWith('poke'))).toEqual([])
    expect(requests[1].body.cookie).toBe(1)

    await transport.pull()
    expect(findMessage(messages, 'pokeStart')[1].baseCookie).toBe('00000000000000000001')
    expect(findMessage(messages, 'pokeEnd')[1].cookie).toBe('00000000000000000002')
    expect(requests[2].body.cookie).toBe(1)
    messages.length = 0

    await transport.pull()
    expect(findMessage(messages, 'pokeStart')[1].baseCookie).toBe('00000000000000000002')
    expect(findMessage(messages, 'pokeEnd')[1].cookie).toBe('00000000000000000003')
    expect(requests[3].body.cookie).toBe(2)
    messages.length = 0

    const concurrentA = transport.pull()
    const concurrentB = transport.pull()
    await eventually(() => expect(requests.length).toBe(5))
    deferred.resolve({
      cookie: 4,
      lastMutationIDChanges: {},
      rowsPatch: [{ op: 'clear' }],
    })
    await Promise.all([concurrentA, concurrentB])

    expect(requests.length).toBe(5)
    expect(maxInFlight).toBe(1)
    expect(findMessage(messages, 'pokeStart')[1].baseCookie).toBe('00000000000000000003')
    expect(findMessage(messages, 'pokeEnd')[1].cookie).toBe('00000000000000000004')
  })

  test('unchanged pull flushes late query registration to complete', async () => {
    const requests: RequestRecord[] = []
    const fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const request = recordRequest(input, init)
      requests.push(request)
      expect(request.path).toBe('/pull')

      if (request.body.cookie === null) {
        return jsonResponse({
          cookie: 1,
          lastMutationIDChanges: {},
          rowsPatch: [
            { op: 'clear' },
            { op: 'put', tableName: 'user', value: { id: 'u1', name: 'ada' } },
            {
              op: 'put',
              tableName: 'project',
              value: { id: 'p1', ownerId: 'u1', name: 'first' },
            },
          ],
        })
      }

      return jsonResponse({ cookie: request.body.cookie, unchanged: true })
    })
    install(fetch)
    const zero = createZero()

    const projectView = zero.query.project.materialize()
    await waitForComplete(projectView)

    const userView = zero.query.user.materialize()
    const users = await waitForComplete<any[]>(userView)

    expect(users).toEqual([{ id: 'u1', name: 'ada' }])
    expect(requests.at(-1)?.body.cookie).toBe(1)
    projectView.destroy()
    userView.destroy()
  })

  test('ping is answered locally and the stock Zero connection survives idle ping', async () => {
    const fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const request = recordRequest(input, init)
      expect(request.path).toBe('/pull')
      return jsonResponse({ cookie: request.body.cookie, unchanged: true })
    })
    const transport = install(fetch)
    const zero = createZero({ pingTimeoutMs: 10 })

    await eventually(() => expect(zero.connection.state.current.name).toBe('connected'))
    await sleep(40)

    expect(zero.connection.state.current.name).toBe('connected')
    expect(transport.connections).toBe(1)
  })

  test('401 pull failure closes the fake socket without materializing data', async () => {
    const requests: RequestRecord[] = []
    const fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const request = recordRequest(input, init)
      requests.push(request)
      expect(request.path).toBe('/pull')
      return jsonResponse({ error: 'unauthorized' }, { status: 401 })
    })
    const transport = install(fetch)
    const zero = createZero()
    const view = zero.query.project.materialize()
    const emissions: Array<{ data: any[]; resultType: string }> = []
    const cleanup = view.addListener((data: any, resultType) => {
      emissions.push({ data: JSON.parse(JSON.stringify(data)), resultType })
    })

    await eventually(() => expect(requests.length).toBeGreaterThan(0))
    await eventually(() => expect(zero.connection.state.current.name).toBe('needs-auth'))
    await sleep(25)

    expect(transport.connections).toBe(0)
    expect(emissions.flatMap((emission) => emission.data)).toEqual([])
    expect(view.data).toEqual([])
    cleanup()
    view.destroy()
  })

  test('transient pull failures back off reconnect attempts', async () => {
    const requests: RequestRecord[] = []
    const fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const request = recordRequest(input, init)
      requests.push(request)
      expect(request.path).toBe('/pull')
      throw new TypeError('Failed to fetch')
    })
    install(fetch)
    createZero()

    await eventually(() => expect(requests.length).toBe(1))
    await sleep(150)
    expect(requests.length).toBe(1)
    await eventually(() => expect(requests.length).toBe(2), 1_500)
    await sleep(150)
    expect(requests.length).toBe(2)
  })

  test('non-origin WebSockets pass through to the native implementation', () => {
    const previous = globalThis.WebSocket
    class NativeWebSocket {
      static CONNECTING = 0
      static OPEN = 1
      static CLOSING = 2
      static CLOSED = 3
      constructor(
        readonly url: string | URL,
        readonly protocols?: string | string[],
      ) {}
    }
    globalThis.WebSocket = NativeWebSocket as unknown as typeof WebSocket

    const transport = installHttpPullTransport({ origin: ORIGIN, fetch: vi.fn() })
    const socket = new WebSocket('wss://elsewhere.local/socket', 'native')

    expect(socket).toBeInstanceOf(NativeWebSocket)
    expect((socket as unknown as NativeWebSocket).url).toBe(
      'wss://elsewhere.local/socket',
    )

    transport.uninstall()
    expect(globalThis.WebSocket).toBe(NativeWebSocket)
    globalThis.WebSocket = previous
  })

  test('ensureHttpPullTransport installs once per origin', () => {
    // unique origin: the ensure registry is module-global and page-lifetime
    const origin = 'http://127.0.0.1:65501'
    const first = ensureHttpPullTransport({ origin, fetch: vi.fn() })
    const second = ensureHttpPullTransport({ origin, fetch: vi.fn() })
    expect(second).toBe(first)
    first.uninstall()
  })

  test('push responses are filtered to this client — foreign (recovery) results are dropped', async () => {
    // a mutation-RECOVERY push carries a previous client's pending mutations
    // and the server echoes that old clientID in the response. zero-cache only
    // delivers a client its own results; forwarding the raw response trips
    // zero's "received mutation for the wrong client" assert and kills the
    // connection (reproduced against soot's ultimate e2e, 2026-06-12).
    const fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const request = recordRequest(input, init)
      if (request.path === '/pull') {
        return jsonResponse({ cookie: request.body.cookie, unchanged: true })
      }
      const mutation = request.body.mutations[0]
      return jsonResponse({
        pushResponse: {
          mutations: [
            {
              id: { clientID: 'previous-session-client', id: 7 },
              result: {
                error: 'alreadyProcessed',
                details: 'recovered mutation already applied',
              },
            },
            {
              id: { clientID: mutation.clientID, id: mutation.id },
              result: {},
            },
          ],
        },
      })
    })
    install(fetch)
    const zero = createZero()

    const mutation = zero.mutate.project.create({
      id: 'p-recovery',
      ownerId: 'u1',
      name: 'recovered',
    })
    // the client's own result must resolve; the foreign result must be
    // dropped instead of asserting the connection dead.
    await mutation.client
    await mutation.server
  })

  test('pull 409 (client cookie ahead of server) resets client state instead of reconnect-looping', async () => {
    // a 409 means the server's change-tracking watermark is BEHIND the
    // client's cookie — the server lost/reset its state (replica reset). the
    // transport must surface zero-cache's InvalidConnectionRequestBaseCookie
    // error so the stock client drops local state and calls
    // onClientStateNotFound, instead of failing the socket and retrying the
    // same future cookie forever.
    const fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const request = recordRequest(input, init)
      expect(request.path).toBe('/pull')
      return jsonResponse(
        { error: 'future cookie 299 is ahead of server cookie 66' },
        { status: 409 },
      )
    })
    install(fetch)
    const onClientStateNotFound = vi.fn()
    createZero({ onClientStateNotFound })
    await eventually(() => expect(onClientStateNotFound).toHaveBeenCalled(), 5_000)
  })
})

function install(fetch: typeof globalThis.fetch) {
  const transport = installHttpPullTransport({ origin: ORIGIN, fetch })
  transports.push(transport)
  return transport
}

function createZero(
  options: { pingTimeoutMs?: number; onClientStateNotFound?: () => void } = {},
) {
  const zero = new Zero({
    server: ORIGIN,
    userID: 'u1',
    auth: 'token-u1',
    schema: zeroHttpFixtureSchema,
    kvStore: 'mem',
    storageKey: `zero-http-test-${++storageID}`,
    mutators: zeroHttpFixtureMutators,
    pingTimeoutMs: options.pingTimeoutMs,
    onClientStateNotFound: options.onClientStateNotFound,
  })
  zeros.push(zero)
  return zero
}

function recordRequest(input: RequestInfo | URL, init?: RequestInit): RequestRecord {
  const url = new URL(String(input))
  const headers = Object.fromEntries(
    Object.entries((init?.headers ?? {}) as Record<string, string>).map(
      ([key, value]) => [key.toLowerCase(), value],
    ),
  )
  return {
    url: url.toString(),
    path: url.pathname,
    headers,
    body: init?.body ? JSON.parse(String(init.body)) : undefined,
  }
}

function jsonResponse(body: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(body), {
    status: init?.status ?? 200,
    statusText: init?.statusText,
    headers: {
      'content-type': 'application/json',
      ...(init?.headers as Record<string, string> | undefined),
    },
  })
}

async function waitForComplete<T>(view: {
  addListener(listener: (data: any, resultType: string) => void): () => void
}): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timeout = setTimeout(
      () => reject(new Error('timed out waiting for complete query')),
      5_000,
    )
    let cleanup = () => {}
    cleanup = view.addListener((data, resultType) => {
      if (resultType !== 'complete') return
      clearTimeout(timeout)
      cleanup()
      resolve(JSON.parse(JSON.stringify(data)) as T)
    })
  })
}

async function eventually(assertion: () => void | Promise<void>, timeout = 1_000) {
  const started = Date.now()
  let lastError: unknown
  while (Date.now() - started < timeout) {
    try {
      await assertion()
      return
    } catch (error) {
      lastError = error
      await sleep(10)
    }
  }
  throw lastError
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function openRawSocket() {
  return openRawSocketWithMessages().messages
}

function openRawSocketWithMessages(opts?: {
  authToken?: string
  desiredQueriesPatch?: unknown[]
}) {
  const url = new URL(`${ORIGIN}/sync/v51/connect`)
  url.protocol = 'wss:'
  url.searchParams.set('clientID', 'c1')
  url.searchParams.set('clientGroupID', 'cg1')
  url.searchParams.set('userID', 'u1')
  url.searchParams.set('baseCookie', '')
  url.searchParams.set('lmid', '0')
  url.searchParams.set('wsid', 'ws-test')
  const messages: Array<[string, any]> = []
  const socket = new WebSocket(
    url,
    encodeSecProtocol(
      ['initConnection', { desiredQueriesPatch: opts?.desiredQueriesPatch ?? [] }],
      opts?.authToken ?? 'token-u1',
    ),
  )
  socket.addEventListener('message', (event) => {
    messages.push(JSON.parse(String(event.data)))
  })
  return { messages, socket }
}

function pushBody(id: number) {
  return {
    clientGroupID: 'cg1',
    pushVersion: 1,
    requestID: `push-${id}`,
    timestamp: Date.now(),
    mutations: [
      {
        type: 'custom',
        name: 'project|create',
        id,
        clientID: 'c1',
        args: [{ id: `p${id}`, ownerId: 'u1', name: `project ${id}` }],
      },
    ],
  }
}

function findMessage(messages: Array<[string, any]>, type: string) {
  const message = messages.find((item) => item[0] === type)
  expect(message).toBeDefined()
  return message as [string, any]
}

function encodeSecProtocol(
  initConnectionMessage: [string, Record<string, unknown>],
  authToken: string,
) {
  return encodeURIComponent(
    Buffer.from(JSON.stringify({ initConnectionMessage, authToken })).toString('base64'),
  )
}

function defer<T>() {
  let resolve!: (value: T) => void
  let reject!: (error: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

// installs the transport with the query-aware extension on (a queryTransform
// resolver), pushing it for afterEach cleanup.
function installWithQueries(
  fetch: typeof globalThis.fetch,
  queryTransform: (name: string, args: readonly unknown[]) => unknown,
) {
  const transport = installHttpPullTransport({ origin: ORIGIN, fetch, queryTransform })
  transports.push(transport)
  return transport
}

describe('zero-http query-aware extension', () => {
  test('ships desired queries with pull state (transformed AST) and emits server got-query ack', async () => {
    const requests: RequestRecord[] = []
    const fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const request = recordRequest(input, init)
      requests.push(request)
      return jsonResponse({
        cookie: 1,
        lastMutationIDChanges: {},
        rowsPatch: [{ op: 'clear' }],
        gotQueries: { version: 1, patch: [{ op: 'put', hash: 'h1' }] },
      })
    })
    installWithQueries(fetch, (name, args) => ({ resolved: name, args }))

    const { messages } = openRawSocketWithMessages({
      desiredQueriesPatch: [
        { op: 'put', hash: 'h1', name: 'byOwner', args: [{ ownerId: 'u1' }] },
      ],
    })

    await eventually(() => expect(requests.length).toBeGreaterThan(0))
    // the pull body ships {queries:{version, patch:[{op:'put',hash,ast}]}} with
    // name+args resolved to the AST by the transform
    expect(requests[0].body.queries).toEqual({
      version: 1,
      patch: [
        {
          op: 'put',
          hash: 'h1',
          ast: { resolved: 'byOwner', args: [{ ownerId: 'u1' }] },
        },
      ],
    })
    // the server's got-query ack is emitted to the client (not synthesized)
    await eventually(() => {
      const poke = messages.find(
        (m) => m[0] === 'pokePart' && Array.isArray(m[1].gotQueriesPatch),
      )
      expect(poke?.[1].gotQueriesPatch).toEqual([{ op: 'put', hash: 'h1' }])
    })
  })

  test('an ad-hoc put with an inline ast ships that ast unchanged', async () => {
    const requests: RequestRecord[] = []
    const fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      requests.push(recordRequest(input, init))
      return jsonResponse({ cookie: 1, unchanged: true })
    })
    // a transform that would throw if called — an inline ast must bypass it
    installWithQueries(fetch, () => {
      throw new Error('transform should not run for an inline ast')
    })

    openRawSocketWithMessages({
      desiredQueriesPatch: [{ op: 'put', hash: 'h2', ast: { inline: true } }],
    })

    await eventually(() => expect(requests.length).toBeGreaterThan(0))
    expect(requests[0].body.queries.patch).toEqual([
      { op: 'put', hash: 'h2', ast: { inline: true } },
    ])
  })

  test('reconnect re-ships the desired set', async () => {
    const requests: RequestRecord[] = []
    const fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      requests.push(recordRequest(input, init))
      // never ack the query version, so the desire stays un-acked
      return jsonResponse({ cookie: 1, unchanged: true })
    })
    installWithQueries(fetch, (name) => ({ resolved: name }))

    const desired = [{ op: 'put', hash: 'h1', name: 'byOwner', args: [] }]
    const first = openRawSocketWithMessages({ desiredQueriesPatch: desired })
    await eventually(() => expect(requests.length).toBeGreaterThan(0))
    first.socket.close()

    const before = requests.length
    openRawSocketWithMessages({ desiredQueriesPatch: desired })
    await eventually(() => expect(requests.length).toBeGreaterThan(before))
    // the reconnected socket re-ships the (still un-acked) desired query
    const replay = requests[requests.length - 1].body.queries
    expect(replay.patch).toEqual([
      { op: 'put', hash: 'h1', ast: { resolved: 'byOwner' } },
    ])
  })

  test('queryForward ships name+args for the server to resolve (no client transform)', async () => {
    const requests: RequestRecord[] = []
    const fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      requests.push(recordRequest(input, init))
      return jsonResponse({ cookie: 1, unchanged: true })
    })
    // queryForward on, no transform: the permission transform stays server-side
    const transport = installHttpPullTransport({
      origin: ORIGIN,
      fetch,
      queryForward: true,
    })
    transports.push(transport)

    openRawSocketWithMessages({
      desiredQueriesPatch: [
        {
          op: 'put',
          hash: 'h3',
          name: 'byOwner',
          args: [{ ownerId: 'u1' }],
          // Zero may include a locally evaluable AST on a named query put.
          // queryForward must discard it so the server remains authoritative.
          ast: { table: 'secret' },
        },
      ],
    })

    await eventually(() => expect(requests.length).toBeGreaterThan(0))
    expect(requests[0].body.queries.patch).toEqual([
      { op: 'put', hash: 'h3', name: 'byOwner', args: [{ ownerId: 'u1' }] },
    ])
  })
})
