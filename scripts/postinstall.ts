#!/usr/bin/env bun

/**
 * @description npm postinstall tasks
 */

import { $ } from 'bun'

// "tko" wont work until this runs so referencing it directly:
const buildInitialLocation = require.resolve('@take-out/scripts/build-initial')
await $`bun run ${buildInitialLocation}`

await $`bun tko run update-local-env`
await $`bun run one patch`
