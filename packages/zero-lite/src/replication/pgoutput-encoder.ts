/**
 * pgoutput binary protocol encoder.
 *
 * encodes change records into the binary format that postgres uses
 * for logical replication (pgoutput plugin).
 *
 * all functions return Uint8Array for cross-platform compatibility.
 */

// postgres epoch: 2000-01-01 in microseconds from unix epoch
const PG_EPOCH_MICROS = 946684800000000n

// table oid tracking
const tableOids = new Map<string, number>()
let nextOid = 16384

function getTableOid(tableName: string): number {
  let oid = tableOids.get(tableName)
  if (!oid) {
    oid = nextOid++
    tableOids.set(tableName, oid)
  }
  return oid
}

export interface ColumnInfo {
  name: string
  typeOid: number
  typeMod: number
}

// infer columns from a jsonb row
export function inferColumns(row: Record<string, unknown>): ColumnInfo[] {
  return Object.keys(row).map((name) => ({
    name,
    typeOid: 25, // text oid - safe default, zero-cache re-maps types
    typeMod: -1,
  }))
}

function encodeString(str: string): Uint8Array {
  return new TextEncoder().encode(str)
}

function writeInt16(buf: Uint8Array, offset: number, val: number): void {
  new DataView(buf.buffer, buf.byteOffset).setInt16(offset, val)
}

function writeInt32(buf: Uint8Array, offset: number, val: number): void {
  new DataView(buf.buffer, buf.byteOffset).setInt32(offset, val)
}

function writeInt64(buf: Uint8Array, offset: number, val: bigint): void {
  new DataView(buf.buffer, buf.byteOffset).setBigInt64(offset, val)
}

// encode a BEGIN message
export function encodeBegin(lsn: bigint, timestamp: bigint, xid: number): Uint8Array {
  const buf = new Uint8Array(1 + 8 + 8 + 4)
  buf[0] = 0x42 // 'B'
  writeInt64(buf, 1, lsn)
  writeInt64(buf, 9, timestamp - PG_EPOCH_MICROS)
  writeInt32(buf, 17, xid)
  return buf
}

// encode a COMMIT message
export function encodeCommit(flags: number, lsn: bigint, endLsn: bigint, timestamp: bigint): Uint8Array {
  const buf = new Uint8Array(1 + 1 + 8 + 8 + 8)
  buf[0] = 0x43 // 'C'
  buf[1] = flags
  writeInt64(buf, 2, lsn)
  writeInt64(buf, 10, endLsn)
  writeInt64(buf, 18, timestamp - PG_EPOCH_MICROS)
  return buf
}

// encode a RELATION message
export function encodeRelation(
  tableOid: number,
  schema: string,
  tableName: string,
  replicaIdentity: number,
  columns: ColumnInfo[]
): Uint8Array {
  const schemaBytes = encodeString(schema)
  const nameBytes = encodeString(tableName)

  // calculate column sizes
  let columnsSize = 0
  const colNameBytes: Uint8Array[] = []
  for (const col of columns) {
    const nb = encodeString(col.name)
    colNameBytes.push(nb)
    columnsSize += 1 + nb.length + 1 + 4 + 4 // flags + name + null + typeOid + typeMod
  }

  const total = 1 + 4 + schemaBytes.length + 1 + nameBytes.length + 1 + 1 + 2 + columnsSize
  const buf = new Uint8Array(total)
  let pos = 0

  buf[pos++] = 0x52 // 'R'
  writeInt32(buf, pos, tableOid)
  pos += 4
  buf.set(schemaBytes, pos)
  pos += schemaBytes.length
  buf[pos++] = 0
  buf.set(nameBytes, pos)
  pos += nameBytes.length
  buf[pos++] = 0
  buf[pos++] = replicaIdentity
  writeInt16(buf, pos, columns.length)
  pos += 2

  for (let i = 0; i < columns.length; i++) {
    buf[pos++] = 0 // flags
    buf.set(colNameBytes[i], pos)
    pos += colNameBytes[i].length
    buf[pos++] = 0
    writeInt32(buf, pos, columns[i].typeOid)
    pos += 4
    writeInt32(buf, pos, columns[i].typeMod)
    pos += 4
  }

  return buf
}

function encodeTupleData(row: Record<string, unknown>, columns: ColumnInfo[]): Uint8Array {
  const parts: Uint8Array[] = []
  let totalSize = 2 // ncolumns (int16)

  const values: (Uint8Array | null)[] = []
  for (const col of columns) {
    const val = row[col.name]
    if (val === null || val === undefined) {
      values.push(null)
      totalSize += 1 // 'n' byte
    } else {
      const strVal = typeof val === 'object' ? JSON.stringify(val) : String(val)
      const bytes = encodeString(strVal)
      values.push(bytes)
      totalSize += 1 + 4 + bytes.length // 't' + len + data
    }
  }

  const buf = new Uint8Array(totalSize)
  let pos = 0
  writeInt16(buf, pos, columns.length)
  pos += 2

  for (const val of values) {
    if (val === null) {
      buf[pos++] = 0x6e // 'n' for null
    } else {
      buf[pos++] = 0x74 // 't' for text
      writeInt32(buf, pos, val.length)
      pos += 4
      buf.set(val, pos)
      pos += val.length
    }
  }

  return buf
}

// encode an INSERT message
export function encodeInsert(tableOid: number, row: Record<string, unknown>, columns: ColumnInfo[]): Uint8Array {
  const tuple = encodeTupleData(row, columns)
  const buf = new Uint8Array(1 + 4 + 1 + tuple.length)
  buf[0] = 0x49 // 'I'
  writeInt32(buf, 1, tableOid)
  buf[5] = 0x4e // 'N' for new tuple
  buf.set(tuple, 6)
  return buf
}

// encode an UPDATE message
export function encodeUpdate(
  tableOid: number,
  row: Record<string, unknown>,
  oldRow: Record<string, unknown> | null,
  columns: ColumnInfo[]
): Uint8Array {
  const newTuple = encodeTupleData(row, columns)

  if (oldRow) {
    const oldTuple = encodeTupleData(oldRow, columns)
    const buf = new Uint8Array(1 + 4 + 1 + oldTuple.length + 1 + newTuple.length)
    buf[0] = 0x55 // 'U'
    writeInt32(buf, 1, tableOid)
    buf[5] = 0x4f // 'O' for old tuple
    buf.set(oldTuple, 6)
    buf[6 + oldTuple.length] = 0x4e // 'N' for new tuple
    buf.set(newTuple, 7 + oldTuple.length)
    return buf
  }

  const buf = new Uint8Array(1 + 4 + 1 + newTuple.length)
  buf[0] = 0x55 // 'U'
  writeInt32(buf, 1, tableOid)
  buf[5] = 0x4e // 'N'
  buf.set(newTuple, 6)
  return buf
}

// encode a DELETE message
export function encodeDelete(
  tableOid: number,
  oldRow: Record<string, unknown>,
  columns: ColumnInfo[]
): Uint8Array {
  const tuple = encodeTupleData(oldRow, columns)
  const buf = new Uint8Array(1 + 4 + 1 + tuple.length)
  buf[0] = 0x44 // 'D'
  writeInt32(buf, 1, tableOid)
  buf[5] = 0x4b // 'K' for key tuple
  buf.set(tuple, 6)
  return buf
}

// wrap a pgoutput message in XLogData format
export function wrapXLogData(walStart: bigint, walEnd: bigint, timestamp: bigint, data: Uint8Array): Uint8Array {
  const buf = new Uint8Array(1 + 8 + 8 + 8 + data.length)
  buf[0] = 0x77 // 'w' XLogData
  writeInt64(buf, 1, walStart)
  writeInt64(buf, 9, walEnd)
  writeInt64(buf, 17, timestamp - PG_EPOCH_MICROS)
  buf.set(data, 25)
  return buf
}

// wrap in CopyData format
export function wrapCopyData(data: Uint8Array): Uint8Array {
  const buf = new Uint8Array(1 + 4 + data.length)
  buf[0] = 0x64 // 'd' CopyData
  writeInt32(buf, 1, 4 + data.length)
  buf.set(data, 5)
  return buf
}

// encode a primary keepalive message
export function encodeKeepalive(walEnd: bigint, timestamp: bigint, replyRequested: boolean): Uint8Array {
  const inner = new Uint8Array(1 + 8 + 8 + 1)
  inner[0] = 0x6b // 'k' keepalive
  writeInt64(inner, 1, walEnd)
  writeInt64(inner, 9, timestamp - PG_EPOCH_MICROS)
  inner[17] = replyRequested ? 1 : 0
  return wrapCopyData(inner)
}

export { getTableOid }
