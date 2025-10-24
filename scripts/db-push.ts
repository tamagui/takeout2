#!/usr/bin/env bun

import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { createInterface } from 'node:readline/promises'
import { Client } from 'pg'
import { loadEnv } from './helpers/env-load'

const rootDir = process.cwd()
const tmpDir = join(rootDir, 'src/database/tmp')
const dumpFile = join(tmpDir, 'production-dump.sql')

const readline = createInterface({
  input: process.stdin,
  output: process.stdout,
})

async function confirmAction(): Promise<boolean> {
  const response = await readline.question(
    '⚠️  Type "confirm" to proceed with pushing to local dev database: '
  )
  return response.trim().toLowerCase() === 'confirm'
}

async function getDevClient() {
  const Env = await loadEnv('development')

  if (!Env.ZERO_UPSTREAM_DB) {
    throw new Error('ZERO_UPSTREAM_DB not found in development env')
  }

  const dbUrl = new URL(Env.ZERO_UPSTREAM_DB)
  if (dbUrl.hostname.includes('rds.amazonaws.com') || dbUrl.hostname.includes('prod')) {
    throw new Error(
      '❌ Safety check failed: This appears to be a production database URL. Only local dev databases are allowed.'
    )
  }

  console.info(
    `🔌 Connecting to development database: ${dbUrl.hostname}:${dbUrl.port}${dbUrl.pathname}`
  )

  const client = new Client({
    connectionString: Env.ZERO_UPSTREAM_DB,
  })

  await client.connect()
  return client
}

async function clearDatabase(client: Client) {
  console.info('🧹 Clearing development database...')

  const schemasResult = await client.query(`
    SELECT schema_name 
    FROM information_schema.schemata 
    WHERE schema_name NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
  `)

  let totalTables = 0

  for (const row of schemasResult.rows) {
    const schema = row.schema_name

    const tablesResult = await client.query(
      `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = $1 
      AND table_type = 'BASE TABLE'
    `,
      [schema]
    )

    if (tablesResult.rows.length === 0) continue

    console.info(`  Dropping ${tablesResult.rows.length} tables from schema "${schema}"`)
    totalTables += tablesResult.rows.length

    await client.query('SET session_replication_role = replica;')

    for (const tableRow of tablesResult.rows) {
      const table = tableRow.table_name
      await client.query(`DROP TABLE IF EXISTS "${schema}"."${table}" CASCADE;`)
    }

    await client.query('SET session_replication_role = DEFAULT;')
  }

  console.info(`✅ Cleared ${totalTables} tables from development database`)
}

async function importDump(connectionString: string) {
  console.info('📤 Importing database dump...')

  const dbUrl = new URL(connectionString)

  const result = Bun.spawnSync(['psql', '--quiet', '--file', dumpFile], {
    env: {
      ...process.env,
      PGHOST: dbUrl.hostname,
      PGPORT: dbUrl.port || '5432',
      PGUSER: dbUrl.username,
      PGPASSWORD: dbUrl.password,
      PGDATABASE: dbUrl.pathname.slice(1), // remove leading slash
    } as any,
    stdout: 'inherit',
    stderr: 'inherit',
  })

  if (result.exitCode !== 0) {
    throw new Error('Failed to import database dump')
  }

  console.info('✅ Successfully imported database dump')
}

async function main() {
  console.info('🔄 Database Push Script')
  console.info(`Source: ${dumpFile}`)
  console.info('Target: Local development database\n')

  if (!existsSync(dumpFile)) {
    console.error(`❌ Error: Dump file not found at ${dumpFile}`)
    console.info('💡 Hint: Run "bun db:pull" first to create a dump file')
    process.exit(1)
  }

  console.info('⚠️  WARNING: This will completely clear your local development database!')
  console.info('⚠️  All existing data will be lost and replaced with production data.')
  console.info('')

  if (!(await confirmAction())) {
    console.info('❌ Aborted')
    process.exit(1)
  }

  let client: Client | null = null

  try {
    const Environment = await loadEnv('development')
    if (!Environment.ZERO_UPSTREAM_DB) {
      throw new Error('ZERO_UPSTREAM_DB not found in development environment')
    }

    client = await getDevClient()
    await clearDatabase(client)
    await client.end()

    await importDump(Environment.ZERO_UPSTREAM_DB)

    console.info('\n✨ Database push complete!')
    console.info('💡 Your local development database now contains production data')
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  } finally {
    if (client) {
      await client.end()
    }
    readline.close()
  }
}

main().catch((error) => {
  console.error('❌ Error:', error)
  process.exit(1)
})
