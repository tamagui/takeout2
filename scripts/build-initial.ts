#!/usr/bin/env bun

/**
 * @description Bootstrap project workspace and build initial packages
 */

import { $ } from 'bun'
import { existsSync, mkdirSync, symlinkSync } from 'node:fs'
import { exists } from 'node:fs/promises'
import { join } from 'node:path'

// only run once:
if (!(await exists(`./node_modules/.bin/tko`))) {
  symlinkBins()
}

if (!(await exists(`./packages/helpers/dist`))) {
  // can't use our package command as its not built yet
  await $`bun ./packages/scripts/src/run.ts build --no-root`
}

function symlinkBins() {
  // workaround for https://github.com/oven-sh/bun/issues/19782
  // bun doesn't create symlinks for workspace packages properly
  const packagesWithCLI = [
    { name: 'takeout', cliFile: 'cli.mjs', alias: 'tko' },
    { name: 'postgres', cliFile: 'cli.cjs' },
  ]

  const binDir = join(process.cwd(), 'node_modules', '.bin')

  if (!existsSync(binDir)) {
    mkdirSync(binDir, { recursive: true })
  }

  for (const pkg of packagesWithCLI) {
    const binPath = join(binDir, pkg.name)
    const sourcePath = join(process.cwd(), 'packages', pkg.name, pkg.cliFile)
    symlinkTo(sourcePath, binPath)

    if (pkg.alias) {
      const aliasPath = join(binDir, pkg.alias)
      // create alias symlink pointing to the source
      symlinkTo(sourcePath, aliasPath)
    }
  }

  // helper function to create symlink with existence check
  function symlinkTo(source: string, target: string): void {
    if (existsSync(target)) {
      console.info(`✓ Symlink already exists: ${target}`)
      return
    }

    symlinkSync(source, target)
    console.info(`→ Created symlink: ${source} ⇢ ${target}`)
  }
}
