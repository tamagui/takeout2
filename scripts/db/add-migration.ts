#!/usr/bin/env bun

/**
 * @description Add a new database migration
 * @args [name]
 */

import { join } from 'node:path'

import { addMigration } from '@take-out/postgres/scripts/migration-add'

const name = process.argv[2]
const migrationsDir = join(process.cwd(), 'src/database/migrations')

addMigration({ migrationsDir, name })
