#!/usr/bin/env bun

import { cmd } from './cmd'

await cmd`sync @rocicorp/zero version from dependencies to env config`.run(
  async ({ $ }) => {
    const { getZeroVersion } = await import('./helpers/zero-get-version')

    const version = getZeroVersion()
    if (!version) {
      console.info('no @rocicorp/zero in dependencies, skipping')
      return
    }

    // writes ZERO_VERSION to .env so docker-compose picks it up
    await $`bun tko run update-local-env`
  }
)
