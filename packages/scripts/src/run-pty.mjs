#!/usr/bin/env node

import fs from 'node:fs'
import { join, relative, resolve } from 'node:path'

import pty from '@lydell/node-pty'

const colors = [
  '\x1b[38;5;245m',
  '\x1b[38;5;240m',
  '\x1b[38;5;243m',
  '\x1b[38;5;248m',
  '\x1b[38;5;238m',
  '\x1b[38;5;252m',
]
const reset = '\x1b[0m'
const dim = '\x1b[2m'
const bold = '\x1b[1m'
const inverse = '\x1b[7m'

const args = process.argv.slice(2)
const ownFlags = ['--no-root', '--bun', '--watch', '--flags=last']
const runCommands = []
const forwardArgs = []

for (let i = 0; i < args.length; i++) {
  const arg = args[i]
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
const flagsLast = args.includes('--flags=last')

const processes = []
let dashboardMode = false
let selectedIndex = 0

function getPrefix(index) {
  const p = processes[index]
  if (!p) return ''
  const color = colors[index % colors.length]
  return `${color}${p.shortcut} ${p.label}${reset}`
}

if (runCommands.length === 0) {
  console.error('Usage: run-pty <script1> [script2] ...')
  process.exit(1)
}

async function readPackageJson(dir) {
  try {
    return JSON.parse(await fs.promises.readFile(join(dir, 'package.json'), 'utf8'))
  } catch {
    return null
  }
}

async function getWorkspacePatterns() {
  const pkg = await readPackageJson('.')
  if (!pkg?.workspaces) return []
  return Array.isArray(pkg.workspaces) ? pkg.workspaces : pkg.workspaces.packages || []
}

async function findPackageJsonDirs(base, depth = 3) {
  if (depth <= 0) return []
  const results = []
  try {
    if (
      await fs.promises
        .access(join(base, 'package.json'))
        .then(() => true)
        .catch(() => false)
    ) {
      results.push(base)
    }
    const entries = await fs.promises.readdir(base, { withFileTypes: true })
    for (const e of entries) {
      if (e.isDirectory() && !e.name.startsWith('.') && e.name !== 'node_modules') {
        results.push(...(await findPackageJsonDirs(join(base, e.name), depth - 1)))
      }
    }
  } catch {}
  return results
}

async function findWorkspaceScripts(scripts) {
  const patterns = await getWorkspacePatterns()
  if (!patterns.length) return new Map()

  const dirs = await findPackageJsonDirs('.')
  const result = new Map()

  for (const dir of dirs) {
    if (dir === '.') continue
    const rel = relative('.', dir).replace(/\\/g, '/')
    const matches = patterns.some((p) => {
      const np = p.replace(/\\/g, '/').replace(/^\.\//, '')
      return np.endsWith('/*')
        ? rel.startsWith(np.slice(0, -1))
        : rel === np || rel.startsWith(np + '/')
    })
    if (!matches) continue

    const pkg = await readPackageJson(dir)
    if (!pkg?.scripts) continue
    const available = scripts.filter((s) => typeof pkg.scripts[s] === 'string')
    if (available.length) result.set(dir, { scripts: available, name: pkg.name || dir })
  }
  return result
}

function spawnScript(name, cwd, label, extraArgs, index) {
  const runArgs = ['run', '--silent', runBun ? '--bun' : '', name, ...extraArgs].filter(
    Boolean
  )

  const terminal = pty.spawn('bun', runArgs, {
    cwd: resolve(cwd),
    cols: process.stdout.columns || 80,
    rows: process.stdout.rows || 24,
    env: { ...process.env, FORCE_COLOR: '3' },
  })

  const idx = index ?? processes.length
  const managed = {
    terminal,
    name,
    cwd,
    label,
    extraArgs,
    index: idx,
    shortcut: '',
    killed: false,
  }

  if (index !== undefined) {
    processes[index] = managed
  } else {
    processes.push(managed)
  }

  terminal.onData((data) => {
    if (dashboardMode) return
    const lines = data.split('\n')
    for (const line of lines) {
      if (line && line !== '\r') {
        process.stdout.write(`${getPrefix(idx)} ${line}\n`)
      }
    }
  })

  terminal.onExit(({ exitCode }) => {
    if (managed.killed) return
    if (exitCode !== 0) {
      process.stdout.write(`${getPrefix(idx)} exited with code ${exitCode}\n`)
    }
  })

  return managed
}

function computeShortcuts() {
  const initials = processes.map((p) =>
    p.label
      .toLowerCase()
      .split(/[^a-z]+/)
      .filter(Boolean)
      .map((w) => w[0])
      .join('')
  )
  const lengths = new Array(processes.length).fill(1)

  for (let round = 0; round < 5; round++) {
    const shortcuts = initials.map((init, i) => init.slice(0, lengths[i]) || init)
    const groups = new Map()
    shortcuts.forEach((s, i) => groups.set(s, [...(groups.get(s) || []), i]))

    let collision = false
    for (const indices of groups.values()) {
      if (indices.length > 1) {
        collision = true
        indices.forEach((i) => lengths[i]++)
      }
    }
    if (!collision) {
      processes.forEach((p, i) => (p.shortcut = shortcuts[i]))
      return
    }
  }
  processes.forEach(
    (p, i) => (p.shortcut = initials[i]?.slice(0, lengths[i]) || String(i + 1))
  )
}

function renderDashboard() {
  process.stdout.write('\x1b[2J\x1b[H')
  process.stdout.write(
    `${bold}Dashboard${reset} ${dim}(↑↓ navigate, r restart, k kill, esc back)${reset}\n\n`
  )

  for (let i = 0; i < processes.length; i++) {
    const p = processes[i]
    const prefix = i === selectedIndex ? `${inverse} > ${reset}` : '   '
    const status = p.killed
      ? `${dim}(killed)${reset}`
      : p.terminal.pid
        ? `${dim}(pid ${p.terminal.pid})${reset}`
        : ''
    process.stdout.write(`${prefix} ${getPrefix(i)} ${status}\n`)
  }
  process.stdout.write(`\n${dim}ctrl+c to exit${reset}\n`)
}

function exitDashboard() {
  dashboardMode = false
  process.stdout.write('\x1b[2J\x1b[H')
  process.stdout.write(
    `${dim}  running ${processes.length} processes (ctrl+z dashboard, ctrl+c exit)${reset}\n\n`
  )
}

function handleInput(data) {
  const str = data.toString()

  if (str === '\x03') {
    cleanup()
    return
  }

  if (str === '\x1a') {
    if (dashboardMode) {
      exitDashboard()
    } else {
      dashboardMode = true
      renderDashboard()
    }
    return
  }

  if (dashboardMode) {
    if (str === '\x1b[A') {
      selectedIndex = Math.max(0, selectedIndex - 1)
      renderDashboard()
    } else if (str === '\x1b[B') {
      selectedIndex = Math.min(processes.length - 1, selectedIndex + 1)
      renderDashboard()
    } else if (str === 'r' || str === 'R') {
      const p = processes[selectedIndex]
      if (p) {
        p.killed = true
        p.terminal.kill()
        setTimeout(() => {
          spawnScript(p.name, p.cwd, p.label, p.extraArgs, p.index)
          exitDashboard()
        }, 100)
      }
    } else if (str === 'k' || str === 'K') {
      const p = processes[selectedIndex]
      if (p && !p.killed) {
        p.killed = true
        p.terminal.kill()
        renderDashboard()
      }
    } else if (str === '\x1b' || str === '\x1b\x1b') {
      exitDashboard()
    }
  }
}

function cleanup() {
  process.stdout.write('\n')
  for (const p of processes) {
    if (!p.killed) {
      p.killed = true
      p.terminal.kill()
    }
  }
  process.exit(0)
}

async function main() {
  const lastScript = runCommands[runCommands.length - 1]

  if (!noRoot) {
    const pkg = await readPackageJson('.')
    if (pkg?.scripts) {
      for (const name of runCommands) {
        if (typeof pkg.scripts[name] === 'string') {
          const scriptArgs = !flagsLast || name === lastScript ? forwardArgs : []
          spawnScript(name, '.', name, scriptArgs)
        }
      }
    }
  }

  const wsScripts = await findWorkspaceScripts(runCommands)
  for (const [dir, { scripts, name }] of wsScripts) {
    for (const script of scripts) {
      const scriptArgs = !flagsLast || script === lastScript ? forwardArgs : []
      spawnScript(script, dir, `${name} ${script}`, scriptArgs)
    }
  }

  if (processes.length === 0) {
    console.error('No scripts found')
    process.exit(1)
  }

  computeShortcuts()
  process.stdout.write(
    `${dim}  running ${processes.length} processes (ctrl+z dashboard, ctrl+c exit)${reset}\n\n`
  )

  if (process.stdin.isTTY) {
    process.stdin.setRawMode(true)
    process.stdin.resume()
    process.stdin.on('data', handleInput)
  }

  process.stdout.on('resize', () => {
    const cols = process.stdout.columns || 80
    const rows = process.stdout.rows || 24
    for (const p of processes) {
      if (!p.killed) {
        p.terminal.resize(cols, rows)
      }
    }
  })

  process.on('SIGINT', cleanup)
  process.on('SIGTERM', cleanup)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
