#!/usr/bin/env bun

/**
 * @description Check for circular dependencies
 */

import { $ } from 'bun'

// uses oxlint import/no-cycle rule configured in .oxlintrc.json
await $`oxlint --import-plugin --deny import/no-cycle app/ src/`
