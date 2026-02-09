import type { PGlite } from '@electric-sql/pglite'

export interface ChangeRecord {
  id: number
  watermark: number
  table_name: string
  op: 'INSERT' | 'UPDATE' | 'DELETE'
  row_data: Record<string, unknown> | null
  old_data: Record<string, unknown> | null
  changed_at: string
}

export async function installChangeTracking(db: PGlite): Promise<void> {
  // create changes table and watermark sequence
  await db.exec(`
    CREATE SEQUENCE IF NOT EXISTS public._zero_watermark;

    CREATE TABLE IF NOT EXISTS public._zero_changes (
      id BIGSERIAL PRIMARY KEY,
      watermark BIGINT NOT NULL DEFAULT nextval('public._zero_watermark'),
      table_name TEXT NOT NULL,
      op TEXT NOT NULL,
      row_data JSONB,
      old_data JSONB,
      changed_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS _zero_changes_watermark_idx ON public._zero_changes (watermark);

    CREATE TABLE IF NOT EXISTS public._zero_replication_slots (
      slot_name TEXT PRIMARY KEY,
      restart_lsn TEXT NOT NULL DEFAULT '0/1000000',
      confirmed_flush_lsn TEXT NOT NULL DEFAULT '0/1000000',
      wal_status TEXT NOT NULL DEFAULT 'reserved',
      plugin TEXT NOT NULL DEFAULT 'pgoutput',
      slot_type TEXT NOT NULL DEFAULT 'logical',
      active BOOLEAN NOT NULL DEFAULT false,
      active_pid INTEGER DEFAULT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `)

  // create trigger function
  await db.exec(`
    CREATE OR REPLACE FUNCTION public._zero_track_change() RETURNS TRIGGER AS $$
    BEGIN
      IF TG_OP = 'DELETE' THEN
        INSERT INTO public._zero_changes (table_name, op, old_data)
        VALUES (TG_TABLE_NAME, 'DELETE', row_to_json(OLD)::jsonb);
        RETURN OLD;
      ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO public._zero_changes (table_name, op, row_data, old_data)
        VALUES (TG_TABLE_NAME, 'UPDATE', row_to_json(NEW)::jsonb, row_to_json(OLD)::jsonb);
        RETURN NEW;
      ELSIF TG_OP = 'INSERT' THEN
        INSERT INTO public._zero_changes (table_name, op, row_data)
        VALUES (TG_TABLE_NAME, 'INSERT', row_to_json(NEW)::jsonb);
        RETURN NEW;
      END IF;
      RETURN NULL;
    END;
    $$ LANGUAGE plpgsql;
  `)

  // install triggers on all public tables
  await installTriggersOnAllTables(db)
}

async function installTriggersOnAllTables(db: PGlite): Promise<void> {
  const tables = await db.query<{ tablename: string }>(
    `SELECT tablename FROM pg_tables
     WHERE schemaname = 'public'
       AND tablename NOT IN ('migrations', '_zero_changes')
       AND tablename NOT LIKE '_zero_%'`
  )

  let count = 0
  for (const { tablename } of tables.rows) {
    await db.exec(`
      DROP TRIGGER IF EXISTS _zero_change_trigger ON public."${tablename}";
      CREATE TRIGGER _zero_change_trigger
        AFTER INSERT OR UPDATE OR DELETE ON public."${tablename}"
        FOR EACH ROW EXECUTE FUNCTION public._zero_track_change();
    `)
    count++
  }

  console.info(`[zero-lite] installed change tracking triggers on ${count} tables`)
}

export async function getChangesSince(
  db: PGlite,
  watermark: number,
  limit = 1000
): Promise<ChangeRecord[]> {
  const result = await db.query<ChangeRecord>(
    'SELECT * FROM public._zero_changes WHERE watermark > $1 ORDER BY watermark LIMIT $2',
    [watermark, limit]
  )
  return result.rows
}

export async function getCurrentWatermark(db: PGlite): Promise<number> {
  const result = await db.query<{ last_value: string }>('SELECT last_value FROM public._zero_watermark')
  return Number(result.rows[0].last_value)
}
