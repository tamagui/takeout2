// reset this deployment's demo data to the database/seed.ts fixture.
//
// exists for public read-only demo deployments: the demo deploy script arms it
// by setting DEMO_ADMIN_TOKEN (alongside DEMO_READ_ONLY) on the worker, and
// without that secret the route is a 404 on every deployment. POST replaces
// the entire contents of every table the caller's fixture declares: declared
// tables are cleared (children before parents) and the posted rows inserted,
// so a table declared with an empty array is wiped and left empty — an app
// names the tables its demo traffic pollutes without seeding rows there.
//
// the fixture rows arrive in the request body rather than from this worker's
// own database/seed.ts import: seed.ts anchors its rows to Date.now() at
// import, and cloudflare workers hold the clock at 0 until a request runs, so
// any in-worker evaluation dates every row in 1970 (measured: date 0,
// createdAt -1000, day 0). the deploy script evaluates the seed under a real
// clock and posts the result.
import { transactionProvider } from '~/database/applicationSql'
import type { Endpoint } from 'one'

// seed.ts is still imported here for the table NAMES the GET verification
// walks — names carry no clock. the frozen-clock values are never used.
async function seedTableNames(): Promise<string[]> {
  const loaded = await import('../../../database/seed')
  const seed: Record<string, unknown> = loaded.default
  return Object.entries(seed)
    .filter(([, rows]) => Array.isArray(rows))
    .map(([table]) => table)
}

function authorized(request: Request): boolean {
  const expected = process.env.DEMO_ADMIN_TOKEN
  return Boolean(expected) && request.headers.get('x-demo-admin-token') === expected
}

// row counts per seed-declared table, so the deploy script can verify a reset
// against the live database instead of trusting the reset's own report.
export const GET: Endpoint = async (request) => {
  if (!authorized(request)) return new Response('not found', { status: 404 })
  const names = await seedTableNames()
  const sampleTable = new URL(request.url).searchParams.get('sample')
  const counts: Record<string, number> = {}
  let sample: Record<string, unknown>[] = []
  await transactionProvider(async (executor) => {
    for (const table of names) {
      const quoted = `"${table.replaceAll('"', '""')}"`
      const counted = await executor.query<{ count: number }>(
        `SELECT COUNT(*) AS count FROM ${quoted}`,
      )
      counts[table] = Number(counted[0]?.count ?? 0)
      if (table === sampleTable) {
        sample = await executor.query(`SELECT * FROM ${quoted} LIMIT 5`)
      }
    }
  })
  return Response.json({ ok: true, counts, ...(sampleTable ? { sample } : {}) })
}

export const POST: Endpoint = async (request) => {
  if (!authorized(request)) {
    return new Response('not found', { status: 404 })
  }
  const body: unknown = await request.json().catch(() => null)
  const posted = body && typeof body === 'object' && 'tables' in body ? body.tables : null
  if (!posted || typeof posted !== 'object' || Array.isArray(posted)) {
    return new Response('body must be { tables: { <name>: rows[] } }', { status: 400 })
  }
  const tables: Array<[string, Record<string, unknown>[]]> = []
  for (const [table, rows] of Object.entries(posted)) {
    if (!Array.isArray(rows)) {
      return new Response(`tables.${table} must be an array`, { status: 400 })
    }
    const clean: Record<string, unknown>[] = []
    for (const row of rows) {
      if (!row || typeof row !== 'object' || Array.isArray(row)) {
        return new Response(`tables.${table} rows must be plain objects`, {
          status: 400,
        })
      }
      clean.push(row)
    }
    tables.push([table, clean])
  }
  const quote = (name: string) => `"${name.replaceAll('"', '""')}"`
  try {
    const result = await runReset(tables, quote)
    return Response.json({ ok: true, ...result })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return Response.json({ error: message }, { status: 500 })
  }
}

// one statement per transaction, deliberately: the sync host's change capture
// refuses a transaction whose later statement re-touches a table that already
// holds row-undo images from an earlier one ("first-touch snapshot" error,
// measured on tripStop). the reset is not atomic across statements — a caller
// verifies the row counts afterward and simply reruns on a partial apply,
// which the full-delete-then-insert shape makes idempotent.
async function runReset(
  tables: Array<[string, Record<string, unknown>[]]>,
  quote: (name: string) => string,
) {
  const deleted: Record<string, number> = {}
  for (const [table] of [...tables].reverse()) {
    const outcome = await transactionProvider((executor) =>
      executor.exec(`DELETE FROM ${quote(table)}`, [], {
        table,
        publicTable: table,
        kind: 'delete',
      }),
    )
    deleted[table] = outcome.changes
  }
  let inserted = 0
  for (const [table, rows] of tables) {
    for (const row of rows) {
      const columns = Object.keys(row).filter((key) => row[key] !== undefined)
      if (columns.length === 0) continue
      await transactionProvider((executor) =>
        executor.exec(
          `INSERT INTO ${quote(table)} (${columns.map(quote).join(', ')})
           VALUES (${columns.map((_, index) => `?${index + 1}`).join(', ')})`,
          columns.map((key) => row[key]),
          { table, publicTable: table, kind: 'insert' },
        ),
      )
      inserted++
    }
  }
  return { deleted, inserted }
}
