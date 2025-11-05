#!/usr/bin/env bun

/**
 * @description Upgrade one framework and all @vxrn/* packages
 */

import { $ } from 'bun'

await $`bun up 'one' '@vxrn/*' 'over-zero'`
