#!/usr/bin/env bun

/**
 * @description Upgrade @take-out/* and over-zero packages
 */

import { $ } from 'bun'

const args = process.argv.slice(2)
await $`bun tko update-deps ${args} '@take-out/*' over-zero`
