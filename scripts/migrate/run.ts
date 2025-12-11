#!/usr/bin/env bun

/**
 * @description Build and run migrations
 */

import { $ } from 'bun'

await $`bun tko migrate build`
await $`RUN=1 bun ./src/database/migrate-dist.js`
