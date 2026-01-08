#!/usr/bin/env bun

/**
 * @description Upgrade @rocicorp/zero package
 */

import { $ } from 'bun'

const args = process.argv.slice(2)
await $`bun tko update-deps ${args} @rocicorp/zero`

// update ZERO_VERSION in .env
await $`bun tko run update-local-env`
