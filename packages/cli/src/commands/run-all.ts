import { spawn } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { resolve, parse } from 'node:path'

import { defineCommand } from 'citty'

function resolveNodeBinary(): string {
  const explicitNode = process.env.NODE
  if (explicitNode && existsSync(explicitNode)) {
    return explicitNode
  }

  if (process.execPath.endsWith('/node') && existsSync(process.execPath)) {
    return process.execPath
  }

  return 'node'
}

export const runAllCommand = defineCommand({
  meta: {
    name: 'run-all',
    description: 'Run multiple package.json scripts in parallel',
  },
  args: {
    scripts: {
      type: 'positional',
      description: 'Scripts to run in parallel',
      required: false,
    },
  },
  run: async () => {
    const scriptArgs = process.argv.slice(3)
    const usePty = scriptArgs.includes('--pty')
    const filteredArgs = scriptArgs.filter((a) => a !== '--pty')

    if (usePty) {
      // pty mode still needs node + node-pty subprocess
      const projectRoot = findProjectRoot()
      if (!projectRoot) {
        console.error('Could not find project root')
        process.exit(1)
      }

      const localRunPath = resolve(projectRoot, 'packages/run/src/run-pty.mjs')
      const scriptPath = existsSync(localRunPath)
        ? localRunPath
        : resolve(projectRoot, 'node_modules/@take-out/run/src/run-pty.mjs')

      const child = spawn(resolveNodeBinary(), [scriptPath, ...filteredArgs], {
        stdio: 'inherit',
        shell: false,
        env: process.env,
      })

      const code = await new Promise<number>((resolve) => {
        child.on('exit', (code) => resolve(code || 0))
      })
      process.exit(code)
    } else {
      // direct import — no subprocess layer
      const { runParallelScripts, parseRunArgs } = await import('@take-out/run')
      await runParallelScripts(parseRunArgs(filteredArgs))
    }
  },
})

function findProjectRoot(): string {
  let currentDir = process.cwd()
  while (currentDir !== parse(currentDir).root) {
    const packageJsonPath = resolve(currentDir, 'package.json')
    if (existsSync(packageJsonPath)) {
      try {
        const pkg = JSON.parse(readFileSync(packageJsonPath, 'utf8'))
        if (pkg.workspaces || pkg.takeout) {
          return currentDir
        }
      } catch {}
    }
    currentDir = resolve(currentDir, '..')
  }
  return ''
}
