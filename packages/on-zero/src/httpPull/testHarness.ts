import { Zero } from '@rocicorp/zero'

import { zeroHttpFixtureMutators, zeroHttpFixtureSchema } from './fixtureSchema'
import { startZeroHttpServer, type Row } from './fixtureServer'
import { installHttpPullTransport } from '../httpPullTransport'

let storageID = 0

export type FixtureZero = Zero<
  typeof zeroHttpFixtureSchema,
  typeof zeroHttpFixtureMutators
>

export type ZeroHttpHarness = Awaited<ReturnType<typeof startZeroHttpHarness>>

export async function startZeroHttpHarness(opts?: {
  seed?: { user?: Row[]; project?: Row[]; member?: Row[] }
  interceptFetch?: (next: typeof fetch) => typeof fetch
}) {
  const server = await startZeroHttpServer({ seed: opts?.seed })
  const baseFetch: typeof fetch = (input, init) => globalThis.fetch(input, init)
  const transportFetch = opts?.interceptFetch ? opts.interceptFetch(baseFetch) : baseFetch
  const transport = installHttpPullTransport({
    origin: server.url,
    fetch: transportFetch,
  })
  const clients: Array<{ close(): Promise<unknown> }> = []

  return {
    server,
    transport,
    createZero(
      userID: string,
      createOpts?: { storageKey?: string; pingTimeoutMs?: number },
    ): FixtureZero {
      const zero = new Zero({
        server: server.url,
        userID,
        auth: `token-${userID}`,
        schema: zeroHttpFixtureSchema,
        kvStore: 'mem' as const,
        storageKey: createOpts?.storageKey ?? `zero-http-harness-${++storageID}`,
        mutators: zeroHttpFixtureMutators,
        pingTimeoutMs: createOpts?.pingTimeoutMs,
      })
      clients.push(zero)
      return zero
    },
    async close() {
      await transport.pull().catch(() => {})
      while (clients.length) await clients.pop()?.close()
      transport.uninstall()
      await server.close()
    },
  }
}

// the view's listener data is Immutable<T>; results are deep-cloned to a
// plain mutable T for assertions, so the listener param is typed loosely
export function waitForComplete<T>(view: {
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

export async function eventually(assertion: () => void | Promise<void>, timeout = 3_000) {
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

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
