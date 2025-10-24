#!/usr/bin/env bun

import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { getNextVersion } from './get-next-version'

const TAURI_DIR = join(__dirname, '..')

// Get the next version based on remote manifest
const newVersion = await getNextVersion()

console.info(`Setting Tauri version to ${newVersion}`)

// Update tauri.conf.json
const tauriConfigPath = join(TAURI_DIR, 'tauri.conf.json')
const tauriConfig = JSON.parse(readFileSync(tauriConfigPath, 'utf-8'))
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
await $`cargo update --workspace`.quiet()

console.info(`✅ Bumped Tauri version to ${newVersion}`)
console.info(`   - src/tauri/tauri.conf.json`)
console.info(`   - src/tauri/Cargo.toml`)
console.info(`   - src/tauri/Cargo.lock`)
