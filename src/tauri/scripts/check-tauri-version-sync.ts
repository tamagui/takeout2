#!/usr/bin/env bun

import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const TAURI_DIR = join(__dirname, '..')

// Read tauri.conf.json version
const tauriConfig = JSON.parse(readFileSync(join(TAURI_DIR, 'tauri.conf.json'), 'utf-8'))
const tauriVersion = tauriConfig.version

// Read Cargo.toml version
const cargoToml = readFileSync(join(TAURI_DIR, 'Cargo.toml'), 'utf-8')
const cargoVersionMatch = cargoToml.match(/^version\s*=\s*"([^"]+)"/m)
const cargoVersion = cargoVersionMatch ? cargoVersionMatch[1] : null

if (!cargoVersion) {
  console.error('Could not find version in Cargo.toml')
  process.exit(1)
}

if (tauriVersion !== cargoVersion) {
  console.error(`Version mismatch detected!`)
  console.error(`  tauri.conf.json: ${tauriVersion}`)
  console.error(`  Cargo.toml:      ${cargoVersion}`)
  console.error(`\nPlease update both files to the same version.`)
  process.exit(1)
}

console.info(`✅ Versions match: ${tauriVersion}`)
process.exit(0)
