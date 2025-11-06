#!/usr/bin/env node

/**
 * Takeout CLI
 * Interactive tools for Takeout starter kit setup and management
 */

import { defineCommand, runMain } from 'citty'
import { existsSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { completionCommand } from './commands/completion'
import { docsCommand } from './commands/docs'
import { envSetupCommand } from './commands/env-setup'
import { onboardCommand } from './commands/onboard'
import { runCommand } from './commands/run'
import { scriptCommand } from './commands/script'

// check if a directory exists in scripts folder (lazy check)
function isScriptCategory(name: string): boolean {
  const scriptsDir = join(process.cwd(), 'scripts')
  const categoryPath = join(scriptsDir, name)

  try {
    return existsSync(categoryPath) && statSync(categoryPath).isDirectory()
  } catch {
    return false
  }
}

// detect if running as tko (shorthand mode)
const isShorthand =
  process.argv[1]?.endsWith('tko') || process.argv[1]?.includes('/.bin/tko')

if (isShorthand) {
  // in shorthand mode, treat first arg as potential script command
  const firstArg = process.argv[2]
  const secondArg = process.argv[3]
  const builtInCommands = [
    'check',
    'docs',
    'onboard',
    'run',
    'script',
    'env:setup',
    'completion',
    '--help',
    '-h',
    '--version',
    '-v',
  ]

  if (firstArg && !builtInCommands.includes(firstArg)) {
    // check if it's a script category or has a slash (category/script format)
    // Do a lazy check only on the specific arg, not scanning all directories
    if (isScriptCategory(firstArg)) {
      // If there's a second arg, treat it as a script within the category
      // e.g., "tko aws health" becomes "tko run aws/health"
      if (secondArg && !secondArg.startsWith('-')) {
        // Replace the two args with the combined path
        process.argv.splice(2, 2, `${firstArg}/${secondArg}`)
      }
      // inject "run" into args to use the run command directly
      process.argv.splice(2, 0, 'run')
    } else if (firstArg?.includes('/')) {
      // inject "run" into args to use the run command directly
      process.argv.splice(2, 0, 'run')
    } else {
      // assume it's a script command, inject "script" into args
      process.argv.splice(2, 0, 'script')
    }
  }
}

const main = defineCommand({
  meta: {
    name: isShorthand ? 'tko' : 'takeout',
    version: '0.0.2',
    description: isShorthand
      ? 'Takeout CLI (shorthand) - try "tko ci" to run CI scripts'
      : 'CLI tools for Takeout starter kit',
  },
  subCommands: {
    onboard: onboardCommand,
    docs: docsCommand,
    'env:setup': envSetupCommand,
    run: runCommand,
    script: scriptCommand,
    completion: completionCommand,
  },
})

runMain(main)
