#!/usr/bin/env bun

import { cmd } from '@take-out/cli'

await cmd`Run oxlint linter`.args('--fix boolean').run(async ({ args, $ }) => {
  if (args.fix) {
    await $`oxfmt && oxlint --import-plugin --type-aware --fix --fix-suggestions`
  } else {
    await $`oxlint --import-plugin --type-aware`
  }
})
