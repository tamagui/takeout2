#!/usr/bin/env bun

/**
 * @description Upgrade tamagui and all @tamagui/* packages
 */

import { $ } from 'bun'

await $`bun up tamagui '@tamagui/*'`
