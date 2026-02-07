import { spawn } from 'node:child_process'
import { existsSync, readFileSync, statSync } from 'node:fs'
import { resolve, join, parse } from 'node:path'

import { defineCommand } from 'citty'

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
  run: async () => {
    // Get all arguments after 'run'
    const scriptArgs = process.argv.slice(3)
    const firstArg = scriptArgs[0]
    const secondArg = scriptArgs[1]

    // Check if this is a filesystem script (category or script with slash)
    if (firstArg) {
      const localDir = join(process.cwd(), 'scripts')
      const categoryPath = join(localDir, firstArg)

      // Check if it's a category directory
      if (existsSync(categoryPath) && statSync(categoryPath).isDirectory()) {
        // Check if --all flag is present
        const hasAllFlag = secondArg === '--all'

        if (hasAllFlag) {
          // Run all scripts in this category in parallel
          const { discoverScripts } = await import('../utils/script-utils')
          const { runScriptsInParallel } = await import('../utils/parallel-runner')
          const pc = (await import('picocolors')).default
          const categoryScripts = discoverScripts(categoryPath)

          if (categoryScripts.size === 0) {
            console.info(pc.yellow(`No scripts found in ${firstArg}/`))
            return
          }

          const scriptsToRun = Array.from(categoryScripts.entries()).map(
            ([name, path]) => ({
              name: name.replace(`${firstArg}/`, ''),
              path,
            })
          )

          await runScriptsInParallel(scriptsToRun, {
            title: pc.bold(pc.cyan(`Running all scripts in ${firstArg}/`)),
          })

          return
        }

        // Lazy load script functions only when needed
        const { discoverScripts, getAllScriptMetadata } =
          await import('../utils/script-utils')
        const pc = (await import('picocolors')).default

        // List scripts in this category
        const categoryScripts = discoverScripts(categoryPath)

        if (categoryScripts.size > 0) {
          const metadata = await getAllScriptMetadata(categoryScripts)

          console.info()
          console.info(pc.bold(pc.cyan(`${firstArg} Scripts`)))
          console.info()

          for (const [name] of categoryScripts) {
            const shortName = name.replace(`${firstArg}/`, '')
            const meta = metadata.get(name)
            let line = `  ${pc.green(shortName)}`

            if (meta?.description) {
              line += pc.dim(` - ${meta.description}`)
            }

            if (meta?.args && meta.args.length > 0) {
              line += pc.dim(` [${meta.args.join(', ')}]`)
            }

            console.info(line)
          }

          console.info()
          console.info(pc.dim(`Run: tko ${firstArg} <name> [args...]`))
          console.info(pc.dim(`Or:  tko ${firstArg} --all to run all scripts`))
          console.info(pc.dim(`Or:  tko run ${firstArg}/<name> [args...] to execute`))
          console.info()
        } else {
          const pc = (await import('picocolors')).default
          console.info(pc.yellow(`No scripts found in ${firstArg}/`))
        }
        return
      }

      // Check if it's a direct script reference (with slash or colon)
      const normalizedName = firstArg.replace(/:/g, '/')

      // Lazy load findScript only when needed
      const { findScript } = await import('./script')
      const scriptPath = findScript(normalizedName)

      if (scriptPath) {
        // Use spawn instead of Bun's $ helper since we're in a compiled context
        const scriptArgsToPass = scriptArgs.slice(1)
        const child = spawn('bun', [scriptPath, ...scriptArgsToPass], {
          stdio: 'inherit',
          shell: false,
        })

        const code = await new Promise<number>((resolve) => {
          child.on('exit', (code) => resolve(code || 0))
        })
        process.exit(code)
      }
    }

    // Fall back to the original run.ts behavior for package.json scripts
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
    const localScriptsPath = resolve(projectRoot, 'packages/scripts/src/run.ts')
    const scriptPath = existsSync(localScriptsPath)
      ? localScriptsPath
      : resolve(projectRoot, 'node_modules/@take-out/scripts/src/run.ts')

    const child = spawn('bun', [scriptPath, ...scriptArgs], {
      stdio: 'inherit',
      shell: false,
    })

    const code = await new Promise<number>((resolve) => {
      child.on('exit', (code) => resolve(code || 0))
    })
    process.exit(code)
  },
})
