#!/usr/bin/env bun

import { existsSync, symlinkSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { $ } from 'bun'

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
  { name: 'takeout', cliFile: 'cli.mjs' },
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

  if (!existsSync(binPath) && existsSync(sourcePath)) {
    try {
      symlinkSync(sourcePath, binPath)
    } catch (e) {
      console.warn(`⚠️ Could not create ${pkg.name} symlink:`, e instanceof Error ? e.message : String(e))
    }
  }
}
