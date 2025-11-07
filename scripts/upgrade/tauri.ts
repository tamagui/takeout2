#!/usr/bin/env bun

/**
 * @description Upgrade tauri packages
 */

import { $ } from 'bun'

const args = process.argv.slice(2)
// delegate to existing tauri upgrade script
await $`./src/tauri/scripts/upgrade-tauri.ts ${args}`
