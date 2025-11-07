#!/usr/bin/env bun

/**
 * @description Upgrade tamagui and all @tamagui/* packages
 */

import { $ } from 'bun'

const args = process.argv.slice(2)
await $`bun tko update-deps ${args} tamagui '@tamagui/*'`
