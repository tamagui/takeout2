#!/usr/bin/env bun

import { existsSync, symlinkSync, mkdirSync } from 'fs'
import { join } from 'path'
import { $ } from 'bun'

// Check if packages/takeout/dist exists
const distPath = join(process.cwd(), 'packages', 'takeout', 'dist')

if (!existsSync(distPath)) {
  console.log('📦 Building takeout package for first time...')
  // Build just the takeout package so the CLI is available
  await $`cd packages/takeout && bun run build`
  console.log('✅ Initial build complete')
} else {
  console.log('✅ Packages already built, skipping initial build')
}

// Workaround for https://github.com/oven-sh/bun/issues/19782
// Bun doesn't create symlinks for workspace packages properly
const binDir = join(process.cwd(), 'node_modules', '.bin')
const takeoutBin = join(binDir, 'takeout')
const takeoutSource = join(process.cwd(), 'packages', 'takeout', 'cli.mjs')

if (!existsSync(takeoutBin) && existsSync(takeoutSource)) {
  console.log('🔗 Creating takeout symlink...')

  if (!existsSync(binDir)) {
    mkdirSync(binDir, { recursive: true })
  }

  try {
    symlinkSync(takeoutSource, takeoutBin)
    console.log('✅ Created takeout symlink')
  } catch (e) {
    console.warn('⚠️ Could not create symlink:', e.message)
  }
}