#!/usr/bin/env bun

/**
 * @description Build and serve web in production mode
 */

import { $ } from 'bun'

await $`bun run:prod tko web build`
await $`bun run:prod tko web serve`
