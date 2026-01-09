#!/usr/bin/env node

/**
 * Takeout CLI
 * Interactive tools for Takeout starter kit setup and management
 */

import { existsSync, statSync } from 'node:fs'
import { join } from 'node:path'

import { defineCommand, runMain } from 'citty'

import { changedCommand } from './commands/changed'
import { docsCommand } from './commands/docs'
import { envSetupCommand } from './commands/env-setup'
import { onboardCommand } from './commands/onboard'
import { runCommand } from './commands/run'
import { scriptCommand } from './commands/script'
import { syncCommand } from './commands/sync'
import { listAllScripts } from './utils/script-listing'

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

// check if a name is a local script in ./scripts/
function isLocalScript(name: string): boolean {
  const scriptsDir = join(process.cwd(), 'scripts')
  const normalizedName = name.replace(/:/g, '/')

  for (const ext of ['.ts', '.js', '']) {
    const scriptPath = join(scriptsDir, `${normalizedName}${ext}`)
    if (existsSync(scriptPath)) {
      return true
    }
  }

  return false
}

// check if a name could be a built-in script
function isBuiltInScript(name: string): boolean {
  try {
    const resolved = import.meta.resolve('@take-out/scripts/package.json')
    const packageJsonPath = new URL(resolved).pathname
    const packageRoot = join(packageJsonPath, '..')
    const srcPath = join(packageRoot, 'src')

    // normalize name: convert colons to slashes
    const normalizedName = name.replace(/:/g, '/')

    // check if the script file exists
    for (const ext of ['.ts', '.js', '']) {
      const scriptPath = join(srcPath, `${normalizedName}${ext}`)
      if (existsSync(scriptPath)) {
        return true
      }
    }
  } catch {
    // package not found or error resolving
  }

  return false
}

// detect if running as tko (shorthand mode)
const isShorthand =
  process.argv[1]?.endsWith('tko') || process.argv[1]?.includes('/.bin/tko')

if (isShorthand) {
  // in shorthand mode, treat first arg as potential script command
  const firstArg = process.argv[2]
  const secondArg = process.argv[3]
  const builtInCommands = [
    'docs',
    'onboard',
    'run',
    'script',
    'env:setup',
    'sync',
    'changed',
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
    } else if (isLocalScript(firstArg) || isBuiltInScript(firstArg)) {
      // check if it's a local or built-in script (like update-deps, clean, etc.)
      // use "run" to avoid citty parsing issues with hyphens
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
    description: 'CLI tools for Takeout starter kit',
  },
  subCommands: {
    onboard: onboardCommand,
    docs: docsCommand,
    'env:setup': envSetupCommand,
    run: runCommand,
    script: scriptCommand,
    sync: syncCommand,
    changed: changedCommand,
  },
  run() {
    // only show available scripts when running tko with truly no arguments
    // check if process.argv has any arguments after the command name
    const hasArgs = process.argv.length > 2
    if (!hasArgs) {
      listAllScripts()
    }
  },
})

runMain(main)
