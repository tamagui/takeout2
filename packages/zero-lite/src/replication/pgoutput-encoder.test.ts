import { describe, it, expect } from 'vitest'
import {
  encodeBegin,
  encodeCommit,
  encodeRelation,
  encodeInsert,
  encodeUpdate,
  encodeDelete,
  encodeKeepalive,
  wrapXLogData,
  wrapCopyData,
  getTableOid,
  inferColumns,
  type ColumnInfo,
} from './pgoutput-encoder'

// pg epoch: 2000-01-01 in microseconds from unix epoch
const PG_EPOCH_MICROS = 946684800000000n

// mini decoder helpers
function r16(buf: Uint8Array, off: number) {
  return new DataView(buf.buffer, buf.byteOffset).getInt16(off)
}
function r32(buf: Uint8Array, off: number) {
  return new DataView(buf.buffer, buf.byteOffset).getInt32(off)
}
function r64(buf: Uint8Array, off: number) {
  return new DataView(buf.buffer, buf.byteOffset).getBigInt64(off)
}
function rCStr(buf: Uint8Array, off: number): [string, number] {
  let end = off
  while (end < buf.length && buf[end] !== 0) end++
  return [new TextDecoder().decode(buf.subarray(off, end)), end + 1]
}
function rText(buf: Uint8Array, off: number): [string, number] {
  const len = r32(buf, off)
  const str = new TextDecoder().decode(buf.subarray(off + 4, off + 4 + len))
  return [str, off + 4 + len]
}

describe('pgoutput-encoder', () => {
  describe('encodeBegin', () => {
    it('produces correct binary layout', () => {
      const lsn = 0x1000100n
      const ts = BigInt(Date.now()) * 1000n
      const xid = 42

      const buf = encodeBegin(lsn, ts, xid)

      expect(buf.length).toBe(21)
      expect(buf[0]).toBe(0x42) // 'B'
      expect(r64(buf, 1)).toBe(lsn)
      expect(r64(buf, 9)).toBe(ts - PG_EPOCH_MICROS)
      expect(r32(buf, 17)).toBe(xid)
    })
  })

  describe('encodeCommit', () => {
    it('produces correct binary layout', () => {
      const lsn = 0x1000100n
      const endLsn = 0x1000200n
      const ts = BigInt(Date.now()) * 1000n

      const buf = encodeCommit(0, lsn, endLsn, ts)

      expect(buf.length).toBe(26)
      expect(buf[0]).toBe(0x43) // 'C'
      expect(buf[1]).toBe(0)
      expect(r64(buf, 2)).toBe(lsn)
      expect(r64(buf, 10)).toBe(endLsn)
      expect(r64(buf, 18)).toBe(ts - PG_EPOCH_MICROS)
    })
  })

  describe('encodeRelation', () => {
    it('encodes table with columns', () => {
      const cols: ColumnInfo[] = [
        { name: 'id', typeOid: 23, typeMod: -1 },
        { name: 'name', typeOid: 25, typeMod: -1 },
      ]

      const buf = encodeRelation(16384, 'public', 'users', 0x64, cols)

      expect(buf[0]).toBe(0x52) // 'R'
      expect(r32(buf, 1)).toBe(16384)

      let pos = 5
      const [schema, p1] = rCStr(buf, pos)
      expect(schema).toBe('public')
      pos = p1

      const [table, p2] = rCStr(buf, pos)
      expect(table).toBe('users')
      pos = p2

      expect(buf[pos]).toBe(0x64) // replica identity
      pos++
      expect(r16(buf, pos)).toBe(2)
      pos += 2

      // col 0
      expect(buf[pos++]).toBe(0) // flags
      const [c1, p3] = rCStr(buf, pos)
      expect(c1).toBe('id')
      pos = p3
      expect(r32(buf, pos)).toBe(23)
      pos += 4
      expect(r32(buf, pos)).toBe(-1)
      pos += 4

      // col 1
      expect(buf[pos++]).toBe(0)
      const [c2, p4] = rCStr(buf, pos)
      expect(c2).toBe('name')
      pos = p4
      expect(r32(buf, pos)).toBe(25)
      pos += 4
      expect(r32(buf, pos)).toBe(-1)
      pos += 4

      expect(pos).toBe(buf.length)
    })

    it('handles zero columns', () => {
      const buf = encodeRelation(16384, 'public', 'empty', 0x64, [])
      expect(buf[0]).toBe(0x52)
      let pos = 5
      ;[, pos] = rCStr(buf, pos)
      ;[, pos] = rCStr(buf, pos)
      pos++ // replica identity
      expect(r16(buf, pos)).toBe(0)
    })
  })

  describe('encodeInsert', () => {
    const cols: ColumnInfo[] = [
      { name: 'id', typeOid: 25, typeMod: -1 },
      { name: 'name', typeOid: 25, typeMod: -1 },
    ]

    it('encodes row values', () => {
      const buf = encodeInsert(16384, { id: '1', name: 'alice' }, cols)

      expect(buf[0]).toBe(0x49) // 'I'
      expect(r32(buf, 1)).toBe(16384)
      expect(buf[5]).toBe(0x4e) // 'N'

      expect(r16(buf, 6)).toBe(2) // num cols
      let pos = 8
      expect(buf[pos]).toBe(0x74) // 't'
      const [v1, p1] = rText(buf, pos + 1)
      expect(v1).toBe('1')
      pos = p1 + 1 // +1 for 't' byte
      // hmm wait, let me recalculate

      // actually the tuple format is: numCols(2) + for each: type(1) + if text: len(4)+data
      // so at offset 8: type byte, then len, then data
      pos = 8
      expect(buf[pos]).toBe(0x74) // 't'
      pos++
      expect(r32(buf, pos)).toBe(1) // length of '1'
      pos += 4
      expect(new TextDecoder().decode(buf.subarray(pos, pos + 1))).toBe('1')
      pos += 1

      expect(buf[pos]).toBe(0x74)
      pos++
      expect(r32(buf, pos)).toBe(5)
      pos += 4
      expect(new TextDecoder().decode(buf.subarray(pos, pos + 5))).toBe('alice')
    })

    it('encodes null values', () => {
      const buf = encodeInsert(16384, { id: '1', name: null }, cols)

      let pos = 8 // start of first value
      expect(buf[pos]).toBe(0x74) // first val: text
      pos += 1 + 4 + 1 // 't' + len + '1'
      expect(buf[pos]).toBe(0x6e) // second val: null
    })

    it('encodes unicode strings', () => {
      const buf = encodeInsert(16384, { id: '1', name: '日本語 🎉' }, cols)

      // find second value
      let pos = 8
      pos++ // 't'
      const len1 = r32(buf, pos)
      pos += 4 + len1

      expect(buf[pos]).toBe(0x74)
      pos++
      const len2 = r32(buf, pos)
      pos += 4
      const decoded = new TextDecoder().decode(buf.subarray(pos, pos + len2))
      expect(decoded).toBe('日本語 🎉')
    })

    it('encodes object values as JSON', () => {
      const metaCols: ColumnInfo[] = [{ name: 'meta', typeOid: 25, typeMod: -1 }]
      const buf = encodeInsert(16384, { meta: { foo: 'bar', n: 42 } }, metaCols)

      let pos = 8 // first value
      expect(buf[pos]).toBe(0x74)
      pos++
      const len = r32(buf, pos)
      pos += 4
      const decoded = new TextDecoder().decode(buf.subarray(pos, pos + len))
      expect(JSON.parse(decoded)).toEqual({ foo: 'bar', n: 42 })
    })

    it('encodes empty string', () => {
      const buf = encodeInsert(16384, { id: '', name: '' }, cols)

      let pos = 8
      expect(buf[pos]).toBe(0x74)
      pos++
      expect(r32(buf, pos)).toBe(0) // empty string length
    })
  })

  describe('encodeUpdate', () => {
    const cols: ColumnInfo[] = [
      { name: 'id', typeOid: 25, typeMod: -1 },
      { name: 'val', typeOid: 25, typeMod: -1 },
    ]

    it('includes old tuple when provided', () => {
      const buf = encodeUpdate(16384, { id: '1', val: 'new' }, { id: '1', val: 'old' }, cols)

      expect(buf[0]).toBe(0x55) // 'U'
      expect(r32(buf, 1)).toBe(16384)
      expect(buf[5]).toBe(0x4f) // 'O' old tuple
    })

    it('skips old tuple when null', () => {
      const buf = encodeUpdate(16384, { id: '1', val: 'new' }, null, cols)

      expect(buf[0]).toBe(0x55)
      expect(buf[5]).toBe(0x4e) // 'N' directly
    })

    it('old tuple precedes new tuple', () => {
      const buf = encodeUpdate(16384, { id: '1', val: 'new' }, { id: '1', val: 'old' }, cols)

      // 'O' at offset 5, then old tuple, then 'N', then new tuple
      expect(buf[5]).toBe(0x4f)
      // find 'N' marker after old tuple
      // old tuple: numCols(2) + 2 values
      let pos = 6 // start of old tuple
      const numOldCols = r16(buf, pos)
      expect(numOldCols).toBe(2)
      pos += 2
      // skip values
      for (let i = 0; i < numOldCols; i++) {
        if (buf[pos] === 0x6e) {
          pos++
        } else {
          pos++ // 't'
          const len = r32(buf, pos)
          pos += 4 + len
        }
      }
      expect(buf[pos]).toBe(0x4e) // 'N' new tuple marker
    })
  })

  describe('encodeDelete', () => {
    it('encodes with key tuple marker', () => {
      const cols: ColumnInfo[] = [{ name: 'id', typeOid: 25, typeMod: -1 }]
      const buf = encodeDelete(16384, { id: '42' }, cols)

      expect(buf[0]).toBe(0x44) // 'D'
      expect(r32(buf, 1)).toBe(16384)
      expect(buf[5]).toBe(0x4b) // 'K'
    })
  })

  describe('wrapXLogData', () => {
    it('wraps payload with wal positions', () => {
      const payload = new Uint8Array([1, 2, 3])
      const ts = BigInt(Date.now()) * 1000n

      const buf = wrapXLogData(0x100n, 0x200n, ts, payload)

      expect(buf[0]).toBe(0x77) // 'w'
      expect(r64(buf, 1)).toBe(0x100n)
      expect(r64(buf, 9)).toBe(0x200n)
      expect(r64(buf, 17)).toBe(ts - PG_EPOCH_MICROS)
      expect(Array.from(buf.subarray(25))).toEqual([1, 2, 3])
    })
  })

  describe('wrapCopyData', () => {
    it('wraps with length prefix', () => {
      const inner = new Uint8Array([0xaa, 0xbb])

      const buf = wrapCopyData(inner)

      expect(buf[0]).toBe(0x64) // 'd'
      expect(r32(buf, 1)).toBe(4 + 2) // length includes the 4 bytes of the length field itself
      expect(Array.from(buf.subarray(5))).toEqual([0xaa, 0xbb])
    })
  })

  describe('encodeKeepalive', () => {
    it('wraps keepalive in CopyData', () => {
      const walEnd = 0x1000200n
      const ts = BigInt(Date.now()) * 1000n

      const buf = encodeKeepalive(walEnd, ts, false)

      expect(buf[0]).toBe(0x64) // outer CopyData
      expect(buf[5]).toBe(0x6b) // inner 'k' keepalive
      expect(r64(buf, 6)).toBe(walEnd)
      expect(r64(buf, 14)).toBe(ts - PG_EPOCH_MICROS)
      expect(buf[22]).toBe(0)
    })

    it('sets reply-requested flag', () => {
      const buf = encodeKeepalive(0n, BigInt(Date.now()) * 1000n, true)
      expect(buf[22]).toBe(1)
    })
  })

  describe('inferColumns', () => {
    it('maps keys to text columns', () => {
      const cols = inferColumns({ id: 1, name: 'test', active: true })
      expect(cols).toEqual([
        { name: 'id', typeOid: 25, typeMod: -1 },
        { name: 'name', typeOid: 25, typeMod: -1 },
        { name: 'active', typeOid: 25, typeMod: -1 },
      ])
    })

    it('handles empty object', () => {
      expect(inferColumns({})).toEqual([])
    })
  })

  describe('getTableOid', () => {
    it('returns stable oid for same table', () => {
      const a = getTableOid('oid_test_stable')
      const b = getTableOid('oid_test_stable')
      expect(a).toBe(b)
      expect(a).toBeGreaterThanOrEqual(16384)
    })

    it('returns unique oids for different tables', () => {
      const a = getTableOid('oid_test_x')
      const b = getTableOid('oid_test_y')
      expect(a).not.toBe(b)
    })
  })

  describe('double-wrap: CopyData(XLogData(message))', () => {
    // this is the exact framing zero-cache expects for every replication message
    it('produces parseable nested structure', () => {
      const ts = BigInt(Date.now()) * 1000n
      const lsn = 0x1000000n
      const inner = encodeBegin(lsn, ts, 1)
      const xlog = wrapXLogData(lsn, lsn, ts, inner)
      const frame = wrapCopyData(xlog)

      // parse back
      expect(frame[0]).toBe(0x64) // CopyData
      const copyLen = r32(frame, 1)
      expect(frame.length).toBe(1 + copyLen)

      // inside CopyData: XLogData
      expect(frame[5]).toBe(0x77) // XLogData
      expect(r64(frame, 6)).toBe(lsn) // walStart
      expect(r64(frame, 14)).toBe(lsn) // walEnd

      // inside XLogData: Begin
      expect(frame[30]).toBe(0x42) // Begin
      expect(r64(frame, 31)).toBe(lsn) // begin LSN
      expect(r32(frame, 47)).toBe(1) // xid
    })
  })
})
