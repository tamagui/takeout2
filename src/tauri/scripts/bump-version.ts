#!/usr/bin/env bun

import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { parseArgs } from 'node:util'

const { values, positionals } = parseArgs({
  args: process.argv.slice(2),
  options: {
    help: {
      type: 'boolean',
      short: 'h',
    },
  },
  allowPositionals: true,
})

if (values.help || positionals.length === 0) {
  console.info(`
Usage: bump-version.ts <version>

Examples:
  bump-version.ts 0.2.0
  bump-version.ts 1.0.0-beta.1

This script updates the version in both:
  - src/tauri/tauri.conf.json
  - src/tauri/Cargo.toml
`)
  process.exit(0)
}

const newVersion = positionals[0]
const TAURI_DIR = join(__dirname, '..')

// Validate version format
if (!newVersion || !/^\d+\.\d+\.\d+(-\w+(\.\d+)?)?$/.test(newVersion)) {
  console.error(`Invalid version format: ${newVersion}`)
  console.error('Version must be in format: X.Y.Z or X.Y.Z-tag.N')
  process.exit(1)
}

// Update tauri.conf.json
const tauriConfigPath = join(TAURI_DIR, 'tauri.conf.json')
const tauriConfig = JSON.parse(readFileSync(tauriConfigPath, 'utf-8'))
const oldVersion = tauriConfig.version
tauriConfig.version = newVersion
writeFileSync(tauriConfigPath, JSON.stringify(tauriConfig, null, 2) + '\n')

// Update Cargo.toml
const cargoTomlPath = join(TAURI_DIR, 'Cargo.toml')
let cargoToml = readFileSync(cargoTomlPath, 'utf-8')
cargoToml = cargoToml.replace(/^version\s*=\s*"[^"]+"/m, `version = "${newVersion}"`)
writeFileSync(cargoTomlPath, cargoToml)

// Update Cargo.lock to reflect the new version
const { $ } = await import('bun')
$.cwd(TAURI_DIR)
await $`cargo update --workspace`

console.info(`✅ Updated Tauri version from ${oldVersion} to ${newVersion}`)
console.info(`   - src/tauri/tauri.conf.json`)
console.info(`   - src/tauri/Cargo.toml`)
console.info(`   - src/tauri/Cargo.lock`)

// Run version sync check to verify
console.info('\nVerifying version sync...')
await $`bun ./scripts/check-tauri-version-sync.ts`
