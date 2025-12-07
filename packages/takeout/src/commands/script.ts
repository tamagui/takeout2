/**
 * Enhanced Script command - hybrid script runner with filesystem discovery
 */

import {
  existsSync,
  readdirSync,
  statSync,
  readFileSync,
  writeFileSync,
  mkdirSync,
} from 'node:fs'
import { homedir } from 'node:os'
import { join, relative, dirname, basename, extname } from 'node:path'

import { defineCommand } from 'citty'
import pc from 'picocolors'

import { listAllScripts, listCategoryScripts } from '../utils/script-listing'
import {
  type FileToSync,
  compareFiles,
  getFileSize,
  syncFileWithConfirmation,
} from '../utils/sync'

// cache configuration
const CACHE_DIR = join(homedir(), '.takeout')
const CACHE_FILE = join(CACHE_DIR, 'script-cache.json')

interface ScriptMetadata {
  description?: string
  args?: string[]
  mtime?: number
}

interface ScriptCache {
  [path: string]: ScriptMetadata
}

// find scripts package root using import.meta.resolve
function findScriptsPackageRoot(): string | null {
  try {
    const resolved = import.meta.resolve('@take-out/scripts/package.json')
    const packageJsonPath = new URL(resolved).pathname
    const packageRoot = join(packageJsonPath, '..')
    const srcPath = join(packageRoot, 'src')

    if (existsSync(srcPath)) {
      return srcPath
    }
  } catch (err) {
    // scripts package not found, that's ok for hybrid mode
  }

  return null
}

// get local scripts directory
export function getLocalScriptsDir(): string {
  return join(process.cwd(), 'scripts')
}

// extract metadata from script file
function extractMetadata(filePath: string): ScriptMetadata {
  try {
    const content = readFileSync(filePath, 'utf-8')
    const lines = content.split('\n').slice(0, 20) // check first 20 lines

    const metadata: ScriptMetadata = {}

    for (const line of lines) {
      // look for @description comment
      const descMatch = line.match(/@description\s+(.+)/)
      if (descMatch && descMatch[1]) {
        metadata.description = descMatch[1].trim()
      }

      // look for @args comment
      const argsMatch = line.match(/@args\s+(.+)/)
      if (argsMatch && argsMatch[1]) {
        metadata.args = argsMatch[1].split(',').map((a) => a.trim())
      }
    }

    // add file modification time
    const stat = statSync(filePath)
    metadata.mtime = stat.mtimeMs

    return metadata
  } catch (err) {
    return {}
  }
}

// load or create cache
function loadCache(): ScriptCache {
  try {
    if (existsSync(CACHE_FILE)) {
      return JSON.parse(readFileSync(CACHE_FILE, 'utf-8'))
    }
  } catch (err) {
    // ignore cache errors
  }
  return {}
}

// save cache
function saveCache(cache: ScriptCache) {
  try {
    if (!existsSync(CACHE_DIR)) {
      mkdirSync(CACHE_DIR, { recursive: true })
    }
    writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2))
  } catch (err) {
    // ignore cache write errors
  }
}

// get metadata for a script (with caching)
export function getScriptMetadata(filePath: string): ScriptMetadata {
  const cache = loadCache()
  const stat = statSync(filePath)

  // check if cache is valid
  if (cache[filePath] && cache[filePath].mtime === stat.mtimeMs) {
    return cache[filePath]
  }

  // extract fresh metadata
  const metadata = extractMetadata(filePath)

  // update cache
  cache[filePath] = metadata
  saveCache(cache)

  return metadata
}

// discover scripts in a directory
export function discoverScripts(
  dir: string,
  baseDir: string = dir,
  depth: number = 0,
  maxDepth: number = 1
): Map<string, string> {
  const scripts = new Map<string, string>()

  if (!existsSync(dir)) {
    return scripts
  }

  try {
    const entries = readdirSync(dir)

    for (const entry of entries) {
      const fullPath = join(dir, entry)
      const stat = statSync(fullPath)

      if (stat.isDirectory()) {
        // skip helpers directories and limit depth to maxDepth
        if (entry === 'helpers' || depth >= maxDepth) {
          continue
        }
        // recursively discover in subdirectories
        const subScripts = discoverScripts(fullPath, baseDir, depth + 1, maxDepth)
        for (const [name, path] of subScripts) {
          scripts.set(name, path)
        }
      } else if (entry.endsWith('.ts') || entry.endsWith('.js')) {
        // create script name relative to base
        const relativePath = relative(baseDir, fullPath)
        const scriptName = relativePath.replace(/\.(ts|js)$/, '')
        scripts.set(scriptName, fullPath)
      }
    }
  } catch (err) {
    // ignore directory read errors
  }

  return scripts
}

// find a script by name (checks both built-in and local)
export function findScript(name: string): string | null {
  // normalize name: convert colons to slashes for consistency
  const normalizedName = name.replace(/:/g, '/')

  // 1. check local scripts first (they override built-ins)
  const localDir = getLocalScriptsDir()

  // try direct file path with normalized name
  for (const ext of ['.ts', '.js', '']) {
    const localPath = join(localDir, `${normalizedName}${ext}`)
    if (existsSync(localPath)) {
      return localPath
    }
  }

  // 2. check built-in scripts
  const builtInDir = findScriptsPackageRoot()
  if (builtInDir) {
    for (const ext of ['.ts', '.js', '']) {
      const builtInPath = join(builtInDir, `${normalizedName}${ext}`)
      if (existsSync(builtInPath)) {
        return builtInPath
      }
    }
  }

  return null
}

export {
  formatScriptList,
  listAllScripts,
  listCategoryScripts,
} from '../utils/script-listing'

// run a script
async function runScript(scriptPath: string, args: string[]): Promise<void> {
  console.info(pc.dim(`Running: ${relative(process.cwd(), scriptPath)}`))
  console.info()

  try {
    const { $ } = await import('bun')
    await $`bun ${scriptPath} ${args}`
  } catch (err) {
    console.error(pc.red(`✗ Error running script: ${err}`))
    process.exit(1)
  }
}

// new command for creating scripts
const newCommand = defineCommand({
  meta: {
    name: 'new',
    description: 'Create a new script from template',
  },
  args: {
    path: {
      type: 'positional',
      description: 'Path for the new script (e.g., ci/test)',
      required: true,
    },
  },
  async run({ args }) {
    const scriptPath = args.path
    const localDir = getLocalScriptsDir()

    // determine full path
    const fullPath = join(localDir, `${scriptPath}.ts`)
    const dir = dirname(fullPath)

    // create directory if needed
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true })
    }

    // check if file exists
    if (existsSync(fullPath)) {
      console.error(
        pc.red(`✗ Script already exists: ${relative(process.cwd(), fullPath)}`)
      )
      process.exit(1)
    }

    // create template
    const template = `#!/usr/bin/env bun

/**
 * @description TODO: Add description
 * @args --verbose, --dry-run
 */

import { parseArgs } from 'node:util'

const { values } = parseArgs({
  args: process.argv.slice(2),
  options: {
    verbose: {
      type: 'boolean',
      short: 'v',
    },
    'dry-run': {
      type: 'boolean',
    },
  },
})

async function main() {
  console.info('Running ${basename(scriptPath)}...')

  if (values.verbose) {
    console.info('Verbose mode enabled')
  }

  if (values['dry-run']) {
    console.info('Dry run mode - no changes will be made')
  }

  // TODO: Implement your script logic here
}

main().catch(console.error)
`

    writeFileSync(fullPath, template)
    console.info(pc.green(`✓ Created new script: ${relative(process.cwd(), fullPath)}`))
    console.info()
    console.info(pc.dim(`Edit the script and update the TODO sections`))
  },
})

// get all script files recursively
function getAllScriptFiles(dir: string, baseDir: string = dir): string[] {
  const files: string[] = []

  if (!existsSync(dir)) {
    return files
  }

  try {
    const entries = readdirSync(dir)

    for (const entry of entries) {
      const fullPath = join(dir, entry)
      const stat = statSync(fullPath)

      if (stat.isDirectory()) {
        files.push(...getAllScriptFiles(fullPath, baseDir))
      } else if (
        entry.endsWith('.ts') ||
        entry.endsWith('.js') ||
        entry.endsWith('.cjs')
      ) {
        files.push(relative(baseDir, fullPath))
      }
    }
  } catch (err) {
    // ignore directory read errors
  }

  return files
}

// eject command to copy built-in scripts to local directory
const ejectCommand = defineCommand({
  meta: {
    name: 'eject',
    description: 'Eject built-in scripts into your project',
  },
  args: {
    yes: {
      type: 'boolean',
      description: 'Skip confirmations and eject all files',
      default: false,
    },
  },
  async run({ args }) {
    const cwd = process.cwd()
    const targetScriptsDir = join(cwd, 'scripts')
    const sourceScriptsDir = findScriptsPackageRoot()

    console.info()
    console.info(pc.bold(pc.cyan('⚙️  Eject Scripts')))
    console.info()

    if (!sourceScriptsDir) {
      console.error(
        pc.red(
          '✗ Built-in scripts package (@take-out/scripts) not found or not installed'
        )
      )
      console.info()
      console.info(pc.dim('Install with: bun add -d @take-out/scripts'))
      process.exit(1)
    }

    console.info(pc.dim(`Source: ${sourceScriptsDir}`))
    console.info(pc.dim(`Target: ${targetScriptsDir}`))
    console.info()

    // ensure target scripts directory exists
    if (!existsSync(targetScriptsDir)) {
      console.info(pc.yellow('⚠ Target scripts directory does not exist, will create it'))
      mkdirSync(targetScriptsDir, { recursive: true })
    }

    // get all script files from source (including subdirectories)
    const sourceFiles = getAllScriptFiles(sourceScriptsDir)

    if (sourceFiles.length === 0) {
      console.info(pc.yellow('No script files found in built-in scripts package'))
      return
    }

    // analyze all files
    const filesToSync: FileToSync[] = []
    const stats = {
      new: 0,
      modified: 0,
      identical: 0,
    }

    for (const file of sourceFiles) {
      const sourcePath = join(sourceScriptsDir, file)
      const targetPath = join(targetScriptsDir, file)
      const status = compareFiles(sourcePath, targetPath)

      stats[status]++

      filesToSync.push({
        name: file,
        sourcePath,
        targetPath,
        status,
        sourceSize: getFileSize(sourcePath),
        targetSize: getFileSize(targetPath),
      })
    }

    console.info(pc.bold('Summary:'))
    console.info(`  ${pc.green(`${stats.new} new`)}`)
    console.info(`  ${pc.yellow(`${stats.modified} modified`)}`)
    console.info(`  ${pc.dim(`${stats.identical} identical`)}`)
    console.info()

    if (stats.new === 0 && stats.modified === 0) {
      console.info(pc.green('✓ All scripts are already up to date!'))
      return
    }

    // sort files: new first, then modified, then identical
    const sortOrder = { new: 0, modified: 1, identical: 2 }
    filesToSync.sort((a, b) => sortOrder[a.status] - sortOrder[b.status])

    // sync files
    let syncedCount = 0

    for (const file of filesToSync) {
      if (args.yes && file.status !== 'identical') {
        // auto-sync without confirmation
        const targetDir = dirname(file.targetPath)
        if (!existsSync(targetDir)) {
          mkdirSync(targetDir, { recursive: true })
        }
        const content = readFileSync(file.sourcePath)
        writeFileSync(file.targetPath, content)
        console.info(pc.green(`  ✓ ${file.name}`))
        syncedCount++
      } else {
        const wasSynced = await syncFileWithConfirmation(file)
        if (wasSynced) {
          syncedCount++
        }
      }
    }

    console.info()
    console.info(pc.bold(pc.green(`✓ Complete: ${syncedCount} file(s) ejected`)))
    console.info()
  },
})

// run subcommand for backwards compatibility
const runSubCommand = defineCommand({
  meta: {
    name: 'run',
    description: 'Run a script (for backwards compatibility)',
  },
  args: {
    name: {
      type: 'positional',
      description: 'Script name',
      required: true,
    },
  },
  async run({ args, rawArgs }) {
    // Find and run the script
    const scriptPath = findScript(args.name)

    if (!scriptPath) {
      console.error(pc.red(`✗ Script not found: ${args.name}`))
      console.info()
      console.info(pc.dim(`Run 'tko script' to see available scripts`))
      process.exit(1)
    }

    // Extract args after the script name
    const scriptArgs = rawArgs.slice(rawArgs.indexOf(args.name) + 1)

    await runScript(scriptPath, scriptArgs)
  },
})

// main script command (handles both list and run)
export const scriptCommand = defineCommand({
  meta: {
    name: 'script',
    description: 'Hybrid script runner with filesystem discovery',
  },
  args: {
    name: {
      type: 'positional',
      description: 'Script name or category to run/list',
      required: false,
    },
  },
  subCommands: {
    new: newCommand,
    run: runSubCommand,
    eject: ejectCommand,
  },
  async run({ args, rawArgs }) {
    // citty doesn't handle args with hyphens well, so use rawArgs directly
    // rawArgs[0] is 'script', rawArgs[1] is the actual script name
    const scriptName = args.name || rawArgs[1]

    // if no name provided, list all available scripts
    if (!scriptName) {
      listAllScripts(false) // don't show built-in commands in script listing
      return
    }

    // check if this is a category listing (e.g., "takeout script ci")
    if (listCategoryScripts(scriptName)) {
      return
    }

    // find and run the script
    const scriptPath = findScript(scriptName)

    if (!scriptPath) {
      console.error(pc.red(`✗ Script not found: ${scriptName}`))
      console.info()
      console.info(pc.dim(`Run 'tko script' to see available scripts`))
      process.exit(1)
    }

    // extract args after the script name
    const scriptArgs = rawArgs.slice(rawArgs.indexOf(scriptName) + 1)

    await runScript(scriptPath, scriptArgs)
  },
})

// shorthand command that skips "script" subcommand
export function createShorthandCommand(name: string) {
  return defineCommand({
    meta: {
      name,
      description: 'Run script directly',
    },
    args: {
      args: {
        type: 'positional',
        description: 'Script and arguments',
        required: false,
      },
    },
    async run({ rawArgs }) {
      // if no args provided, list scripts in this category
      const scriptName = rawArgs.length > 0 ? `${name}/${rawArgs[0]}` : name
      const scriptArgs =
        rawArgs.length > 0
          ? ['script', scriptName, ...rawArgs.slice(1)]
          : ['script', name]

      // delegate to script command
      const { run } = scriptCommand
      if (run) {
        await run({
          args: {
            name: scriptName,
            _: rawArgs.slice(1),
          } as any,
          rawArgs: scriptArgs,
          cmd: scriptCommand,
        } as any)
      }
    },
  })
}
