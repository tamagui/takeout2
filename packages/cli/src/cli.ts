#!/usr/bin/env bun

/**
 * Takeout CLI
 * Interactive tools for Takeout starter kit setup and management
 */

import { spawnSync } from 'node:child_process'
import { existsSync, statSync } from 'node:fs'
import { join } from 'node:path'

import { defineCommand, runMain } from 'citty'

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

// find a local script in ./scripts/, returns path or null
function findLocalScript(name: string): string | null {
  const scriptsDir = join(process.cwd(), 'scripts')
  const normalizedName = name.replace(/:/g, '/')

  for (const ext of ['.ts', '.js', '']) {
    const scriptPath = join(scriptsDir, `${normalizedName}${ext}`)
    if (existsSync(scriptPath)) {
      return scriptPath
    }
  }

  return null
}

function isLocalScript(name: string): boolean {
  return findLocalScript(name) !== null
}

// find a built-in script in @take-out/scripts, returns path or null
function findBuiltInScript(name: string): string | null {
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
        return scriptPath
      }
    }
  } catch {
    // package not found or error resolving
  }

  return null
}

function isBuiltInScript(name: string): boolean {
  return findBuiltInScript(name) !== null
}

// always enable shorthand mode — both tko and takeout resolve to this file
const isShorthand = true

if (isShorthand) {
  // in shorthand mode, treat first arg as potential script command
  const firstArg = process.argv[2]
  const secondArg = process.argv[3]
  const builtInCommands = [
    'docs',
    'onboard',
    'run',
    'run-all',
    'script',
    'skills',
    'env:setup',
    'sync',
    'changed',
    '--help',
    '-h',
    '--version',
    '-v',
  ]

  if (firstArg && !builtInCommands.includes(firstArg)) {
    // resolve the script name for category/script patterns
    let resolvedScriptName: string | undefined

    // check if it's a script category or has a slash (category/script format)
    // Do a lazy check only on the specific arg, not scanning all directories
    if (isScriptCategory(firstArg)) {
      // If there's a second arg, treat it as a script within the category
      // e.g., "tko aws health" becomes "tko run aws/health"
      if (secondArg && !secondArg.startsWith('-')) {
        resolvedScriptName = `${firstArg}/${secondArg}`
        // Replace the two args with the combined path
        process.argv.splice(2, 2, resolvedScriptName)
      }
      // inject "run" into args to use the run command directly
      process.argv.splice(2, 0, 'run')
    } else if (firstArg?.includes('/')) {
      resolvedScriptName = firstArg
      // inject "run" into args to use the run command directly
      process.argv.splice(2, 0, 'run')
    } else if (isLocalScript(firstArg) || isBuiltInScript(firstArg)) {
      resolvedScriptName = firstArg
      // check if it's a local or built-in script (like update-deps, clean, etc.)
      // use "run" to avoid citty parsing issues with hyphens
      process.argv.splice(2, 0, 'run')
    } else {
      // assume it's a script command, inject "script" into args
      process.argv.splice(2, 0, 'script')
    }

    // bypass citty for --help on scripts so the script handles it itself
    const hasHelp = process.argv.includes('--help') || process.argv.includes('-h')
    if (resolvedScriptName && hasHelp) {
      const scriptPath =
        findLocalScript(resolvedScriptName) || findBuiltInScript(resolvedScriptName)
      if (scriptPath) {
        const flagArgs = process.argv.slice(3).filter((a) => a !== resolvedScriptName)
        const result = spawnSync('bun', [scriptPath, ...flagArgs], {
          stdio: 'inherit',
          shell: false,
        })
        process.exit(result.status || 0)
      }
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
    onboard: () => import('./commands/onboard').then((m) => m.onboardCommand),
    docs: () => import('./commands/docs').then((m) => m.docsCommand),
    'env:setup': () => import('./commands/env-setup').then((m) => m.envSetupCommand),
    run: () => import('./commands/run').then((m) => m.runCommand),
    'run-all': () => import('./commands/run-all').then((m) => m.runAllCommand),
    script: () => import('./commands/script').then((m) => m.scriptCommand),
    skills: () => import('./commands/skills').then((m) => m.skillsCommand),
    sync: () => import('./commands/sync').then((m) => m.syncCommand),
    changed: () => import('./commands/changed').then((m) => m.changedCommand),
  },
  async run() {
    const hasArgs = process.argv.length > 2
    if (!hasArgs) {
      const { listAllScripts } = await import('./utils/script-listing')
      await listAllScripts()
    }
  },
})

runMain(main)
