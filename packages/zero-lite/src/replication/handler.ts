/**
 * replication protocol handler.
 *
 * intercepts replication-mode queries (IDENTIFY_SYSTEM, CREATE_REPLICATION_SLOT,
 * START_REPLICATION) and returns fake responses that make zero-cache believe
 * it's talking to a real postgres with logical replication.
 */

import type { PGlite } from '@electric-sql/pglite'
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
import { getChangesSince, getCurrentWatermark, type ChangeRecord } from './change-tracker'

export interface ReplicationWriter {
  write(data: Uint8Array): void
}

// current lsn counter
let currentLsn = 0x1000000n
function nextLsn(): bigint {
  currentLsn += 0x100n
  return currentLsn
}

function lsnToString(lsn: bigint): string {
  const high = Number(lsn >> 32n)
  const low = Number(lsn & 0xffffffffn)
  return `${high.toString(16).toUpperCase()}/${low.toString(16).toUpperCase()}`
}

function nowMicros(): bigint {
  return BigInt(Date.now()) * 1000n
}

// build a wire protocol row description + data row response
function buildSimpleResponse(columns: string[], values: string[]): Uint8Array {
  const parts: Uint8Array[] = []
  const encoder = new TextEncoder()

  // RowDescription (0x54)
  let rdSize = 6 // int32 len + int16 numFields
  const colBytes: Uint8Array[] = []
  for (const col of columns) {
    const b = encoder.encode(col)
    colBytes.push(b)
    rdSize += b.length + 1 + 4 + 2 + 4 + 2 + 4 + 2 // name+null + tableOid + colAttr + typeOid + typeLen + typeMod + formatCode
  }
  const rd = new Uint8Array(1 + rdSize)
  const rdv = new DataView(rd.buffer)
  rd[0] = 0x54
  rdv.setInt32(1, rdSize)
  rdv.setInt16(5, columns.length)
  let pos = 7
  for (let i = 0; i < columns.length; i++) {
    rd.set(colBytes[i], pos)
    pos += colBytes[i].length
    rd[pos++] = 0
    rdv.setInt32(pos, 0) // tableOid
    pos += 4
    rdv.setInt16(pos, 0) // colAttr
    pos += 2
    rdv.setInt32(pos, 25) // typeOid (text)
    pos += 4
    rdv.setInt16(pos, -1) // typeLen
    pos += 2
    rdv.setInt32(pos, -1) // typeMod
    pos += 4
    rdv.setInt16(pos, 0) // formatCode (text)
    pos += 2
  }
  parts.push(rd)

  // DataRow (0x44)
  let drSize = 6 // int32 len + int16 numCols
  const valBytes: Uint8Array[] = []
  for (const val of values) {
    const b = encoder.encode(val)
    valBytes.push(b)
    drSize += 4 + b.length
  }
  const dr = new Uint8Array(1 + drSize)
  const drv = new DataView(dr.buffer)
  dr[0] = 0x44
  drv.setInt32(1, drSize)
  drv.setInt16(5, values.length)
  pos = 7
  for (const vb of valBytes) {
    drv.setInt32(pos, vb.length)
    pos += 4
    dr.set(vb, pos)
    pos += vb.length
  }
  parts.push(dr)

  // CommandComplete (0x43)
  const tag = encoder.encode('SELECT 1\0')
  const cc = new Uint8Array(1 + 4 + tag.length)
  cc[0] = 0x43
  new DataView(cc.buffer).setInt32(1, 4 + tag.length)
  cc.set(tag, 5)
  parts.push(cc)

  // ReadyForQuery (0x5a)
  const rfq = new Uint8Array(6)
  rfq[0] = 0x5a
  new DataView(rfq.buffer).setInt32(1, 5)
  rfq[5] = 0x49 // 'I' idle
  parts.push(rfq)

  // concatenate
  const totalLen = parts.reduce((sum, p) => sum + p.length, 0)
  const result = new Uint8Array(totalLen)
  let offset = 0
  for (const p of parts) {
    result.set(p, offset)
    offset += p.length
  }
  return result
}

function buildCommandComplete(tag: string): Uint8Array {
  const encoder = new TextEncoder()
  const tagBytes = encoder.encode(tag + '\0')
  const cc = new Uint8Array(1 + 4 + tagBytes.length)
  cc[0] = 0x43
  new DataView(cc.buffer).setInt32(1, 4 + tagBytes.length)
  cc.set(tagBytes, 5)

  const rfq = new Uint8Array(6)
  rfq[0] = 0x5a
  new DataView(rfq.buffer).setInt32(1, 5)
  rfq[5] = 0x49

  const result = new Uint8Array(cc.length + rfq.length)
  result.set(cc, 0)
  result.set(rfq, cc.length)
  return result
}

function buildErrorResponse(message: string): Uint8Array {
  const encoder = new TextEncoder()
  const msgBytes = encoder.encode(message)
  // S(severity) + M(message) + null terminator
  const fields = new Uint8Array(2 + 6 + 2 + msgBytes.length + 1 + 1) // S + ERROR\0 + M + msg\0 + terminator
  let pos = 0
  fields[pos++] = 0x53 // 'S'
  const sev = encoder.encode('ERROR\0')
  fields.set(sev, pos)
  pos += sev.length
  fields[pos++] = 0x4d // 'M'
  fields.set(msgBytes, pos)
  pos += msgBytes.length
  fields[pos++] = 0 // null terminate message
  fields[pos++] = 0 // final terminator

  const buf = new Uint8Array(1 + 4 + pos)
  buf[0] = 0x45 // 'E'
  new DataView(buf.buffer).setInt32(1, 4 + pos)
  buf.set(fields.subarray(0, pos), 5)
  return buf
}

/**
 * handle a replication query. returns response bytes or null if not handled.
 * async because slot operations need to write to pglite.
 */
export async function handleReplicationQuery(query: string, db: PGlite): Promise<Uint8Array | null> {
  const trimmed = query.trim().replace(/;$/, '').trim()
  const upper = trimmed.toUpperCase()

  if (upper === 'IDENTIFY_SYSTEM') {
    const lsn = lsnToString(currentLsn)
    return buildSimpleResponse(
      ['systemid', 'timeline', 'xlogpos', 'dbname'],
      ['1234567890', '1', lsn, 'postgres']
    )
  }

  if (upper.startsWith('CREATE_REPLICATION_SLOT')) {
    const match = trimmed.match(/CREATE_REPLICATION_SLOT\s+"?(\w[^"\s]*)"?\s+/i)
    const slotName = match?.[1] || 'zero_slot'
    const lsn = lsnToString(nextLsn())
    const snapshotName = `00000003-00000001-1`

    // persist slot so pg_replication_slots queries find it
    await db.exec(`
      INSERT INTO public._zero_replication_slots (slot_name, restart_lsn, confirmed_flush_lsn)
      VALUES ('${slotName}', '${lsn}', '${lsn}')
      ON CONFLICT (slot_name) DO UPDATE SET restart_lsn = '${lsn}', confirmed_flush_lsn = '${lsn}'
    `)

    return buildSimpleResponse(
      ['slot_name', 'consistent_point', 'snapshot_name', 'output_plugin'],
      [slotName, lsn, snapshotName, 'pgoutput']
    )
  }

  if (upper.startsWith('DROP_REPLICATION_SLOT')) {
    const match = trimmed.match(/DROP_REPLICATION_SLOT\s+"?(\w[^"\s]*)"?/i)
    const slotName = match?.[1]
    if (slotName) {
      await db.exec(`DELETE FROM public._zero_replication_slots WHERE slot_name = '${slotName}'`)
    }
    return buildCommandComplete('DROP_REPLICATION_SLOT')
  }

  // wal_level check via simple query
  if (upper.includes('WAL_LEVEL') && upper.includes('CURRENT_SETTING')) {
    return buildSimpleResponse(['walLevel', 'version'], ['logical', '160004'])
  }

  // ALTER ROLE for replication permission
  if (upper.startsWith('ALTER ROLE') && upper.includes('REPLICATION')) {
    return buildCommandComplete('ALTER ROLE')
  }

  return null
}

/**
 * start streaming replication changes to the client.
 * this runs indefinitely until the connection is closed.
 */
export async function handleStartReplication(
  query: string,
  writer: ReplicationWriter,
  db: PGlite
): Promise<void> {
  console.info('[zero-lite] replication: entering streaming mode')

  // send CopyBothResponse to enter streaming mode
  const copyBoth = new Uint8Array(1 + 4 + 1 + 2)
  copyBoth[0] = 0x57 // 'W' CopyBothResponse
  new DataView(copyBoth.buffer).setInt32(1, 4 + 1 + 2)
  copyBoth[5] = 0 // overall format (0 = text)
  new DataView(copyBoth.buffer).setInt16(6, 0) // 0 columns
  writer.write(copyBoth)

  let lastWatermark = 0

  // set up LISTEN for real-time change notifications
  await db.exec(`
    CREATE OR REPLACE FUNCTION public._zero_notify_change() RETURNS TRIGGER AS $$
    BEGIN
      PERFORM pg_notify('_zero_changes', TG_TABLE_NAME);
      RETURN NULL;
    END;
    $$ LANGUAGE plpgsql;
  `)

  // install notify trigger on all tracked tables
  const tables = await db.query<{ tablename: string }>(
    `SELECT tablename FROM pg_tables
     WHERE schemaname = 'public'
       AND tablename NOT IN ('migrations', '_zero_changes')
       AND tablename NOT LIKE '_zero_%'`
  )

  for (const { tablename } of tables.rows) {
    await db.exec(`
      DROP TRIGGER IF EXISTS _zero_notify_trigger ON public."${tablename}";
      CREATE TRIGGER _zero_notify_trigger
        AFTER INSERT OR UPDATE OR DELETE ON public."${tablename}"
        FOR EACH STATEMENT EXECUTE FUNCTION public._zero_notify_change();
    `)
  }

  // track which tables we've sent RELATION messages for
  const sentRelations = new Set<string>()
  let txCounter = 1

  // polling + notification loop
  const pollInterval = 500
  let running = true

  const poll = async () => {
    while (running) {
      try {
        const changes = await getChangesSince(db, lastWatermark, 100)

        if (changes.length > 0) {
          await streamChanges(changes, writer, sentRelations, txCounter++)
          lastWatermark = changes[changes.length - 1].watermark
        }

        // send keepalive
        const ts = nowMicros()
        writer.write(encodeKeepalive(currentLsn, ts, false))

        await new Promise((resolve) => setTimeout(resolve, pollInterval))
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)
        console.info(`[zero-lite] replication poll error: ${msg}`)
        if (msg.includes('closed') || msg.includes('destroyed')) {
          running = false
          break
        }
        await new Promise((resolve) => setTimeout(resolve, 1000))
      }
    }
  }

  // start polling (runs until connection closes)
  console.info('[zero-lite] replication: starting poll loop')
  await poll()
  console.info('[zero-lite] replication: poll loop exited')
}

async function streamChanges(
  changes: ChangeRecord[],
  writer: ReplicationWriter,
  sentRelations: Set<string>,
  txId: number
): Promise<void> {
  const ts = nowMicros()
  const lsn = nextLsn()

  // BEGIN
  const beginMsg = wrapXLogData(lsn, lsn, ts, encodeBegin(lsn, ts, txId))
  writer.write(wrapCopyData(beginMsg))

  for (const change of changes) {
    const tableOid = getTableOid(change.table_name)
    const row = change.row_data || change.old_data
    if (!row) continue

    const columns = inferColumns(row)

    // send RELATION if not yet sent
    if (!sentRelations.has(change.table_name)) {
      const relMsg = encodeRelation(tableOid, 'public', change.table_name, 0x64, columns)
      writer.write(wrapCopyData(wrapXLogData(lsn, lsn, ts, relMsg)))
      sentRelations.add(change.table_name)
    }

    // send the change
    let changeMsg: Uint8Array
    switch (change.op) {
      case 'INSERT':
        changeMsg = encodeInsert(tableOid, change.row_data!, columns)
        break
      case 'UPDATE':
        changeMsg = encodeUpdate(tableOid, change.row_data!, change.old_data, columns)
        break
      case 'DELETE':
        changeMsg = encodeDelete(tableOid, change.old_data!, columns)
        break
    }

    writer.write(wrapCopyData(wrapXLogData(lsn, lsn, ts, changeMsg)))
  }

  // COMMIT
  const endLsn = nextLsn()
  const commitMsg = wrapXLogData(endLsn, endLsn, ts, encodeCommit(0, lsn, endLsn, ts))
  writer.write(wrapCopyData(commitMsg))
}

export { buildErrorResponse }
