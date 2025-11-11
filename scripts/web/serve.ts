#!/usr/bin/env bun

/**
 * @description Serve web in production mode
 */

import { $ } from 'bun'

await $`bun one serve --port 8081`
