/**
 * zero-cache pgoutput compatibility tests.
 *
 * adapted from zero-cache's stream.pg.test.ts. validates that our
 * pglite proxy produces pgoutput messages decodable by zero-cache's
 * PgoutputParser.
 *
 * note: our proxy encodes all column types as text (typeOid=25) and
 * stores change data as jsonb. this differs from real postgres which
 * uses proper type OIDs, but zero-cache handles re-mapping downstream.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { createConnection, type Socket } from 'node:net'
import { PGlite } from '@electric-sql/pglite'
import type { Server, AddressInfo } from 'node:net'
import { startPgProxy } from '../pg-proxy'
import { installChangeTracking } from './change-tracker'
import { getConfig } from '../config'

// --- async queue (matches zero-cache's Queue pattern) ---

class Queue<T> {
  private items: T[] = []
  private waiters: Array<{
    resolve: (item: T) => void
    timer: ReturnType<typeof setTimeout>
  }> = []

  enqueue(item: T) {
    const waiter = this.waiters.shift()
    if (waiter) {
      clearTimeout(waiter.timer)
      waiter.resolve(item)
    } else {
      this.items.push(item)
    }
  }

  dequeue(timeoutMs = 8000): Promise<T> {
    const item = this.items.shift()
    if (item !== undefined) return Promise.resolve(item)

    return new Promise<T>((resolve, reject) => {
      const entry = {
        resolve,
        timer: setTimeout(() => {
          const idx = this.waiters.indexOf(entry)
          if (idx >= 0) this.waiters.splice(idx, 1)
          reject(new Error(`queue dequeue timeout (${timeoutMs}ms)`))
        }, timeoutMs),
      }
      this.waiters.push(entry)
    })
  }
}

// --- zero-cache compatible message types (mirrors pgoutput.types.ts) ---

interface ZcRelation {
  tag: 'relation'
  relationOid: number
  schema: string
  name: string
  replicaIdentity: 'default' | 'nothing' | 'full' | 'index'
  columns: Array<{ name: string; flags: number; typeOid: number; typeMod: number }>
  keyColumns: string[]
}

interface ZcBegin {
  tag: 'begin'
  commitLsn: string
  xid: number
}

interface ZcCommit {
  tag: 'commit'
  flags: number
  commitLsn: string
  commitEndLsn: string
}

interface ZcInsert {
  tag: 'insert'
  relation: ZcRelation
  new: Record<string, string | null>
}

interface ZcUpdate {
  tag: 'update'
  relation: ZcRelation
  key: Record<string, string | null> | null
  old: Record<string, string | null> | null
  new: Record<string, string | null>
}

interface ZcDelete {
  tag: 'delete'
  relation: ZcRelation
  key: Record<string, string | null> | null
  old: Record<string, string | null> | null
}

interface ZcKeepalive {
  tag: 'keepalive'
}

type ZcMessage = ZcBegin | ZcCommit | ZcRelation | ZcInsert | ZcUpdate | ZcDelete | ZcKeepalive

// --- pgoutput decoder (zero-cache compatible output) ---

const REPLICA_IDENTITY: Record<number, ZcRelation['replicaIdentity']> = {
  0x64: 'default',
  0x6e: 'nothing',
  0x66: 'full',
  0x69: 'index',
}

function lsnStr(val: bigint): string {
  const hi = Number((val >> 32n) & 0xffffffffn)
  const lo = Number(val & 0xffffffffn)
  return `${hi.toString(16).toUpperCase()}/${lo.toString(16).toUpperCase()}`
}

class ZcDecoder {
  private relations = new Map<number, ZcRelation>()

  decodeCopyData(frame: Uint8Array): ZcMessage | null {
    if (frame[0] !== 0x64) return null
    if (frame[5] === 0x77) return this.decode(frame.subarray(30)) // XLogData
    if (frame[5] === 0x6b) return { tag: 'keepalive' } as ZcKeepalive
    return null
  }

  private decode(buf: Uint8Array): ZcMessage {
    const dv = new DataView(buf.buffer, buf.byteOffset)
    switch (buf[0]) {
      case 0x42: // Begin
        return {
          tag: 'begin',
          commitLsn: lsnStr(dv.getBigInt64(1)),
          xid: dv.getInt32(17),
        }
      case 0x43: // Commit
        return {
          tag: 'commit',
          flags: buf[1],
          commitLsn: lsnStr(dv.getBigInt64(2)),
          commitEndLsn: lsnStr(dv.getBigInt64(10)),
        }
      case 0x52: // Relation
        return this.decodeRelation(buf, dv)
      case 0x49: // Insert
        return this.decodeInsert(buf, dv)
      case 0x55: // Update
        return this.decodeUpdate(buf, dv)
      case 0x44: // Delete
        return this.decodeDelete(buf, dv)
      default:
        throw new Error(`unknown pgoutput tag: 0x${buf[0].toString(16)}`)
    }
  }

  private decodeRelation(buf: Uint8Array, dv: DataView): ZcRelation {
    const oid = dv.getInt32(1)
    let pos = 5
    const [schema, p1] = this.cstr(buf, pos)
    pos = p1
    const [name, p2] = this.cstr(buf, pos)
    pos = p2
    const replicaIdentity = REPLICA_IDENTITY[buf[pos++]] || 'default'
    const numCols = dv.getInt16(pos)
    pos += 2
    const columns: ZcRelation['columns'] = []
    for (let i = 0; i < numCols; i++) {
      const flags = buf[pos++]
      const [colName, np] = this.cstr(buf, pos)
      pos = np
      const typeOid = new DataView(buf.buffer, buf.byteOffset).getInt32(pos)
      pos += 4
      const typeMod = new DataView(buf.buffer, buf.byteOffset).getInt32(pos)
      pos += 4
      columns.push({ name: colName, flags, typeOid, typeMod })
    }
    const keyColumns = columns.filter((c) => c.flags & 1).map((c) => c.name)
    const rel: ZcRelation = { tag: 'relation', relationOid: oid, schema, name, replicaIdentity, columns, keyColumns }
    this.relations.set(oid, rel)
    return rel
  }

  private decodeInsert(buf: Uint8Array, dv: DataView): ZcInsert {
    const oid = dv.getInt32(1)
    const rel = this.relations.get(oid)!
    // skip marker byte at offset 5 ('N')
    const [tuple] = this.readTuple(buf, 6, rel)
    return { tag: 'insert', relation: rel, new: tuple }
  }

  private decodeUpdate(buf: Uint8Array, dv: DataView): ZcUpdate {
    const oid = dv.getInt32(1)
    const rel = this.relations.get(oid)!
    let pos = 5
    let old: Record<string, string | null> | null = null
    let key: Record<string, string | null> | null = null

    if (buf[pos] === 0x4b) {
      // 'K' key tuple
      pos++
      const [k, np] = this.readTuple(buf, pos, rel)
      key = k
      pos = np
    } else if (buf[pos] === 0x4f) {
      // 'O' old tuple
      pos++
      const [o, np] = this.readTuple(buf, pos, rel)
      old = o
      pos = np
    }
    // consume 'N' marker
    if (buf[pos] === 0x4e) pos++
    const [newTuple] = this.readTuple(buf, pos, rel)
    return { tag: 'update', relation: rel, key, old, new: newTuple }
  }

  private decodeDelete(buf: Uint8Array, dv: DataView): ZcDelete {
    const oid = dv.getInt32(1)
    const rel = this.relations.get(oid)!
    let key: Record<string, string | null> | null = null
    let old: Record<string, string | null> | null = null
    if (buf[5] === 0x4b) {
      const [k] = this.readTuple(buf, 6, rel)
      key = k
    } else if (buf[5] === 0x4f) {
      const [o] = this.readTuple(buf, 6, rel)
      old = o
    }
    return { tag: 'delete', relation: rel, key, old }
  }

  private readTuple(
    buf: Uint8Array,
    off: number,
    rel: ZcRelation
  ): [Record<string, string | null>, number] {
    const n = new DataView(buf.buffer, buf.byteOffset).getInt16(off)
    off += 2
    const row: Record<string, string | null> = {}
    for (let i = 0; i < n; i++) {
      const name = rel.columns[i]?.name || `col${i}`
      const kind = buf[off++]
      if (kind === 0x6e) {
        row[name] = null
      } else if (kind === 0x74) {
        const len = new DataView(buf.buffer, buf.byteOffset).getInt32(off)
        off += 4
        row[name] = new TextDecoder().decode(buf.subarray(off, off + len))
        off += len
      }
    }
    return [row, off]
  }

  private cstr(buf: Uint8Array, off: number): [string, number] {
    let end = off
    while (end < buf.length && buf[end] !== 0) end++
    return [new TextDecoder().decode(buf.subarray(off, end)), end + 1]
  }
}

// --- wire protocol helpers ---

function startup(params: Record<string, string>): Buffer {
  const pairs: Buffer[] = []
  for (const [k, v] of Object.entries(params)) pairs.push(Buffer.from(`${k}\0${v}\0`))
  pairs.push(Buffer.from('\0'))
  const bodyLen = pairs.reduce((s, b) => s + b.length, 0)
  const buf = Buffer.alloc(8 + bodyLen)
  buf.writeInt32BE(8 + bodyLen, 0)
  buf.writeInt32BE(196608, 4)
  let pos = 8
  for (const p of pairs) { p.copy(buf, pos); pos += p.length }
  return buf
}

function password(pw: string): Buffer {
  const b = Buffer.from(pw + '\0')
  const buf = Buffer.alloc(5 + b.length)
  buf[0] = 0x70
  buf.writeInt32BE(4 + b.length, 1)
  b.copy(buf, 5)
  return buf
}

function query(sql: string): Buffer {
  const b = Buffer.from(sql + '\0')
  const buf = Buffer.alloc(5 + b.length)
  buf[0] = 0x51
  buf.writeInt32BE(4 + b.length, 1)
  b.copy(buf, 5)
  return buf
}

function parsePgMsg(buf: Buffer): [{ type: number; data: Buffer } | null, Buffer] {
  if (buf.length < 5) return [null, buf]
  const len = buf.readInt32BE(1)
  if (buf.length < 1 + len) return [null, buf]
  return [{ type: buf[0], data: buf.subarray(0, 1 + len) }, buf.subarray(1 + len)]
}

// --- replication stream (high-level wrapper) ---

class ReplicationStream {
  private socket!: Socket
  private buf = Buffer.alloc(0)
  private pgWaiters: Array<(msg: { type: number; data: Buffer }) => void> = []
  private pgQueue: Array<{ type: number; data: Buffer }> = []
  private decoder = new ZcDecoder()
  private _msgs = new Queue<ZcMessage>()
  private streaming = false

  constructor(private port: number) {}

  get messages(): Queue<ZcMessage> { return this._msgs }

  async connect(): Promise<void> {
    this.socket = createConnection({ port: this.port, host: '127.0.0.1' })
    await new Promise<void>((res, rej) => {
      this.socket.once('connect', res)
      this.socket.once('error', rej)
    })
    this.socket.on('data', (chunk: Buffer) => {
      this.buf = Buffer.concat([this.buf, chunk])
      this.drain()
    })

    this.socket.write(startup({ user: 'user', database: 'postgres', replication: 'database' }))
    const auth = await this.nextPg()
    if (auth.data.readInt32BE(5) === 3) {
      this.socket.write(password('password'))
      await this.nextPg()
    }
    while ((await this.nextPg()).type !== 0x5a) { /* consume until ReadyForQuery */ }
  }

  async createSlot(name: string): Promise<void> {
    this.socket.write(query(
      `CREATE_REPLICATION_SLOT "${name}" TEMPORARY LOGICAL pgoutput NOEXPORT_SNAPSHOT`
    ))
    while ((await this.nextPg()).type !== 0x5a) { /* consume until ReadyForQuery */ }
  }

  async startReplication(slot: string, pubs: string[]): Promise<void> {
    this.streaming = true
    this.socket.write(query(
      `START_REPLICATION SLOT "${slot}" LOGICAL 0/0 (proto_version '1', publication_names '${pubs.join(',')}')`
    ))
    await new Promise((r) => setTimeout(r, 150))
  }

  close(): void { this.socket?.destroy() }

  private drain() {
    while (true) {
      const [msg, rest] = parsePgMsg(this.buf)
      if (!msg) break
      this.buf = rest
      if (this.streaming) {
        if (msg.type === 0x64) {
          const decoded = this.decoder.decodeCopyData(new Uint8Array(msg.data))
          if (decoded) this._msgs.enqueue(decoded)
        }
        // skip CopyBothResponse (0x57) and other non-CopyData in streaming
      } else {
        const w = this.pgWaiters.shift()
        if (w) w(msg)
        else this.pgQueue.push(msg)
      }
    }
  }

  private nextPg(ms = 5000): Promise<{ type: number; data: Buffer }> {
    const q = this.pgQueue.shift()
    if (q) return Promise.resolve(q)
    return new Promise((resolve, reject) => {
      const t = setTimeout(() => {
        const i = this.pgWaiters.indexOf(resolve)
        if (i >= 0) this.pgWaiters.splice(i, 1)
        reject(new Error('pg message timeout'))
      }, ms)
      this.pgWaiters.push((msg) => { clearTimeout(t); resolve(msg) })
    })
  }
}

// --- helper: skip keepalives ---

async function nextData(q: Queue<ZcMessage>): Promise<ZcMessage> {
  while (true) {
    const m = await q.dequeue()
    if (m.tag !== 'keepalive') return m
  }
}

// --- tests ---

describe('zero-cache pgoutput compatibility', { timeout: 30000 }, () => {
  let db: PGlite
  let server: Server
  let port: number

  beforeEach(async () => {
    db = new PGlite()
    await db.waitReady
    await db.exec(`
      CREATE TABLE public.foo (
        id TEXT PRIMARY KEY,
        int_val INTEGER,
        big_val BIGINT,
        flt_val FLOAT8,
        bool_val BOOLEAN,
        text_val TEXT
      )
    `)
    await db.exec(`
      CREATE TABLE public.bar (
        a TEXT PRIMARY KEY, b TEXT, c TEXT
      )
    `)
    await db.exec(`CREATE PUBLICATION zero_pub FOR ALL TABLES`)
    await installChangeTracking(db)

    const config = { ...getConfig(), pgPort: 0 }
    server = await startPgProxy(db, config)
    port = (server.address() as AddressInfo).port
  })

  afterEach(async () => {
    server?.close()
    await db?.close()
  })

  async function stream(): Promise<ReplicationStream> {
    const s = new ReplicationStream(port)
    await s.connect()
    await s.createSlot('compat_slot')
    await s.startReplication('compat_slot', ['zero_pub'])
    return s
  }

  it('insert: begin → relation → insert → commit', async () => {
    const s = await stream()
    await db.exec(`INSERT INTO public.foo (id, text_val) VALUES ('hello', 'world')`)

    const q = s.messages
    const begin = await nextData(q)
    expect(begin).toMatchObject({ tag: 'begin' })

    const rel = await nextData(q)
    expect(rel).toMatchObject({
      tag: 'relation',
      schema: 'public',
      name: 'foo',
      replicaIdentity: 'default',
    })

    const ins = await nextData(q)
    expect(ins.tag).toBe('insert')
    expect((ins as ZcInsert).relation.name).toBe('foo')
    expect((ins as ZcInsert).new.id).toBe('hello')
    expect((ins as ZcInsert).new.text_val).toBe('world')

    const commit = await nextData(q)
    expect(commit).toMatchObject({ tag: 'commit' })

    s.close()
  })

  it('relation has correct schema, columns, and replica identity', async () => {
    const s = await stream()
    await db.exec(`INSERT INTO public.foo (id) VALUES ('rel_test')`)

    const q = s.messages
    let rel: ZcRelation | null = null
    while (!rel) {
      const m = await nextData(q)
      if (m.tag === 'relation') rel = m as ZcRelation
    }

    expect(rel.schema).toBe('public')
    expect(rel.name).toBe('foo')
    expect(rel.replicaIdentity).toBe('default')
    expect(rel.relationOid).toBeGreaterThanOrEqual(16384)

    const names = rel.columns.map((c) => c.name)
    expect(names).toContain('id')
    expect(names).toContain('int_val')
    expect(names).toContain('text_val')

    // all typeOids are 25 (text) - known difference from real postgres
    for (const col of rel.columns) {
      expect(col.typeOid).toBe(25)
    }

    s.close()
  })

  it('values encoded as text (typeOid=25) from jsonb', async () => {
    const s = await stream()
    await db.exec(`
      INSERT INTO public.foo (id, int_val, big_val, flt_val, bool_val, text_val)
      VALUES ('types', 123, 9876543210, 3.14, true, 'hello')
    `)

    const q = s.messages
    let ins: ZcInsert | null = null
    while (!ins) {
      const m = await nextData(q)
      if (m.tag === 'insert') ins = m as ZcInsert
    }

    expect(ins.new.id).toBe('types')
    expect(ins.new.int_val).toBe('123')
    expect(ins.new.big_val).toBe('9876543210')
    expect(ins.new.flt_val).toBe('3.14')
    expect(ins.new.bool_val).toBe('true')
    expect(ins.new.text_val).toBe('hello')

    s.close()
  })

  it('null values encoded correctly', async () => {
    const s = await stream()
    await db.exec(`INSERT INTO public.foo (id, int_val, text_val) VALUES ('nul', NULL, NULL)`)

    const q = s.messages
    let ins: ZcInsert | null = null
    while (!ins) {
      const m = await nextData(q)
      if (m.tag === 'insert') ins = m as ZcInsert
    }

    expect(ins.new.id).toBe('nul')
    expect(ins.new.int_val).toBeNull()
    expect(ins.new.text_val).toBeNull()

    s.close()
  })

  it('update includes old + new tuple (like zero-cache expects)', async () => {
    const s = await stream()
    const q = s.messages

    await db.exec(`INSERT INTO public.foo (id, int_val) VALUES ('upd', 10)`)
    // consume insert transaction
    while ((await nextData(q)).tag !== 'commit') {}

    await db.exec(`UPDATE public.foo SET int_val = 20 WHERE id = 'upd'`)

    let upd: ZcUpdate | null = null
    while (!upd) {
      const m = await nextData(q)
      if (m.tag === 'update') upd = m as ZcUpdate
    }

    expect(upd.relation.name).toBe('foo')
    expect(upd.new.id).toBe('upd')
    expect(upd.new.int_val).toBe('20')
    expect(upd.old).not.toBeNull()
    expect(upd.old!.id).toBe('upd')
    expect(upd.old!.int_val).toBe('10')

    s.close()
  })

  it('delete includes key data', async () => {
    const s = await stream()
    const q = s.messages

    await db.exec(`INSERT INTO public.foo (id, text_val) VALUES ('del', 'bye')`)
    while ((await nextData(q)).tag !== 'commit') {}

    await db.exec(`DELETE FROM public.foo WHERE id = 'del'`)

    let del: ZcDelete | null = null
    while (!del) {
      const m = await nextData(q)
      if (m.tag === 'delete') del = m as ZcDelete
    }

    expect(del.relation.name).toBe('foo')
    // our proxy sends 'K' key tuple with all column data
    expect(del.key).not.toBeNull()
    expect(del.key!.id).toBe('del')

    s.close()
  })

  it('multiple tables produce separate relations (like zero-cache multi-publication)', async () => {
    const s = await stream()
    const q = s.messages

    await db.exec(`INSERT INTO public.foo (id) VALUES ('from_foo')`)
    await db.exec(`INSERT INTO public.bar (a, b) VALUES ('from_bar', 'val')`)

    const rels: ZcRelation[] = []
    const inserts: ZcInsert[] = []

    const deadline = Date.now() + 6000
    while (inserts.length < 2 && Date.now() < deadline) {
      const m = await nextData(q)
      if (m.tag === 'relation') rels.push(m as ZcRelation)
      if (m.tag === 'insert') inserts.push(m as ZcInsert)
    }

    expect(inserts).toHaveLength(2)

    const tables = new Set(rels.map((r) => r.name))
    expect(tables).toContain('foo')
    expect(tables).toContain('bar')

    // inserts reference correct relations
    const fooIns = inserts.find((i) => i.relation.name === 'foo')!
    const barIns = inserts.find((i) => i.relation.name === 'bar')!
    expect(fooIns.new.id).toBe('from_foo')
    expect(barIns.new.a).toBe('from_bar')

    s.close()
  })

  it('relation sent only once per table across transactions', async () => {
    const s = await stream()
    const q = s.messages

    await db.exec(`INSERT INTO public.foo (id) VALUES ('first')`)
    while ((await nextData(q)).tag !== 'commit') {}

    await db.exec(`INSERT INTO public.foo (id) VALUES ('second')`)

    // second transaction should NOT repeat the relation
    const tx: ZcMessage[] = []
    while (true) {
      const m = await nextData(q)
      tx.push(m)
      if (m.tag === 'commit') break
    }

    expect(tx.filter((m) => m.tag === 'relation')).toHaveLength(0)

    s.close()
  })

  it('each transaction has matching begin/commit', async () => {
    const s = await stream()
    const q = s.messages

    await db.exec(`INSERT INTO public.foo (id) VALUES ('t1')`)
    await db.exec(`INSERT INTO public.foo (id) VALUES ('t2')`)
    await db.exec(`INSERT INTO public.foo (id) VALUES ('t3')`)

    const all: ZcMessage[] = []
    const deadline = Date.now() + 8000
    while (Date.now() < deadline) {
      const m = await q.dequeue(2000).catch(() => null)
      if (!m) break
      if (m.tag !== 'keepalive') all.push(m)
      if (all.filter((x) => x.tag === 'commit').length >= 3) break
    }

    const begins = all.filter((m) => m.tag === 'begin')
    const commits = all.filter((m) => m.tag === 'commit')
    const inserts = all.filter((m) => m.tag === 'insert') as ZcInsert[]

    expect(begins.length).toBeGreaterThanOrEqual(1)
    expect(begins.length).toBe(commits.length)
    expect(inserts).toHaveLength(3)

    const ids = inserts.map((i) => i.new.id)
    expect(ids).toContain('t1')
    expect(ids).toContain('t2')
    expect(ids).toContain('t3')

    s.close()
  })

  it('commit LSNs increase monotonically', async () => {
    const s = await stream()
    const q = s.messages

    await db.exec(`INSERT INTO public.foo (id) VALUES ('lsn1')`)
    // wait for first commit before second insert to avoid poll batching
    let commit1: ZcCommit | null = null
    while (true) {
      const m = await nextData(q)
      if (m.tag === 'commit') { commit1 = m as ZcCommit; break }
    }

    await db.exec(`INSERT INTO public.foo (id) VALUES ('lsn2')`)
    let commit2: ZcCommit | null = null
    while (true) {
      const m = await nextData(q)
      if (m.tag === 'commit') { commit2 = m as ZcCommit; break }
    }

    function parseLsn(s: string): bigint {
      const [hi, lo] = s.split('/')
      return (BigInt(parseInt(hi, 16)) << 32n) | BigInt(parseInt(lo, 16))
    }

    expect(parseLsn(commit2!.commitEndLsn)).toBeGreaterThan(
      parseLsn(commit1!.commitEndLsn)
    )

    s.close()
  })

  it('mixed insert/update/delete in sequence', async () => {
    const s = await stream()
    const q = s.messages

    await db.exec(`INSERT INTO public.foo (id, int_val) VALUES ('mix', 1)`)
    while ((await nextData(q)).tag !== 'commit') {}

    await db.exec(`UPDATE public.foo SET int_val = 2 WHERE id = 'mix'`)
    while ((await nextData(q)).tag !== 'commit') {}

    await db.exec(`DELETE FROM public.foo WHERE id = 'mix'`)

    const tx: ZcMessage[] = []
    while (true) {
      const m = await nextData(q)
      tx.push(m)
      if (m.tag === 'commit') break
    }

    expect(tx[0].tag).toBe('begin')
    expect(tx[1].tag).toBe('delete')
    expect(tx[2].tag).toBe('commit')

    s.close()
  })

  it('multi-row insert produces individual insert messages', async () => {
    const s = await stream()
    const q = s.messages

    await db.exec(`INSERT INTO public.foo (id, int_val) VALUES ('m1', 1), ('m2', 2), ('m3', 3)`)

    const inserts: ZcInsert[] = []
    const deadline = Date.now() + 5000
    while (inserts.length < 3 && Date.now() < deadline) {
      const m = await nextData(q)
      if (m.tag === 'insert') inserts.push(m as ZcInsert)
    }

    expect(inserts).toHaveLength(3)
    const vals = inserts.map((i) => i.new.int_val).sort()
    expect(vals).toEqual(['1', '2', '3'])

    s.close()
  })

  it('multi-row update produces individual update messages', async () => {
    const s = await stream()
    const q = s.messages

    await db.exec(`INSERT INTO public.foo (id, int_val) VALUES ('u1', 1), ('u2', 2), ('u3', 3)`)
    // consume insert tx
    while ((await nextData(q)).tag !== 'commit') {}

    await db.exec(`UPDATE public.foo SET int_val = int_val * 10`)

    const updates: ZcUpdate[] = []
    const deadline = Date.now() + 5000
    while (updates.length < 3 && Date.now() < deadline) {
      const m = await nextData(q)
      if (m.tag === 'update') updates.push(m as ZcUpdate)
    }

    expect(updates).toHaveLength(3)
    const newVals = updates.map((u) => u.new.int_val).sort()
    expect(newVals).toEqual(['10', '20', '30'])

    s.close()
  })

  it('json/object values serialized as json strings', async () => {
    await db.exec(`CREATE TABLE public.jtest (id TEXT PRIMARY KEY, meta JSONB)`)
    await installChangeTracking(db)

    const s = await stream()
    const q = s.messages
    await db.exec(`INSERT INTO public.jtest (id, meta) VALUES ('j1', '{"foo":"bar","n":42}')`)

    let ins: ZcInsert | null = null
    while (!ins) {
      const m = await nextData(q)
      if (m.tag === 'insert' && (m as ZcInsert).relation.name === 'jtest') ins = m as ZcInsert
    }

    const meta = ins.new.meta!
    expect(JSON.parse(meta)).toEqual({ foo: 'bar', n: 42 })

    s.close()
  })

  it('insert references cached relation by oid', async () => {
    const s = await stream()
    const q = s.messages
    await db.exec(`INSERT INTO public.foo (id) VALUES ('ref_test')`)

    let rel: ZcRelation | null = null
    let ins: ZcInsert | null = null
    while (!ins) {
      const m = await nextData(q)
      if (m.tag === 'relation' && (m as ZcRelation).name === 'foo') rel = m as ZcRelation
      if (m.tag === 'insert') ins = m as ZcInsert
    }

    expect(rel).not.toBeNull()
    // insert.relation should be the same object reference (from cache)
    expect(ins!.relation).toBe(rel)
    expect(ins!.relation.relationOid).toBe(rel!.relationOid)

    s.close()
  })

  it('empty string distinct from null', async () => {
    const s = await stream()
    const q = s.messages
    await db.exec(`INSERT INTO public.foo (id, text_val) VALUES ('empty', '')`)

    let ins: ZcInsert | null = null
    while (!ins) {
      const m = await nextData(q)
      if (m.tag === 'insert') ins = m as ZcInsert
    }

    expect(ins.new.text_val).toBe('')
    expect(ins.new.int_val).toBeNull()

    s.close()
  })

  it('keepalives sent during idle periods', async () => {
    const s = await stream()
    const q = s.messages

    // collect messages for ~600ms without doing anything
    const msgs: ZcMessage[] = []
    const deadline = Date.now() + 600
    while (Date.now() < deadline) {
      const m = await q.dequeue(400).catch(() => null)
      if (m) msgs.push(m)
    }

    const keepalives = msgs.filter((m) => m.tag === 'keepalive')
    expect(keepalives.length).toBeGreaterThan(0)

    s.close()
  })

  it('rapid sequential inserts all captured', async () => {
    const s = await stream()
    const q = s.messages

    const count = 20
    for (let i = 0; i < count; i++) {
      await db.exec(`INSERT INTO public.foo (id, int_val) VALUES ('r${i}', ${i})`)
    }

    const inserts: ZcInsert[] = []
    const deadline = Date.now() + 8000
    while (inserts.length < count && Date.now() < deadline) {
      const m = await nextData(q)
      if (m.tag === 'insert') inserts.push(m as ZcInsert)
    }

    expect(inserts).toHaveLength(count)

    s.close()
  })
})
