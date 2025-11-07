#!/usr/bin/env bun

/**
 * @description Upgrade better-auth and all @better-auth/* packages
 */

import { $ } from 'bun'

const args = process.argv.slice(2)
await $`bun tko update-deps ${args} better-auth '@better-auth/*'`
