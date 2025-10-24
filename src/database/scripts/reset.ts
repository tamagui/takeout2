#!/usr/bin/env bun

/**
 * Used this a while ago to reset production but don't ever use this
 * But maybe helpful as a code example
 */

import '../../../scripts/ensure-tunnel'

import { Resource } from 'sst'
import { Client } from 'pg'
import { createInterface } from 'node:readline/promises'
import { $ } from 'bun'

const readline = createInterface({
  input: process.stdin,
  output: process.stdout,
})

async function confirm(message: string, defaultValue = false): Promise<boolean> {
  const response = await readline.question(
    `${message} (${defaultValue ? 'Y/n' : 'y/N'}): `
  )
  const normalized = response.toLowerCase().trim()
  if (normalized === '') return defaultValue
  return normalized === 'y' || normalized === 'yes'
}

async function getClient() {
  const client = new Client({
    host: Resource.Postgres2.host,
    user: Resource.Postgres2.username,
    password: Resource.Postgres2.password,
    database: Resource.Postgres2.database,
  })
  await client.connect()
  return client
}

async function getAllSchemas(client: Client) {
  const result = await client.query(`
    SELECT schema_name 
    FROM information_schema.schemata 
    WHERE schema_name NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
  `)
  return result.rows.map((row) => row.schema_name)
}

async function getTablesInSchema(client: Client, schema: string) {
  const result = await client.query(
    `
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = $1 
    AND table_type = 'BASE TABLE'
  `,
    [schema]
  )
  return result.rows.map((row) => row.table_name)
}

async function dropAllTables() {
  const client = await getClient()
  try {
    const schemas = await getAllSchemas(client)
    console.info('Found schemas:', schemas)

    let totalTables = 0
    for (const schema of schemas) {
      const tables = await getTablesInSchema(client, schema)
      if (tables.length === 0) continue

      console.info(`\nSchema "${schema}" has ${tables.length} tables:`)
      console.info(tables.join(', '))
      totalTables += tables.length

      // Drop all tables in this schema
      await client.query('SET session_replication_role = replica;') // Disable triggers temporarily
      for (const table of tables) {
        await client.query(`DROP TABLE IF EXISTS "${schema}"."${table}" CASCADE;`)
        console.info(`Dropped table ${schema}.${table}`)
      }
      await client.query('SET session_replication_role = DEFAULT;') // Re-enable triggers
    }

    console.info(
      `\n✅ Successfully dropped ${totalTables} tables across ${schemas.length} schemas`
    )
    return totalTables > 0
  } finally {
    await client.end()
  }
}

async function main() {
  console.info('🔄 Database Reset Script')
  console.info(`Database: ${Resource.Postgres2.database}`)
  console.info(`Host: ${Resource.Postgres2.host}\n`)

  if (
    !(await confirm(
      '⚠️  WARNING: This will delete ALL tables in ALL schemas. Are you sure?',
      false
    ))
  ) {
    console.info('❌ Aborted')
    process.exit(1)
  }

  const tablesDropped = await dropAllTables()

  if (
    tablesDropped &&
    (await confirm('🔄 Would you like to run migrations now?', true))
  ) {
    console.info('\nRunning migrations...')
    try {
      await $`bun migrate:production`
      console.info('✅ Migrations completed successfully')
    } catch (error) {
      console.error('❌ Migration failed:', error)
      process.exit(1)
    }
  }

  readline.close()
  console.info('\n✨ Database reset complete')
}

main().catch((error) => {
  console.error('❌ Error:', error)
  process.exit(1)
})
