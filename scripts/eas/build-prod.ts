#!/usr/bin/env bun

/**
 * @description Build production profile for all platforms
 */

import { $ } from 'bun'

await $`eas build --profile production --platform all`
