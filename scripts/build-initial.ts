#!/usr/bin/env bun

import { $ } from 'bun'
import { existsSync, mkdirSync, symlinkSync } from 'node:fs'
import { exists } from 'node:fs/promises'
import { join } from 'node:path'

// only run once:
if (await exists(`./node_modules/.bin/tko`)) {
  process.exit(0)
}

// Build packages in dependency order if needed
const packages = [
  'helpers', // no deps
  'postgres', // needs helpers
  'takeout', // needs scripts (but scripts has no build)
]

for (const pkg of packages) {
  const distPath = join(process.cwd(), 'packages', pkg, 'dist')
  if (!existsSync(distPath)) {
    console.info(`📦 Building ${pkg}...`)
    await $`cd packages/${pkg} && bun run build`
  }
}

// Packages that need CLI symlinks
const packagesWithCLI = [
  { name: 'takeout', cliFile: 'cli.mjs', alias: 'tko' },
  { name: 'postgres', cliFile: 'cli.cjs' },
]

// Workaround for https://github.com/oven-sh/bun/issues/19782
// Bun doesn't create symlinks for workspace packages properly
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
