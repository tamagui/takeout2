#!/usr/bin/env bun

/**
 * @description Upgrade tauri packages
 */

import { $ } from 'bun'

// delegate to existing tauri upgrade script
await $`./src/tauri/scripts/upgrade-tauri.ts`
