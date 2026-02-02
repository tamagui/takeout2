#!/usr/bin/env bun

/**
 * @description Run better-auth database migrations
 * @args --dry-run
 */

import { $ } from 'bun'
await $`bunx better-auth/cli migrate ${process.argv.slice(2)}`
