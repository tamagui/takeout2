#!/usr/bin/env bun

/**
 * @description Build preview profile for all platforms
 */

import { $ } from 'bun'

await $`eas build --profile preview --platform all`
