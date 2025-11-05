#!/usr/bin/env bun

/**
 * @description Build web platform
 */

import { $ } from 'bun'

await $`bun run:prod one build --platform=web`
