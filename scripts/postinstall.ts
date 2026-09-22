#!/usr/bin/env bun

import { cmd } from '@o/cli'

await cmd`npm postinstall tasks`.run(async ({ $ }) => {
  // "tko" wont work until this runs so referencing it directly:
  const buildInitialLocation = require.resolve('@o/scripts/build-initial')
  await $`bun run ${buildInitialLocation}`

  await Promise.all([
    // for orez (best compat):
    !process.env.CI && $`bun tko run ensure-zero-sqlite`,
    $`bun tko run env-update`,
    $`bun run one patch`,
    // regenerate claude code skills from docs (skills dir is gitignored)
    $`bun tko skills generate`,
  ])
})
