#!/usr/bin/env bun

/**
 * @description Upgrade better-auth and all @better-auth/* packages
 */

import { $ } from 'bun'

await $`bun up better-auth '@better-auth/*'`
