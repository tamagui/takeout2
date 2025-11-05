#!/usr/bin/env bun

import { existsSync } from 'fs'
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