#!/usr/bin/env bun

/**
 * @description Build migrations for production
 */

import { $ } from 'bun'

console.info('Building migrations for production...')

// Run drizzle migration generation
await $`bun drizzle-kit generate --config ./src/database/drizzle.config.ts`

// Build the migration scripts using vite config (run from database directory)
await $`cd src/database && bun vite build`

console.info('✅ Migrations built successfully')
