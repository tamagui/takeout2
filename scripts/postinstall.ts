#!/usr/bin/env bun

import { cmd } from '@take-out/cli'

await cmd`npm postinstall tasks`.run(async ({ $, fs }) => {
  // "tko" wont work until this runs so referencing it directly:
  const buildInitialLocation = require.resolve('@take-out/scripts/build-initial')
  await $`bun run ${buildInitialLocation}`

  await Promise.all([
    $`bun tko run generate-env`,
    $`bun run one patch`,
    // regenerate claude code skills from docs (skills dir is gitignored)
    $`bun tko skills generate`,
  ])
})
