#!/usr/bin/env node

/**
 * Takeout CLI
 * Interactive tools for Takeout starter kit setup and management
 */

import { defineCommand, runMain } from 'citty'
import { checkCommand } from './commands/check'
import { docsCommand } from './commands/docs'
import { onboardCommand } from './commands/onboard'
import { scriptCommand } from './commands/script'
import { updateDocsCommand } from './commands/update-docs'
import { updateScriptsCommand } from './commands/update-scripts'

const main = defineCommand({
  meta: {
    name: 'takeout',
    version: '0.0.1',
    description: 'CLI tools for Takeout starter kit',
  },
  subCommands: {
    onboard: onboardCommand,
    check: checkCommand,
    docs: docsCommand,
    script: scriptCommand,
    'update-docs': updateDocsCommand,
    'update-scripts': updateScriptsCommand,
  },
})

runMain(main)
