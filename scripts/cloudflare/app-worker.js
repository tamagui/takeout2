// application storage and sync use the same Durable Object namespace.
import { AsyncLocalStorage } from 'node:async_hooks'
import { WorkerEntrypoint } from 'cloudflare:workers'
import {
  createApplicationSqlClient,
  ZeroDO,
  projectOrezFeedBody,
} from 'orez-lite/cloudflare'
import { orezAppSchema, runCloudflareMigrations } from 'orez:cloudflare-migrations'
export { ZeroDO as ZeroSqlDO }
const signals = new AsyncLocalStorage()
let schemaReady = false
async function ensureSchema() {
  if (schemaReady) return
  // only completed checks are shared across requests; pending I/O stays with its request.
  await runCloudflareMigrations({ instance: 'singleton', schemaOnly: true })
  schemaReady = true
}
function install(env) {
  globalThis.__soot_cf_application_sql_client = (instance = 'singleton') =>
    createApplicationSqlClient(env.ZERO_SQL_DO, instance, { signal: signals.getStore() })
  globalThis.__soot_cf_r2_bucket = env.FILES
}
export class OrezDataFeed extends WorkerEntrypoint {
  async fetch(request) {
    return signals.run(request.signal, async () => {
      install(this.env)
      await ensureSchema()
      const url = new URL(request.url)
      if (url.pathname !== '/snapshot' && url.pathname !== '/changes')
        return new Response('not found', { status: 404 })
      const forward = new Request(request)
      forward.headers.set('x-soot-do-instance', 'singleton')
      const response = await this.env.ZERO_SQL_DO.get(
        this.env.ZERO_SQL_DO.idFromName('singleton'),
      ).fetch(forward)
      if (!response.ok) return response
      return Response.json(
        projectOrezFeedBody(
          orezAppSchema,
          await response.json(),
          url.pathname === '/snapshot' ? url.searchParams.get('table') : null,
        ),
      )
    })
  }
}
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url)
    if (
      url.hostname === 'takeout-v2.tamagui.dev' &&
      env.BETTER_AUTH_URL === 'https://takeout.tamagui.dev'
    ) {
      url.hostname = 'takeout.tamagui.dev'
      return Response.redirect(url.toString(), 308)
    }
    if (
      env.ASSETS &&
      ['GET', 'HEAD'].includes(request.method) &&
      (url.pathname.startsWith('/assets/') ||
        url.pathname.startsWith('/seed-media/') ||
        /\.(png|jpe?g|webp|svg|woff2?)$/.test(url.pathname))
    ) {
      return env.ASSETS.fetch(request)
    }
    if (url.pathname.startsWith('/zero-http/')) return env.SYNC.fetch(request)
    return signals.run(request.signal, async () => {
      install(env)
      globalThis.__soot_background_task = (task) => ctx.waitUntil(Promise.resolve(task))
      for (const [key, value] of Object.entries(env))
        if (typeof value === 'string') process.env[key] = value
      await ensureSchema()
      const app = await import('orez:application-worker')
      return app.default.fetch(request, env, ctx)
    })
  },
}
