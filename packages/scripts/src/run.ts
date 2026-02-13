#!/usr/bin/env bun

/**
 * @description Run multiple scripts in parallel
 */

import { spawn } from 'node:child_process'
import fs from 'node:fs'
import { join, relative, resolve } from 'node:path'

import { handleProcessExit } from '@take-out/scripts/helpers/handleProcessExit'

import { getIsExiting } from './helpers/run'
import { checkNodeVersion } from './node-version-check'

const colors = [
  '\x1b[38;5;245m',
  '\x1b[38;5;240m',
  '\x1b[38;5;250m',
  '\x1b[38;5;243m',
  '\x1b[38;5;248m',
  '\x1b[38;5;238m',
  '\x1b[38;5;252m',
]

const reset = '\x1b[0m'

// eslint-disable-next-line no-control-regex
const ansiPattern = /\x1b\[[0-9;]*m/g

const args = process.argv.slice(2)
const ownFlags = ['--no-root', '--bun', '--watch', '--flags=last']
const runCommands: string[] = []
const forwardArgs: string[] = []

for (let i = 0; i < args.length; i++) {
  const arg = args[i]!

  if (arg.startsWith('--')) {
    if (ownFlags.includes(arg)) continue
    forwardArgs.push(arg)
    const nextArg = args[i + 1]
    if (nextArg && !nextArg.startsWith('--')) {
      forwardArgs.push(nextArg)
      i++
    }
  } else {
    runCommands.push(arg)
  }
}

const noRoot = args.includes('--no-root')
const runBun = args.includes('--bun')
const watch = args.includes('--watch')
const flagsLast = args.includes('--flags=last')

const MAX_RESTARTS = 3

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
}

const managedProcesses: ManagedProcess[] = []
const { addChildProcess, exit } = handleProcessExit()

function getPrefix(index: number): string {
  const managed = managedProcesses[index]
  if (!managed) return ''
  const color = colors[index % colors.length]
  const sc = managed.shortcut || String(index + 1)
  return `${color}${sc} ${managed.prefixLabel}${reset}`
}

if (runCommands.length === 0) {
  console.error('Please provide at least one script name to run')
  exit(1)
}

async function readPackageJson(directoryPath: string) {
  try {
    const packageJsonPath = join(directoryPath, 'package.json')
    const content = await fs.promises.readFile(packageJsonPath, 'utf8')
    return JSON.parse(content)
  } catch {
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
  } catch {
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
        return findPackageJsonDirs(path, maxDepth - 1)
      })

    const subdirResults = await Promise.all(subDirPromises)
    return [...results, ...subdirResults.flat()]
  } catch {
    return []
  }
}

async function findWorkspaceDirectories(): Promise<string[]> {
  const patterns = await getWorkspacePatterns()
  if (!patterns.length) return []

  const allPackageDirs = await findPackageJsonDirs('.')

  const normalizePath = (path: string): string => {
    const normalized = path.replace(/\\/g, '/')
    return normalized.startsWith('./') ? normalized.substring(2) : normalized
  }

  return allPackageDirs.filter((dir) => {
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

  const runArgs = ['run', '--silent', runBun ? '--bun' : '', name, ...extraArgs].filter(
    Boolean
  )

  const allRunningScripts = [...parentRunningScripts, ...runCommands].join(',')

  const proc = spawn('bun', runArgs, {
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: false,
    env: {
      ...process.env,
      FORCE_COLOR: '3',
      BUN_RUN_PARENT_SCRIPT: name,
      BUN_RUN_SCRIPTS: allRunningScripts,
      TKO_SILENT: '1',
    } as any,
    cwd: resolve(cwd),
  })

  const managed: ManagedProcess = {
    proc,
    name,
    cwd,
    prefixLabel,
    extraArgs,
    index,
    shortcut: '',
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
      if (line) console.info(`${getPrefix(index)} ${line}`)
    }
  })

  proc.stderr!.on('data', (data) => {
    if (getIsExiting()) return
    const lines = data.toString().split('\n')
    for (const line of lines) {
      const stripped = line.replace(ansiPattern, '')
      if (stripped.startsWith('$ ')) continue
      if (line) console.error(`${getPrefix(index)} ${line}`)
    }
  })

  proc.on('error', (error) => {
    console.error(`${getPrefix(index)} Failed to start: ${error.message}`)
  })

  proc.on('close', (code) => {
    if (getIsExiting()) return

    if (code && code !== 0) {
      console.error(`${getPrefix(index)} Process exited with code ${code}`)

      if (watch && restarts < MAX_RESTARTS) {
        const newRestarts = restarts + 1
        console.info(`Restarting process ${name} (${newRestarts}/${MAX_RESTARTS} times)`)
        runScript(name, cwd, prefixLabel, newRestarts, extraArgs, index)
      } else {
        exit(1)
      }
    }
  })

  return proc
}

function computeShortcuts() {
  const initials = managedProcesses.map((p) => {
    const words = p.prefixLabel
      .toLowerCase()
      .split(/[^a-z]+/)
      .filter(Boolean)
    return words.map((w) => w[0]).join('')
  })

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

  for (let i = 0; i < managedProcesses.length; i++) {
    const sc = initials[i]!.slice(0, lengths[i]) || initials[i]!
    managedProcesses[i]!.shortcut = sc || String(i + 1)
  }
}

async function main() {
  checkNodeVersion().catch((err) => {
    console.error(err.message)
    exit(1)
  })

  try {
    if (runCommands.length > 0) {
      const lastScript = runCommands[runCommands.length - 1]

      if (!noRoot) {
        const filteredCommands = runCommands.filter(
          (name) => !parentRunningScripts.includes(name)
        )
        const scriptPromises = filteredCommands.map((name) => {
          const scriptArgs = !flagsLast || name === lastScript ? forwardArgs : []
          return runScript(name, '.', name, 0, scriptArgs)
        })

        await Promise.all(scriptPromises)
      }

      const workspaceScriptMap = await mapWorkspacesToScripts(runCommands)

      for (const [workspace, { scripts, packageName }] of workspaceScriptMap.entries()) {
        const filteredScripts = scripts.filter(
          (scriptName) => !parentRunningScripts.includes(scriptName)
        )
        const workspaceScriptPromises = filteredScripts.map((scriptName) => {
          const scriptArgs = !flagsLast || scriptName === lastScript ? forwardArgs : []
          return runScript(
            scriptName,
            workspace,
            `${packageName} ${scriptName}`,
            0,
            scriptArgs
          )
        })

        await Promise.all(workspaceScriptPromises)
      }
    }

    if (managedProcesses.length === 0) {
      exit(0)
    } else {
      computeShortcuts()
    }
  } catch (error) {
    console.error(`Error running scripts: ${error}`)
    exit(1)
  }
}

main().catch((error) => {
  console.error(`Error running scripts: ${error}`)
  exit(1)
})
