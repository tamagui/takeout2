#!/usr/bin/env bun

/**
 * @description Serve web on port 8081
 */

import { $ } from 'bun'

await $`one serve --port 8081`
