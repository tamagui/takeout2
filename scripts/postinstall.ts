#!/usr/bin/env bun

/**
 * @description npm postinstall tasks
 */

import { $ } from 'bun'

await $`bun tko run build-initial`
await $`bun tko run update-local-env`
await $`bun run one patch`
