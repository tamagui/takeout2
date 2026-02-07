#!/usr/bin/env bun

import { cmd } from '@take-out/cli'

await cmd(`Run oxlint linter`)
  .args('--fix boolean')
  .run(async ({ fix, $ }) => {
    if (fix) {
      await $`oxfmt && oxlint --fix --fix-suggestions`
    } else {
      await $`oxlint`
    }
  })
