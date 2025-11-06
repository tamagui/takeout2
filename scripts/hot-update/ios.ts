#!/usr/bin/env bun

/**
 * @description Deploy hot update for iOS
 * @args --production
 */

import { $ } from 'bun'
await $`bunx hot-updater deploy --platform ios ${process.argv.slice(2)}`
