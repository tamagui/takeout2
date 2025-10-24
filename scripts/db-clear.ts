#!/usr/bin/env bun

import { getDb } from '../src/database'
import * as schema from '../src/database/schema-public'

// tables to keep their data
const EXCLUDED_TABLES = [
  'server',
  'channel',
  'role',
  'userRole',
  'serverMember',
  'userPublic',
  'channelPermission',
]

async function clearTables() {
  const db = getDb()

  // get all table names from schema-public and filter out excluded tables
  const allTableNames = Object.keys(schema)
  const tablesToClear = allTableNames.filter(
    (tableName) => !EXCLUDED_TABLES.includes(tableName)
  )

  console.info('🗑️  Starting to clear tables...')
  console.info(`📋 Tables to clear: ${tablesToClear.join(', ')}`)
  console.info(`🛡️  Tables to keep: ${EXCLUDED_TABLES.join(', ')}`)

  let totalDeleted = 0

  for (const tableName of tablesToClear) {
    try {
      const table = (schema as any)[tableName]
      if (!table) {
        console.warn(`⚠️  Table ${tableName} not found in schema`)
        continue
      }

      const result = await db.delete(table)
      console.info(`✅ Cleared ${tableName} - ${result.rowCount} rows deleted`)
      totalDeleted += result.rowCount || 0
    } catch (error) {
      console.error(`❌ Error clearing ${tableName}:`, error)
    }
  }

  console.info(`\n🎉 Completed! Total rows deleted: ${totalDeleted}`)
  console.info(`🛡️  Preserved tables: ${EXCLUDED_TABLES.join(', ')}`)
}

// run the script
clearTables().catch((error) => {
  console.error('💥 Script failed:', error)
  process.exit(1)
})
