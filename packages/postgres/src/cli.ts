#!/usr/bin/env node
import { join } from 'node:path'

import { defineCommand, runMain } from 'citty'

import { buildMigrations as buildMigrationsRun } from './scripts/build-migrations'
import { syncDrizzleMigrations } from './scripts/drizzle-migrations-sync'
import { addMigration } from './scripts/migration-add'
import { runPgDump } from './scripts/pg_dump'
import { runPsql } from './scripts/psql'

const syncDrizzle = defineCommand({
  meta: {
    name: 'sync-drizzle',
    description: 'Sync Drizzle SQL migrations to TypeScript wrappers',
  },
  args: {
    dir: {
      type: 'string',
      description: 'Migrations directory',
      required: false,
      default: './src/database/migrations',
    },
  },
  async run({ args }) {
    const migrationsDir = join(process.cwd(), args.dir)
    console.info(`Syncing migrations in ${migrationsDir}`)
    await syncDrizzleMigrations({ migrationsDir })
  },
})

const buildMigrations = defineCommand({
  meta: {
    name: 'build-migrations',
    description: 'Build migration bundle for deployment',
  },
  args: {
    dir: {
      type: 'string',
      description: 'Migrations directory',
      required: false,
      default: './src/database/migrations',
    },
    out: {
      type: 'string',
      description: 'Output file name',
      required: false,
      default: 'migrate-dist.js',
    },
  },
  async run({ args }) {
    const migrationsDir = join(process.cwd(), args.dir)
    await buildMigrationsRun({
      migrationsDir,
      outFile: args.out,
    })
  },
})

const migrationAdd = defineCommand({
  meta: {
    name: 'migrate:add',
    description: 'Create a new custom TypeScript migration',
  },
  args: {
    name: {
      type: 'positional',
      description: 'Migration name',
      required: false,
    },
    dir: {
      type: 'string',
      description: 'Migrations directory',
      required: false,
      default: './src/database/migrations',
    },
  },
  async run({ args }) {
    const migrationsDir = join(process.cwd(), args.dir)
    addMigration({ migrationsDir, name: args.name })
  },
})

const psql = defineCommand({
  meta: {
    name: 'psql',
    description: 'Connect to PostgreSQL database with psql',
  },
  args: {
    connectionString: {
      type: 'string',
      description: 'PostgreSQL connection string',
      required: false,
    },
    query: {
      type: 'string',
      description: 'Query to execute',
      required: false,
    },
  },
  async run({ args }) {
    const connectionString = args.connectionString || process.env.ZERO_UPSTREAM_DB
    if (!connectionString) {
      console.error(
        'No connection string provided. Set ZERO_UPSTREAM_DB or pass --connectionString'
      )
      process.exit(1)
    }
    const exitCode = runPsql({ connectionString, query: args.query })
    process.exit(exitCode || 0)
  },
})

const pgDump = defineCommand({
  meta: {
    name: 'pg_dump',
    description: 'Dump PostgreSQL database using pg_dump',
  },
  args: {
    connectionString: {
      type: 'string',
      description: 'PostgreSQL connection string',
      required: false,
    },
  },
  async run({ args }) {
    const connectionString = args.connectionString || process.env.ZERO_UPSTREAM_DB
    if (!connectionString) {
      console.error(
        'No connection string provided. Set ZERO_UPSTREAM_DB or pass --connectionString'
      )
      process.exit(1)
    }
    const cliArgs = process.argv.slice(3) // get args after command name
    const exitCode = runPgDump({ connectionString, args: cliArgs })
    process.exit(exitCode || 0)
  },
})

const main = defineCommand({
  meta: {
    name: 'postgres',
    description: 'PostgreSQL database utilities and migration tools',
    version: '0.0.1',
  },
  subCommands: {
    'sync-drizzle': syncDrizzle,
    'build-migrations': buildMigrations,
    'migrate:add': migrationAdd,
    psql,
    pg_dump: pgDump,
  },
})

runMain(main)
