#!/usr/bin/env bun

import './ensure-tunnel'

import { Resource } from 'sst'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { $ } from 'bun'

const rootDir = process.cwd()
const tmpDir = join(rootDir, 'src/database/tmp')
const dumpFile = join(tmpDir, 'production-dump.sql')

async function main() {
  console.info('🔄 Database Pull Script')
  console.info(`Source: ${Resource.Postgres2.database} on ${Resource.Postgres2.host}`)
  console.info(`Target: ${dumpFile}\n`)

  // ensure tmp directory exists
  await $`mkdir -p ${tmpDir}`

  // warn if dump file already exists
  if (existsSync(dumpFile)) {
    console.warn(`⚠️  Warning: ${dumpFile} already exists and will be overwritten`)
  }

  console.info('📥 Pulling database from production...')

  const result = Bun.spawnSync(
    [
      'pg_dump',
      '--clean',
      '--if-exists',
      '--no-owner',
      '--no-privileges',
      '--verbose',
      '--file',
      dumpFile,
    ],
    {
      env: {
        ...process.env,
        PGPASSWORD: Resource.Postgres2.password,
        PGUSER: Resource.Postgres2.username,
        PGHOST: Resource.Postgres2.host,
        PGDATABASE: Resource.Postgres2.database,
      } as any,
      stdout: 'inherit',
      stderr: 'inherit',
    }
  )

  if (result.exitCode !== 0) {
    console.error('❌ Failed to pull database')
    process.exit(1)
  }

  console.info(`✅ Successfully pulled database to ${dumpFile}`)
}

main().catch((error) => {
  console.error('❌ Error:', error)
  process.exit(1)
})
