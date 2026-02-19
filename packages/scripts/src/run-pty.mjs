#!/usr/bin/env node

import fs from 'node:fs'
import { join, relative, resolve } from 'node:path'

import pty from '@lydell/node-pty'

const colors = [
  '\x1b[38;5;81m',
  '\x1b[38;5;209m',
  '\x1b[38;5;156m',
  '\x1b[38;5;183m',
  '\x1b[38;5;222m',
  '\x1b[38;5;117m',
]
const reset = '\x1b[0m'
const dim = '\x1b[2m'

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
let focusedIndex = -1 // -1 = interleaved/dashboard

function getPrefix(index) {
  const p = processes[index]
  if (!p) return ''
  const color = colors[index % colors.length]
  return `${color}${p.shortcut}${reset}`
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

  if (index !== undefined) processes[index] = managed
  else processes.push(managed)

  terminal.onData((data) => {
    if (focusedIndex === -1) {
      // interleaved - prefix each line, skip bun's $ command echo
      const lines = data.split(/\r?\n/)
      for (const line of lines) {
        if (!line) continue
        // eslint-disable-next-line no-control-regex
        const stripped = line.replace(/\x1b\[[0-9;]*m/g, '')
        if (stripped.startsWith('$ ')) continue
        process.stdout.write(`${getPrefix(idx)} ${line}\n`)
      }
    } else if (focusedIndex === idx) {
      // focused - raw output
      process.stdout.write(data)
    }
  })

  terminal.onExit(({ exitCode }) => {
    if (managed.killed) return
    if (focusedIndex === idx) {
      focusedIndex = -1
      showDashboard()
    }
    if (exitCode !== 0) {
      console.error(`${getPrefix(idx)} exited ${exitCode}`)
    }
  })

  return managed
}

function computeShortcuts() {
  // use last word of label
  for (let i = 0; i < processes.length; i++) {
    const p = processes[i]
    const words = p.label
      .toLowerCase()
      .split(/[^a-z]+/)
      .filter(Boolean)
    const lastWord = words[words.length - 1] || words[0] || String(i)

    // find unique shortcut
    let shortcut = lastWord[0]
    let len = 1
    while (
      processes.slice(0, i).some((q) => q.shortcut === shortcut) &&
      len < lastWord.length
    ) {
      len++
      shortcut = lastWord.slice(0, len)
    }
    p.shortcut = shortcut
  }
}

function showDashboard() {
  const tabs = processes
    .map((p, i) => {
      const color = colors[i % colors.length]
      return `${color}[${p.shortcut}]${reset} ${p.label.split(' ').pop()}${p.killed ? dim + ' ✗' + reset : ''}`
    })
    .join('  ')
  console.log(`\n${tabs}`)
  console.log(
    `${dim}press shortcut to focus, r+shortcut restart, k+shortcut kill, ctrl+c exit${reset}\n`
  )
}

let pendingAction = null // 'r' or 'k'

function handleInput(data) {
  const str = data.toString()

  // ctrl+c exit
  if (str === '\x03') {
    cleanup()
    return
  }

  // ctrl+z toggle focus
  if (str === '\x1a') {
    if (focusedIndex >= 0) {
      focusedIndex = -1
      showDashboard()
    } else {
      showDashboard()
    }
    return
  }

  // if focused, forward to process
  if (focusedIndex >= 0) {
    const p = processes[focusedIndex]
    if (p && !p.killed) {
      p.terminal.write(str)
    }
    return
  }

  // dashboard mode
  if (str === 'r') {
    pendingAction = 'restart'
    process.stdout.write(`${dim}restart which? ${reset}`)
    return
  }
  if (str === 'k') {
    pendingAction = 'kill'
    process.stdout.write(`${dim}kill which? ${reset}`)
    return
  }

  // check for shortcut match
  const match = processes.find((p) => p.shortcut === str.toLowerCase())
  if (match) {
    if (pendingAction === 'restart') {
      pendingAction = null
      console.log(match.shortcut)
      match.killed = true
      match.terminal.kill()
      setTimeout(() => {
        spawnScript(match.name, match.cwd, match.label, match.extraArgs, match.index)
        console.log(`${getPrefix(match.index)} restarted`)
      }, 100)
    } else if (pendingAction === 'kill') {
      pendingAction = null
      console.log(match.shortcut)
      if (!match.killed) {
        match.killed = true
        match.terminal.kill()
        console.log(`${getPrefix(match.index)} killed`)
      }
    } else {
      // focus
      focusedIndex = match.index
      console.log(`${dim}focused: ${match.label} (ctrl+z to unfocus)${reset}\n`)
    }
    return
  }

  // escape cancels pending
  if (str === '\x1b' && pendingAction) {
    pendingAction = null
    console.log('cancelled')
  }
}

function cleanup() {
  // restore terminal to cooked mode before exiting
  if (process.stdin.isTTY && process.stdin.setRawMode) {
    try {
      process.stdin.setRawMode(false)
    } catch {}
  }
  // reset terminal attributes (colors, etc)
  process.stdout.write('\x1b[0m\n')

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
          spawnScript(
            name,
            '.',
            name,
            !flagsLast || name === lastScript ? forwardArgs : []
          )
        }
      }
    }
  }

  const wsScripts = await findWorkspaceScripts(runCommands)
  for (const [dir, { scripts, name }] of wsScripts) {
    for (const script of scripts) {
      spawnScript(
        script,
        dir,
        `${name} ${script}`,
        !flagsLast || script === lastScript ? forwardArgs : []
      )
    }
  }

  if (processes.length === 0) {
    console.error('No scripts found')
    process.exit(1)
  }

  computeShortcuts()
  showDashboard()

  if (process.stdin.isTTY) {
    process.stdin.setRawMode(true)
    process.stdin.resume()
    process.stdin.on('data', handleInput)
  }

  process.stdout.on('resize', () => {
    for (const p of processes) {
      if (!p.killed) {
        try {
          p.terminal.resize(process.stdout.columns || 80, process.stdout.rows || 24)
        } catch {
          // pty already closed
        }
      }
    }
  })

  process.on('SIGINT', cleanup)
  process.on('SIGTERM', cleanup)
}

// restore terminal on any unexpected exit
function restoreTerminal() {
  if (process.stdin.isTTY && process.stdin.setRawMode) {
    try {
      process.stdin.setRawMode(false)
    } catch {}
  }
  process.stdout.write('\x1b[0m')
}

process.on('uncaughtException', (e) => {
  restoreTerminal()
  console.error(e)
  process.exit(1)
})

main().catch((e) => {
  restoreTerminal()
  console.error(e)
  process.exit(1)
})
