import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { PGlite } from '@electric-sql/pglite'
import { installChangeTracking, getChangesSince, getCurrentWatermark } from './change-tracker'

describe('change-tracker', () => {
  let db: PGlite

  beforeEach(async () => {
    db = new PGlite()
    await db.waitReady
    await db.exec(`
      CREATE TABLE public.items (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        value INTEGER
      )
    `)
    await installChangeTracking(db)
  })

  afterEach(async () => {
    await db.close()
  })

  it('captures INSERT', async () => {
    await db.exec(`INSERT INTO public.items (name, value) VALUES ('a', 1)`)

    const changes = await getChangesSince(db, 0)
    expect(changes).toHaveLength(1)
    expect(changes[0].op).toBe('INSERT')
    expect(changes[0].table_name).toBe('items')
    expect(changes[0].row_data).toMatchObject({ name: 'a', value: 1 })
    expect(changes[0].old_data).toBeNull()
  })

  it('captures UPDATE with old + new data', async () => {
    await db.exec(`INSERT INTO public.items (name, value) VALUES ('a', 1)`)
    await db.exec(`UPDATE public.items SET value = 99 WHERE name = 'a'`)

    const changes = await getChangesSince(db, 0)
    expect(changes).toHaveLength(2)
    expect(changes[1].op).toBe('UPDATE')
    expect(changes[1].row_data).toMatchObject({ value: 99 })
    expect(changes[1].old_data).toMatchObject({ value: 1 })
  })

  it('captures DELETE with old data', async () => {
    await db.exec(`INSERT INTO public.items (name, value) VALUES ('a', 1)`)
    await db.exec(`DELETE FROM public.items WHERE name = 'a'`)

    const changes = await getChangesSince(db, 0)
    expect(changes).toHaveLength(2)
    expect(changes[1].op).toBe('DELETE')
    expect(changes[1].old_data).toMatchObject({ name: 'a', value: 1 })
    expect(changes[1].row_data).toBeNull()
  })

  it('watermarks increase monotonically', async () => {
    for (let i = 0; i < 5; i++) {
      await db.exec(`INSERT INTO public.items (name, value) VALUES ('item${i}', ${i})`)
    }

    const changes = await getChangesSince(db, 0)
    expect(changes).toHaveLength(5)
    for (let i = 1; i < changes.length; i++) {
      expect(changes[i].watermark).toBeGreaterThan(changes[i - 1].watermark)
    }
  })

  it('getChangesSince filters by watermark', async () => {
    await db.exec(`INSERT INTO public.items (name, value) VALUES ('a', 1)`)
    await db.exec(`INSERT INTO public.items (name, value) VALUES ('b', 2)`)

    const all = await getChangesSince(db, 0)
    const afterFirst = await getChangesSince(db, all[0].watermark)

    expect(afterFirst).toHaveLength(1)
    expect(afterFirst[0].row_data).toMatchObject({ name: 'b' })
  })

  it('respects limit', async () => {
    for (let i = 0; i < 10; i++) {
      await db.exec(`INSERT INTO public.items (name, value) VALUES ('x', ${i})`)
    }

    const limited = await getChangesSince(db, 0, 3)
    expect(limited).toHaveLength(3)
  })

  it('getCurrentWatermark advances', async () => {
    // first insert consumes the initial sequence value
    await db.exec(`INSERT INTO public.items (name, value) VALUES ('x', 1)`)
    const before = await getCurrentWatermark(db)
    await db.exec(`INSERT INTO public.items (name, value) VALUES ('y', 2)`)
    const after = await getCurrentWatermark(db)
    expect(after).toBeGreaterThan(before)
  })

  it('tracks multiple tables', async () => {
    await db.exec(`CREATE TABLE public.other (id SERIAL PRIMARY KEY, label TEXT)`)
    await installChangeTracking(db) // reinstall picks up new table

    await db.exec(`INSERT INTO public.items (name, value) VALUES ('a', 1)`)
    await db.exec(`INSERT INTO public.other (label) VALUES ('b')`)

    const changes = await getChangesSince(db, 0)
    const tables = new Set(changes.map((c) => c.table_name))
    expect(tables).toContain('items')
    expect(tables).toContain('other')
  })

  it('handles rapid inserts (50 rows)', async () => {
    for (let i = 0; i < 50; i++) {
      await db.exec(`INSERT INTO public.items (name, value) VALUES ('r${i}', ${i})`)
    }

    const changes = await getChangesSince(db, 0)
    expect(changes).toHaveLength(50)

    for (let i = 1; i < changes.length; i++) {
      expect(changes[i].watermark).toBeGreaterThan(changes[i - 1].watermark)
    }
  })

  it('does not track internal _zero_ tables', async () => {
    await db.exec(`INSERT INTO public.items (name, value) VALUES ('x', 1)`)

    const changes = await getChangesSince(db, 0)
    // only the items insert, not the _zero_changes insert that the trigger itself caused
    const internalChanges = changes.filter((c) => c.table_name.startsWith('_zero_'))
    expect(internalChanges).toHaveLength(0)
  })

  it('handles NULL column values', async () => {
    await db.exec(`INSERT INTO public.items (name, value) VALUES ('nulltest', NULL)`)

    const changes = await getChangesSince(db, 0)
    expect(changes[0].row_data).toMatchObject({ name: 'nulltest', value: null })
  })

  it('handles multi-row update', async () => {
    await db.exec(`INSERT INTO public.items (name, value) VALUES ('a', 1), ('b', 2), ('c', 3)`)
    await db.exec(`UPDATE public.items SET value = value * 10`)

    const changes = await getChangesSince(db, 0)
    const updates = changes.filter((c) => c.op === 'UPDATE')
    expect(updates).toHaveLength(3)
  })

  it('preserves change ordering across mixed operations', async () => {
    await db.exec(`INSERT INTO public.items (name, value) VALUES ('a', 1)`)
    await db.exec(`UPDATE public.items SET value = 2 WHERE name = 'a'`)
    await db.exec(`INSERT INTO public.items (name, value) VALUES ('b', 3)`)
    await db.exec(`DELETE FROM public.items WHERE name = 'a'`)

    const changes = await getChangesSince(db, 0)
    const ops = changes.map((c) => c.op)
    expect(ops).toEqual(['INSERT', 'UPDATE', 'INSERT', 'DELETE'])
  })
})
