#!/usr/bin/env bun

import { existsSync, symlinkSync, mkdirSync } from 'fs'
import { join } from 'path'
import { $ } from 'bun'

// Packages that need to be built for CLI commands
const packagesWithCLI = [
  { name: 'takeout', cliFile: 'cli.mjs' },
  { name: 'postgres', cliFile: 'cli.cjs' }
]

// Build packages if their dist doesn't exist
for (const pkg of packagesWithCLI) {
  const distPath = join(process.cwd(), 'packages', pkg.name, 'dist')

  if (!existsSync(distPath)) {
    console.log(`📦 Building ${pkg.name} package for first time...`)
    await $`cd packages/${pkg.name} && bun run build`
    console.log(`✅ ${pkg.name} build complete`)
  }
}

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
    console.log(`🔗 Creating ${pkg.name} symlink...`)

    try {
      symlinkSync(sourcePath, binPath)
      console.log(`✅ Created ${pkg.name} symlink`)
    } catch (e) {
      console.warn(`⚠️ Could not create ${pkg.name} symlink:`, e.message)
    }
  }
}