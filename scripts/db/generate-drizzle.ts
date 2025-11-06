#!/usr/bin/env bun

/**
 * @description Generate Drizzle schema types
 */

import { $ } from 'bun'
await $`bunx drizzle-kit generate`
