#!/usr/bin/env bun

/**
 * @description Build migrations for production
 */

import { $ } from 'bun'

console.info('Building migrations for production...')

// Run drizzle migration generation
await $`bun drizzle-kit generate --config ./src/database/drizzle.config.ts`

// Build the migration scripts
await $`bun build ./src/database/migrate.ts --outdir=dist/migrations --target=node --format=esm`

console.info('✅ Migrations built successfully')
