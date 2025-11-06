#!/usr/bin/env bun

/**
 * @description Run drizzle database migration
 * @args --dry-run
 */

import { $ } from 'bun'
await $`bunx better-auth/cli migrate ${process.argv.slice(2)}`
