import { defineCommand } from 'citty'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { spawn } from 'node:child_process'

export const runCommand = defineCommand({
  meta: {
    name: 'run',
    description: 'Run scripts in parallel (shorthand for "takeout script run")',
  },
  args: {
    scripts: {
      type: 'positional',
      description: 'Scripts to run',
      required: false,
    },
  },
  run: async ({ args }) => {
    // Get all arguments after 'run'
    const scriptArgs = process.argv.slice(3)

    // Find the project root by looking for package.json with workspaces
    let currentDir = process.cwd()
    let projectRoot = ''

    while (currentDir !== '/') {
      const packageJsonPath = resolve(currentDir, 'package.json')
      if (existsSync(packageJsonPath)) {
        try {
          const pkg = JSON.parse(readFileSync(packageJsonPath, 'utf8'))
          if (pkg.workspaces) {
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

    const scriptPath = resolve(projectRoot, 'packages/scripts/src/run.ts')

    const child = spawn('bun', [scriptPath, ...scriptArgs], {
      stdio: 'inherit',
      shell: false,
    })

    child.on('exit', (code) => {
      process.exit(code || 0)
    })
  },
})
