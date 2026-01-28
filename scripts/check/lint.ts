#!/usr/bin/env bun

/**
 * @description Run oxlint linter
 * @args --fix
 */

import { args } from '@take-out/scripts/helpers/args'
import { $ } from 'bun'

const { fix } = args('--fix boolean')

if (fix) {
  await $`oxfmt && oxlint --fix --fix-suggestions`
} else {
  await $`oxlint`
}
