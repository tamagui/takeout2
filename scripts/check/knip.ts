#!/usr/bin/env bun

/**
 * @description Run knip to find unused dependencies and exports
 */

import { $ } from 'bun'

await $`bunx knip`
