import { spawn } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { resolve, parse } from 'node:path'

import { defineCommand } from 'citty'

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
    // Get all arguments after 'run-all'
    const scriptArgs = process.argv.slice(3)
    const usePty = scriptArgs.includes('--pty')
    const filteredArgs = scriptArgs.filter((a) => a !== '--pty')

    // Find the project root by looking for package.json with workspaces or takeout field
    let currentDir = process.cwd()
    let projectRoot = ''

    while (currentDir !== parse(currentDir).root) {
      const packageJsonPath = resolve(currentDir, 'package.json')
      if (existsSync(packageJsonPath)) {
        try {
          const pkg = JSON.parse(readFileSync(packageJsonPath, 'utf8'))
          if (pkg.workspaces || pkg.takeout) {
            projectRoot = currentDir
            break
          }
        } catch {}
      }
      currentDir = resolve(currentDir, '..')
    }

    if (!projectRoot) {
      console.error('Could not find project root')
      process.exit(1)
    }

    // check if local packages/scripts exists (takeout monorepo), otherwise use installed package
    const scriptFile = usePty ? 'run-pty.mjs' : 'run.ts'
    const localScriptsPath = resolve(projectRoot, `packages/scripts/src/${scriptFile}`)
    const scriptPath = existsSync(localScriptsPath)
      ? localScriptsPath
      : resolve(projectRoot, `node_modules/@take-out/scripts/src/${scriptFile}`)

    const child = spawn(usePty ? 'node' : 'bun', [scriptPath, ...filteredArgs], {
      stdio: 'inherit',
      shell: false,
    })

    const code = await new Promise<number>((resolve) => {
      child.on('exit', (code) => resolve(code || 0))
    })
    process.exit(code)
  },
})
