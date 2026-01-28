#!/usr/bin/env bun

/**
 * @description Run multiple scripts in parallel or sequence
 */

import { spawn } from 'node:child_process'
import { promises as fs } from 'node:fs'
import { join, relative, resolve } from 'node:path'

import { handleProcessExit } from '@take-out/scripts/helpers/handleProcessExit'

import { getIsExiting } from './helpers/run'
import { checkNodeVersion } from './node-version-check'

// 256-color grays for subtle differentiation (232=darkest, 255=lightest)
const colors = [
  '\x1b[38;5;245m', // medium gray
  '\x1b[38;5;240m', // darker gray
  '\x1b[38;5;250m', // lighter gray
  '\x1b[38;5;243m', // medium-dark gray
  '\x1b[38;5;248m', // medium-light gray
  '\x1b[38;5;238m', // dark gray
  '\x1b[38;5;252m', // light gray
]

const reset = '\x1b[0m'

// eslint-disable-next-line no-control-regex
const ansiPattern = /\x1b\[[0-9;]*m/g

// Verbose logging flag - set to false to reduce logs
const verbose = false

// Helper function to conditionally log based on verbosity
const log = {
  info: (message: string) => {
    if (verbose) console.info(message)
  },
  error: (message: string) => console.error(message),
  output: (message: string) => console.info(message),
}

const MAX_RESTARTS = 3

// Separate command names from flags/arguments
const args = process.argv.slice(2)
const runCommands = args.filter((x) => !x.startsWith('--'))
const noRoot = args.includes('--no-root')
const runBun = args.includes('--bun')
const watch = args.includes('--watch') // just attempts to restart a failed process up to MAX_RESTARTS times

// parse --stdin=<script-name> to specify which script receives keyboard input
// if not specified, defaults to the last script in the list
const stdinArg = args.find((arg) => arg.startsWith('--stdin='))
const stdinScript = stdinArg
  ? stdinArg.replace('--stdin=', '')
  : (runCommands[runCommands.length - 1] ?? null)

// Collect additional flags and arguments to forward to sub-commands
const forwardArgs = args.filter(
  (arg) =>
    arg.startsWith('--') &&
    arg !== '--no-root' &&
    arg !== '--bun' &&
    arg !== '--watch' &&
    !arg.startsWith('--stdin=')
)

// Get the list of scripts already being run by a parent process
const parentRunningScripts = process.env.BUN_RUN_SCRIPTS
  ? process.env.BUN_RUN_SCRIPTS.split(',')
  : []

const processes: ReturnType<typeof spawn>[] = []
const { addChildProcess, exit } = handleProcessExit()

if (runCommands.length === 0) {
  log.error('Please provide at least one script name to run')
  log.error('Example: bun run.ts watch lint test')
  exit(1)
}

async function readPackageJson(directoryPath: string) {
  try {
    const packageJsonPath = join(directoryPath, 'package.json')
    const content = await fs.readFile(packageJsonPath, 'utf8')
    return JSON.parse(content)
  } catch (_) {
    return null
  }
}

async function getWorkspacePatterns(): Promise<string[]> {
  try {
    const packageJson = await readPackageJson('.')
    if (!packageJson || !packageJson.workspaces) return []

    return Array.isArray(packageJson.workspaces)
      ? packageJson.workspaces
      : packageJson.workspaces.packages || []
  } catch (_) {
    log.error('Error reading workspace patterns')
    return []
  }
}

async function hasPackageJson(path: string): Promise<boolean> {
  try {
    await fs.access(join(path, 'package.json'))
    return true
  } catch {
    return false
  }
}

async function findPackageJsonDirs(basePath: string, maxDepth = 3): Promise<string[]> {
  if (maxDepth <= 0) return []

  try {
    const entries = await fs.readdir(basePath, { withFileTypes: true })
    const results: string[] = []

    if (await hasPackageJson(basePath)) {
      results.push(basePath)
    }

    const subDirPromises = entries
      .filter(
        (entry) =>
          entry.isDirectory() &&
          !entry.name.startsWith('.') &&
          entry.name !== 'node_modules'
      )
      .map(async (dir) => {
        const path = join(basePath, dir.name)
        const subdirResults = await findPackageJsonDirs(path, maxDepth - 1)
        return subdirResults
      })

    const subdirResults = await Promise.all(subDirPromises)
    return [...results, ...subdirResults.flat()]
  } catch (error) {
    log.error(`Error scanning directory ${basePath}: ${error}`)
    return []
  }
}

async function findWorkspaceDirectories(): Promise<string[]> {
  const patterns = await getWorkspacePatterns()
  if (!patterns.length) return []

  const allPackageDirs = await findPackageJsonDirs('.')

  // normalize path separators to forward slashes for cross-platform support
  const normalizePath = (path: string): string => {
    let normalized = path.replace(/\\/g, '/')
    return normalized.startsWith('./') ? normalized.substring(2) : normalized
  }

  const workspaceDirs = allPackageDirs.filter((dir) => {
    if (dir === '.') return false

    const relativePath = relative('.', dir)
    return patterns.some((pattern) => {
      const normalizedPattern = normalizePath(pattern)
      const normalizedPath = normalizePath(relativePath)

      if (normalizedPattern.endsWith('/*')) {
        const prefix = normalizedPattern.slice(0, -1)
        return normalizedPath.startsWith(prefix)
      }
      return (
        normalizedPath === normalizedPattern ||
        normalizedPath.startsWith(normalizedPattern + '/')
      )
    })
  })

  return workspaceDirs
}

async function findAvailableScripts(
  directoryPath: string,
  scriptNames: string[]
): Promise<string[]> {
  const packageJson = await readPackageJson(directoryPath)

  if (!packageJson || !packageJson.scripts) {
    return []
  }

  return scriptNames.filter(
    (scriptName) => typeof packageJson.scripts?.[scriptName] === 'string'
  )
}

async function mapWorkspacesToScripts(
  scriptNames: string[]
): Promise<Map<string, { scripts: string[]; packageName: string }>> {
  const workspaceDirs = await findWorkspaceDirectories()
  const workspaceScriptMap = new Map<string, { scripts: string[]; packageName: string }>()

  for (const dir of workspaceDirs) {
    const availableScripts = await findAvailableScripts(dir, scriptNames)

    if (availableScripts.length > 0) {
      const packageJson = await readPackageJson(dir)
      const packageName = packageJson?.name || dir
      workspaceScriptMap.set(dir, {
        scripts: availableScripts,
        packageName,
      })
    }
  }

  return workspaceScriptMap
}

const runScript = async (
  name: string,
  cwd = '.',
  prefixLabel: string = name,
  restarts = 0
) => {
  const colorIndex = processes.length % colors.length
  const color = colors[colorIndex]

  // Capture stderr for error reporting
  let stderrBuffer = ''

  // Construct command with arguments to forward
  // --silent suppresses bun's "$ command" output
  const runArgs = ['run', '--silent', runBun ? '--bun' : '', name, ...forwardArgs].filter(
    Boolean
  )

  // Log the exact command being run
  const commandDisplay = `bun ${runArgs.join(' ')}`

  log.info(
    `${color}${prefixLabel}${reset} Running: ${commandDisplay} (in ${resolve(cwd)})`
  )

  // Combine parent running scripts with current scripts to prevent recursion
  const allRunningScripts = [...parentRunningScripts, ...runCommands].join(',')

  const shouldInheritStdin = name === stdinScript
  const proc = spawn('bun', runArgs, {
    stdio: [shouldInheritStdin ? 'inherit' : 'pipe', 'pipe', 'pipe'],
    shell: false,
    env: {
      ...process.env,
      FORCE_COLOR: '3',
      BUN_RUN_PARENT_SCRIPT: name,
      BUN_RUN_SCRIPTS: allRunningScripts,
      // propagate silent mode to child scripts
      TKO_SILENT: '1',
    } as any,
    cwd: resolve(cwd),
    detached: true,
  })

  log.info(`${color}${prefixLabel}${reset} Process started with PID: ${proc.pid}`)

  processes.push(proc)
  addChildProcess(proc)

  proc.stdout!.on('data', (data) => {
    if (getIsExiting()) return // prevent output during cleanup
    const lines = data.toString().split('\n')
    for (const line of lines) {
      // filter out bun's "$ command" echo lines in nested scripts
      const stripped = line.replace(ansiPattern, '')
      if (stripped.startsWith('$ ')) continue
      if (line) log.output(`${color}${prefixLabel}${reset} ${line}`)
    }
  })

  proc.stderr!.on('data', (data) => {
    const dataStr = data.toString()
    stderrBuffer += dataStr

    if (getIsExiting()) return // prevent output during cleanup
    const lines = dataStr.split('\n')
    for (const line of lines) {
      // filter out bun's "$ command" echo lines in nested scripts
      const stripped = line.replace(ansiPattern, '')
      if (stripped.startsWith('$ ')) continue
      if (line) log.error(`${color}${prefixLabel}${reset} ${line}`)
    }
  })

  proc.on('error', (error) => {
    log.error(`${color}${prefixLabel}${reset} Failed to start: ${error.message}`)
  })

  proc.on('close', (code) => {
    if (getIsExiting()) {
      // silently exit during cleanup
      return
    }

    if (code && code !== 0) {
      log.error(`${color}${prefixLabel}${reset} Process exited with code ${code}`)

      if (code === 1) {
        // Print a nicer error message with red header
        console.error(
          '\n\x1b[31m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\x1b[0m'
        )
        console.error('\x1b[31m❌ Run Failed\x1b[0m')
        console.error(
          '\x1b[31m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\x1b[0m'
        )
        console.error(
          `\x1b[31mProcess "${prefixLabel}" failed with exit code ${code}\x1b[0m`
        )


        if (watch && restarts < MAX_RESTARTS) {
          const newRestarts = restarts + 1
          console.info(
            `Restarting process ${name} (${newRestarts}/${MAX_RESTARTS} times)`
          )
          runScript(name, cwd, prefixLabel, newRestarts)
        } else {
          exit(1)
        }
      }
    }
  })

  return proc
}

async function main() {
  checkNodeVersion().catch((err) => {
    log.error(err.message)
    exit(1)
  })

  try {
    if (runCommands.length > 0) {
      // Root package.json scripts first, if not disabled
      if (!noRoot) {
        const scriptPromises = runCommands
          .filter((name) => !parentRunningScripts.includes(name))
          .map((name) => runScript(name))

        await Promise.all(scriptPromises)
      }

      const workspaceScriptMap = await mapWorkspacesToScripts(runCommands)

      for (const [workspace, { scripts, packageName }] of workspaceScriptMap.entries()) {
        const workspaceScriptPromises = scripts
          .filter((scriptName) => !parentRunningScripts.includes(scriptName))
          .map((scriptName) =>
            runScript(scriptName, workspace, `${packageName} ${scriptName}`)
          )

        await Promise.all(workspaceScriptPromises)
      }
    }

    if (processes.length === 0) {
      exit(0)
    }
  } catch (error) {
    log.error(`Error running scripts: ${error}`)
    exit(1)
  }
}

main().catch((error) => {
  log.error(`Error running scripts: ${error}`)
  exit(1)
})
