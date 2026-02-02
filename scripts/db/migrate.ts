#!/usr/bin/env bun

/**
 * @description Build and run database migrations
 */

import { $ } from 'bun'

await $`bun tko db build`
await $`RUN=1 bun ./src/database/migrate-dist.js`
