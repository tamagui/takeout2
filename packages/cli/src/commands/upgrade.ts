import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { join, resolve, parse } from 'node:path'

import { defineCommand } from 'citty'

const PACKAGES: Record<string, string[]> = {
  takeout: ['@take-out/*', 'over-zero'],
  tamagui: ['tamagui', '@tamagui/*'],
  one: ['one', '@vxrn/*'],
  zero: ['@rocicorp/zero'],
  'better-auth': ['better-auth', '@better-auth/*'],
}

export const upgradeCommand = defineCommand({
  meta: {
    name: 'upgrade',
    description: 'Upgrade packages (takeout, tamagui, one, zero, better-auth)',
  },
  args: {
    target: {
      type: 'positional',
      description: 'Package group to upgrade',
      required: false,
    },
  },
  run: async () => {
    const args = process.argv.slice(3)
    const target = args[0]
    const extraArgs = args.slice(1)

    if (!target || target === '--help' || target === '-h') {
      console.info('Usage: tko upgrade <target> [options]')
      console.info('')
      console.info('Targets:')
      console.info('  takeout      Upgrade @take-out/* and over-zero')
      console.info('  tamagui      Upgrade tamagui and @tamagui/*')
      console.info('  one          Upgrade one and @vxrn/*')
      console.info('  zero         Upgrade @rocicorp/zero')
      console.info('  better-auth  Upgrade better-auth and @better-auth/*')
      console.info('')
      console.info('Options are passed to update-deps (e.g., --canary, --rc)')
      process.exit(target ? 0 : 1)
    }

    const packages = PACKAGES[target]
    if (!packages) {
      console.error(`Unknown target: ${target}`)
      console.error(`Available targets: ${Object.keys(PACKAGES).join(', ')}`)
      process.exit(1)
    }

    // find project root
    let currentDir = process.cwd()
    let projectRoot = ''

    while (currentDir !== parse(currentDir).root) {
      const packageJsonPath = resolve(currentDir, 'package.json')
      if (existsSync(packageJsonPath)) {
        projectRoot = currentDir
        break
      }
      currentDir = resolve(currentDir, '..')
    }

    if (!projectRoot) {
      console.error('Could not find project root')
      process.exit(1)
    }

    // check if local packages/scripts exists (takeout monorepo), otherwise use installed package
    const localScriptsPath = resolve(projectRoot, 'packages/scripts/src/update-deps.ts')
    const scriptPath = existsSync(localScriptsPath)
      ? localScriptsPath
      : resolve(projectRoot, 'node_modules/@take-out/scripts/src/update-deps.ts')

    const child = spawn('bun', [scriptPath, ...packages, ...extraArgs], {
      stdio: 'inherit',
      shell: false,
    })

    let code = await new Promise<number>((resolve) => {
      child.on('exit', (code) => resolve(code || 0))
    })

    // special handling for zero - update ZERO_VERSION in .env
    if (target === 'zero' && code === 0) {
      const updateLocalEnvPath = existsSync(
        resolve(projectRoot, 'packages/scripts/src/update-local-env.ts')
      )
        ? resolve(projectRoot, 'packages/scripts/src/update-local-env.ts')
        : resolve(projectRoot, 'node_modules/@take-out/scripts/src/update-local-env.ts')

      if (existsSync(updateLocalEnvPath)) {
        const envChild = spawn('bun', [updateLocalEnvPath], {
          stdio: 'inherit',
          shell: false,
        })

        code = await new Promise<number>((resolve) => {
          envChild.on('exit', (code) => resolve(code || 0))
        })
      }
    }

    process.exit(code)
  },
})
