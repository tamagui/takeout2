// verify the deployed app at the end of its one-hour cutover observation.
import { setTimeout } from 'node:timers/promises'

const [origin, version, startedAt] = process.argv.slice(2)
if (!origin || !version || !startedAt) {
  throw new Error(
    'usage: bun scripts/watch-cutover.ts <origin> <version> <started-at-ISO>',
  )
}
const start = Date.parse(startedAt)
if (!Number.isFinite(start)) throw new Error('invalid cutover start time')
const remaining = Math.max(0, start + 3_600_000 - Date.now())
console.log(`checking ${origin} at ${new Date(start + 3_600_000).toISOString()}`)
await setTimeout(remaining)
const signal = AbortSignal.timeout(30_000)
for (const path of ['/', '/auth/login', '/version.json']) {
  const response = await fetch(new URL(path, origin), { signal, cache: 'no-store' })
  if (response.status !== 200) throw new Error(`${path} returned ${response.status}`)
  if (path === '/version.json') {
    const marker: unknown = await response.json()
    if (
      !marker ||
      typeof marker !== 'object' ||
      !('version' in marker) ||
      marker.version !== version
    ) {
      throw new Error('deployed source version changed during the observation')
    }
  } else {
    const html = await response.text()
    if (!html.includes('<html')) throw new Error(`${path} did not serve HTML`)
  }
  console.log(`RAN: ${path} returned 200`)
}
const sync = await fetch(new URL('/zero-http/pull', origin), {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: '{}',
  signal,
})
await sync.body?.cancel()
if (![400, 401, 403, 422].includes(sync.status)) {
  throw new Error(`unsigned sync probe returned ${sync.status}`)
}
console.log(
  `RAN: unsigned sync returned ${sync.status}; one hour elapsed since ${startedAt}`,
)
