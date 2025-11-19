#!/usr/bin/env bun

/**
 * @description Upgrade one framework and all @vxrn/* packages
 */

import { $ } from 'bun'

const args = process.argv.slice(2)
await $`bun tko update-deps ${args} one '@vxrn/*'`
