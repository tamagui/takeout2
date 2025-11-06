#!/usr/bin/env bun

/**
 * @description Deploy hot update for Android
 * @args --production
 */

import { $ } from 'bun'
await $`bunx hot-updater deploy --platform android ${process.argv.slice(2)}`
