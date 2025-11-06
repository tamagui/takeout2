#!/usr/bin/env bun

/**
 * @description Generate Zero sync code
 */

import { $ } from 'bun'

console.info('Generating Zero sync code...')
await $`bun over-zero generate`
