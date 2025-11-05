#!/usr/bin/env bun

/**
 * @description Run all checks: lint, types, and dependencies
 */

import { $ } from 'bun'

console.info('Running all checks...')

await $`tko run lint check/types dependencies`
