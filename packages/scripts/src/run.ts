#!/usr/bin/env bun

/**
 * @description Run multiple scripts in parallel or sequence
 */

import { spawn } from 'node:child_process'
import fs from 'node:fs'
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
// Handles --flag=value and --flag value styles, excluding flag values from commands
const args = process.argv.slice(2)
const ownFlags = ['--no-root', '--bun', '--watch', '--flags=last']
const runCommands: string[] = []
const forwardArgs: string[] = []

for (let i = 0; i < args.length; i++) {
  const arg = args[i]!

  if (arg.startsWith('--')) {
    // handle flags
    if (ownFlags.includes(arg) || arg.startsWith('--stdin=')) {
      continue
    }
    forwardArgs.push(arg)
    // if next arg exists and doesn't start with --, treat it as this flag's value
    const nextArg = args[i + 1]
    if (nextArg && !nextArg.startsWith('--')) {
      forwardArgs.push(nextArg)
      i++ // skip the value in next iteration
    }
  } else {
    // non-flag arg is a command name
    runCommands.push(arg)
  }
}

const noRoot = args.includes('--no-root')
const runBun = args.includes('--bun')
const watch = args.includes('--watch') // just attempts to restart a failed process up to MAX_RESTARTS times
// --flags=last forwards args only to last script, default forwards to all
const flagsLast = args.includes('--flags=last')

// parse --stdin=<script-name> to specify which script receives keyboard input
// if not specified, defaults to the last script in the list
const stdinArg = args.find((arg) => arg.startsWith('--stdin='))
const stdinScript = stdinArg
  ? stdinArg.replace('--stdin=', '')
  : (runCommands[runCommands.length - 1] ?? null)

// Get the list of scripts already being run by a parent process
const parentRunningScripts = process.env.BUN_RUN_SCRIPTS
  ? process.env.BUN_RUN_SCRIPTS.split(',')
  : []

interface ManagedProcess {
  proc: ReturnType<typeof spawn>
  name: string
  cwd: string
  prefixLabel: string
  extraArgs: string[]
  index: number
  shortcut: string
  restarting: boolean
  killing: boolean
}

const managedProcesses: ManagedProcess[] = []
const { addChildProcess, exit } = handleProcessExit()

// dynamic prefix using shortcut letter(s) — falls back to index before shortcuts are computed
function getPrefix(index: number): string {
  const managed = managedProcesses[index]
  if (!managed) return ''
  const color = colors[index % colors.length]
  const sc = managed.shortcut || String(index + 1)
  return `${color}${sc} ${managed.prefixLabel}${reset}`
}

if (runCommands.length === 0) {
  log.error('Please provide at least one script name to run')
  log.error('Example: bun run.ts watch lint test')
  exit(1)
}

async function readPackageJson(directoryPath: string) {
  try {
    const packageJsonPath = join(directoryPath, 'package.json')
    const content = await fs.promises.readFile(packageJsonPath, 'utf8')
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
    await fs.promises.access(join(path, 'package.json'))
    return true
  } catch {
    return false
  }
}

async function findPackageJsonDirs(basePath: string, maxDepth = 3): Promise<string[]> {
  if (maxDepth <= 0) return []

  try {
    const entries = await fs.promises.readdir(basePath, { withFileTypes: true })
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
  restarts = 0,
  extraArgs: string[] = [],
  managedIndex?: number
) => {
  const index = managedIndex ?? managedProcesses.length

  // capture stderr for error reporting
  let stderrBuffer = ''

  // --silent suppresses bun's "$ command" output
  const runArgs = ['run', '--silent', runBun ? '--bun' : '', name, ...extraArgs].filter(
    Boolean
  )

  const commandDisplay = `bun ${runArgs.join(' ')}`
  log.info(`${getPrefix(index)} Running: ${commandDisplay} (in ${resolve(cwd)})`)

  const allRunningScripts = [...parentRunningScripts, ...runCommands].join(',')

  // always pipe stdin - parent handles keyboard shortcuts and forwarding
  const proc = spawn('bun', runArgs, {
    stdio: ['pipe', 'pipe', 'pipe'],
    shell: false,
    env: {
      ...process.env,
      FORCE_COLOR: '3',
      BUN_RUN_PARENT_SCRIPT: name,
      BUN_RUN_SCRIPTS: allRunningScripts,
      TKO_SILENT: '1',
    } as any,
    cwd: resolve(cwd),
    detached: true,
  })

  log.info(`${getPrefix(index)} Process started with PID: ${proc.pid}`)

  const managed: ManagedProcess = {
    proc,
    name,
    cwd,
    prefixLabel,
    extraArgs,
    index,
    shortcut: '',
    restarting: false,
    killing: false,
  }

  if (managedIndex !== undefined) {
    managedProcesses[managedIndex] = managed
  } else {
    managedProcesses.push(managed)
  }

  addChildProcess(proc)

  proc.stdout!.on('data', (data) => {
    if (getIsExiting()) return
    const lines = data.toString().split('\n')
    for (const line of lines) {
      const stripped = line.replace(ansiPattern, '')
      if (stripped.startsWith('$ ')) continue
      if (line) log.output(`${getPrefix(index)} ${line}`)
    }
  })

  proc.stderr!.on('data', (data) => {
    const dataStr = data.toString()
    stderrBuffer += dataStr

    if (getIsExiting()) return
    const lines = dataStr.split('\n')
    for (const line of lines) {
      const stripped = line.replace(ansiPattern, '')
      if (stripped.startsWith('$ ')) continue
      if (line) log.error(`${getPrefix(index)} ${line}`)
    }
  })

  proc.on('error', (error) => {
    log.error(`${getPrefix(index)} Failed to start: ${error.message}`)
  })

  proc.on('close', (code) => {
    if (getIsExiting()) return

    // intentionally killed or restarting - skip error handling
    const currentManaged = managedProcesses[index]
    if (currentManaged?.restarting || currentManaged?.killing) return

    if (code && code !== 0) {
      log.error(`${getPrefix(index)} Process exited with code ${code}`)

      if (code === 1) {
        console.error('\x1b[31m❌ Run Failed\x1b[0m')
        console.error(
          `\x1b[31mProcess "${prefixLabel}" failed with exit code ${code}\x1b[0m`
        )

        if (watch && restarts < MAX_RESTARTS) {
          const newRestarts = restarts + 1
          console.info(
            `Restarting process ${name} (${newRestarts}/${MAX_RESTARTS} times)`
          )
          runScript(name, cwd, prefixLabel, newRestarts, extraArgs, index)
        } else {
          exit(1)
        }
      }
    }
  })

  return proc
}

// compute unique letter-based shortcuts from process labels
// splits on non-letters, takes first char of each word, extends until unique
function computeShortcuts() {
  const initials = managedProcesses.map((p) => {
    const words = p.prefixLabel
      .toLowerCase()
      .split(/[^a-z]+/)
      .filter(Boolean)
    return words.map((w) => w[0]).join('')
  })

  // start each shortcut at 1 letter, extend collisions
  const lengths = new Array(managedProcesses.length).fill(1) as number[]

  for (let round = 0; round < 5; round++) {
    const shortcuts = initials.map((init, i) => init.slice(0, lengths[i]) || init)

    let hasCollision = false
    const groups = new Map<string, number[]>()
    for (let i = 0; i < shortcuts.length; i++) {
      const key = shortcuts[i]!
      if (!groups.has(key)) groups.set(key, [])
      groups.get(key)!.push(i)
    }

    for (const [, indices] of groups) {
      if (indices.length <= 1) continue
      hasCollision = true
      for (const idx of indices) {
        lengths[idx]!++
      }
    }

    if (!hasCollision) {
      for (let i = 0; i < managedProcesses.length; i++) {
        managedProcesses[i]!.shortcut = shortcuts[i]!
      }
      return
    }
  }

  // fallback: use whatever we have, append index if still colliding
  for (let i = 0; i < managedProcesses.length; i++) {
    const sc = initials[i]!.slice(0, lengths[i]) || initials[i]!
    managedProcesses[i]!.shortcut = sc || String(i + 1)
  }
}

async function killProcessGroup(managed: ManagedProcess) {
  if (managed.proc.pid) {
    try {
      process.kill(-managed.proc.pid, 'SIGTERM')
    } catch {}
    await new Promise((r) => setTimeout(r, 200))
    try {
      process.kill(-managed.proc.pid, 'SIGKILL')
    } catch {}
  }
  await new Promise((r) => setTimeout(r, 100))
}

async function restartProcess(index: number) {
  const managed = managedProcesses[index]
  if (!managed) return

  const { name, cwd, prefixLabel, extraArgs } = managed

  managed.restarting = true
  managed.killing = false
  console.info(`\x1b[2m  restarting ${managed.shortcut} ${prefixLabel}...\x1b[0m`)

  await killProcessGroup(managed)
  await runScript(name, cwd, prefixLabel, 0, extraArgs, index)
  console.info(`${getPrefix(index)} \x1b[32m↻ restarted\x1b[0m`)
}

async function killProcess(index: number) {
  const managed = managedProcesses[index]
  if (!managed) return

  if (managed.killing) {
    console.info(
      `\x1b[2m  ${managed.shortcut} ${managed.prefixLabel} already stopped\x1b[0m`
    )
    return
  }

  managed.killing = true
  managed.restarting = false
  console.info(`\x1b[2m  killing ${managed.shortcut} ${managed.prefixLabel}...\x1b[0m`)

  await killProcessGroup(managed)
  console.info(`${getPrefix(index)} \x1b[31m■ stopped\x1b[0m`)
}

type InputMode = 'restart' | 'kill' | null

function setupKeyboardShortcuts() {
  if (!process.stdin.isTTY) return
  if (managedProcesses.length === 0) return

  process.stdin.setRawMode(true)
  process.stdin.resume()
  process.stdin.setEncoding('utf8')

  let mode: InputMode = null
  let buffer = ''
  let timer: ReturnType<typeof setTimeout> | null = null

  function clearTimer() {
    if (timer) {
      clearTimeout(timer)
      timer = null
    }
  }

  function dispatchMatch(m: InputMode, index: number) {
    if (m === 'restart') restartProcess(index)
    else if (m === 'kill') killProcess(index)
  }

  function finishMatch() {
    clearTimer()
    if (!buffer) return

    const currentMode = mode
    const match = managedProcesses.find((p) => p.shortcut === buffer)
    if (match) {
      dispatchMatch(currentMode, match.index)
    } else {
      console.info(`\x1b[2m  no match for "${buffer}"\x1b[0m`)
    }

    buffer = ''
    mode = null
  }

  function showProcessList(label: string) {
    const dim = '\x1b[2m'
    console.info()
    console.info(`${dim}  ${label} which process?${reset}`)
    for (const managed of managedProcesses) {
      const color = colors[managed.index % colors.length]
      const stopped = managed.killing ? `${dim} (stopped)` : ''
      console.info(
        `${dim}  ${reset}${color}${managed.shortcut}${reset}${dim} ${managed.prefixLabel}${stopped}${reset}`
      )
    }
    console.info()
  }

  function enterMode(newMode: InputMode, label: string) {
    clearTimer()
    mode = newMode
    buffer = ''
    showProcessList(label)
  }

  process.stdin.on('data', (key: string) => {
    // ctrl+c
    if (key === '\x03') {
      process.stdin.setRawMode(false)
      exit(0)
      return
    }

    // escape cancels
    if (key === '\x1b' && mode) {
      clearTimer()
      buffer = ''
      mode = null
      console.info('\x1b[2m  cancelled\x1b[0m')
      return
    }

    // ctrl+r - restart mode
    if (key === '\x12') {
      enterMode('restart', 'restart')
      return
    }

    // ctrl+k - kill mode
    if (key === '\x0b') {
      enterMode('kill', 'kill')
      return
    }

    // ctrl+l - clear screen
    if (key === '\x0c') {
      process.stdout.write('\x1b[2J\x1b[H')
      return
    }

    if (mode) {
      const lower = key.toLowerCase()
      if (/^[a-z]$/.test(lower)) {
        buffer += lower
        clearTimer()

        // exact match → dispatch immediately
        const exact = managedProcesses.find((p) => p.shortcut === buffer)
        if (exact) {
          const m = mode
          mode = null
          buffer = ''
          dispatchMatch(m, exact.index)
          return
        }

        // no shortcuts start with buffer → no match
        const hasPrefix = managedProcesses.some((p) => p.shortcut.startsWith(buffer))
        if (!hasPrefix) {
          console.info(`\x1b[2m  no match for "${buffer}"\x1b[0m`)
          buffer = ''
          mode = null
          return
        }

        // ambiguous — wait 500ms for more input
        timer = setTimeout(finishMatch, 500)
      } else {
        // non-letter cancels
        clearTimer()
        buffer = ''
        mode = null
        console.info('\x1b[2m  cancelled\x1b[0m')
      }
      return
    }

    // forward other input to the designated stdin process
    const stdinProc = managedProcesses.find((p) => p.name === stdinScript)
    if (stdinProc?.proc.stdin && !stdinProc.proc.stdin.destroyed) {
      stdinProc.proc.stdin.write(key)
    }
  })
}

function printShortcutHint() {
  if (!process.stdin.isTTY) return
  if (managedProcesses.length === 0) return

  const dim = '\x1b[2m'
  console.info(
    `${dim}  ctrl+r restart · ctrl+k kill · ctrl+l clear · ctrl+c exit${reset}`
  )
  console.info()
}

async function main() {
  checkNodeVersion().catch((err) => {
    log.error(err.message)
    exit(1)
  })

  try {
    if (runCommands.length > 0) {
      const lastScript = runCommands[runCommands.length - 1]

      // Root package.json scripts first, if not disabled
      if (!noRoot) {
        const filteredCommands = runCommands.filter(
          (name) => !parentRunningScripts.includes(name)
        )
        const scriptPromises = filteredCommands.map((name) => {
          // --flags=last: only forward args to last script
          const args = !flagsLast || name === lastScript ? forwardArgs : []
          return runScript(name, '.', name, 0, args)
        })

        await Promise.all(scriptPromises)
      }

      const workspaceScriptMap = await mapWorkspacesToScripts(runCommands)

      for (const [workspace, { scripts, packageName }] of workspaceScriptMap.entries()) {
        const filteredScripts = scripts.filter(
          (scriptName) => !parentRunningScripts.includes(scriptName)
        )
        const workspaceScriptPromises = filteredScripts.map((scriptName) => {
          // --flags=last: only forward args to last script
          const args = !flagsLast || scriptName === lastScript ? forwardArgs : []
          return runScript(scriptName, workspace, `${packageName} ${scriptName}`, 0, args)
        })

        await Promise.all(workspaceScriptPromises)
      }
    }

    if (managedProcesses.length === 0) {
      exit(0)
    } else {
      computeShortcuts()
      printShortcutHint()
      setupKeyboardShortcuts()
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
