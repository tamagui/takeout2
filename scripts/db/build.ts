#!/usr/bin/env bun

/**
 * @description Build migrations for production (generates SQL + bundles for docker)
 */

import { $ } from 'bun'

// generate drizzle SQL from schema
await $`bun drizzle-kit generate --config ./src/database/drizzle.config.ts`

// bundle migrate.ts for production use
await $`cd src/database && bun vite build`

console.info('✅ migrations built')
