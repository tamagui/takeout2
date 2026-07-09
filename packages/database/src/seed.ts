// standardized demo/world seed applier — the one mechanism every runtime uses
// to apply a project's database/seed.ts rows after migrations: pg via the
// --seed flag on database/migrate.ts, and the browser preview worker (PGlite)
// at cold boot. same rows, same insert semantics, only the client differs.

import type { InferInsertModel, Table } from 'drizzle-orm'

// plain rows keyed by table name, in insert order (FK parents before children)
export type SeedRows = Record<string, Array<Record<string, unknown>>>

// typed view of SeedRows against a drizzle schema module: table exports map to
// their insert models so seed rows typecheck against real columns, while
// `import type` keeps the seed file drizzle-free at runtime
export type SeedData<TSchema> = {
  [K in keyof TSchema as TSchema[K] extends Table ? K : never]?: Array<
    InferInsertModel<Extract<TSchema[K], Table>>
  >
}

// the minimal client shape every runtime already has: node-pg PoolClient,
// PGlite, and the preview worker pool all expose query(sql, params)
export interface SeedClient {
  query(sql: string, params?: unknown[]): Promise<unknown>
}

const quote = (id: string) => `"${id.replaceAll('"', '""')}"`

// INSERT ... ON CONFLICT DO NOTHING per row, tables in key order. idempotent
// by construction: deterministic seed ids make re-application a no-op and a
// grown seed set back-fills only the missing rows. undefined columns are
// omitted so they fall to the DB default.
export async function applySeed(client: SeedClient, rows: SeedRows): Promise<void> {
  for (const [table, tableRows] of Object.entries(rows)) {
    for (const row of tableRows) {
      const columns = Object.keys(row).filter((key) => row[key] !== undefined)
      if (columns.length === 0) continue
      const values = columns.map((key) => row[key])
      const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ')
      await client.query(
        `INSERT INTO ${quote(table)} (${columns.map(quote).join(', ')}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`,
        values,
      )
    }
  }
}
