#!/usr/bin/env bun
/**
 * Check if Tauri-related files have changed since last build
 * Used by CI to determine if a new Tauri build is needed
 */

import { execSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import crypto from 'node:crypto'

const TAURI_FILES = [
  'src/tauri/**/*',
  'package.json',
  'tauri.conf.json',
  'src-tauri/**/*',
  'src/helpers/tauri/**/*',
]

const HASH_FILE = '.tauri-build-hash'

function getCurrentHash(): string {
  // get hash of all tauri-related files
  const files = TAURI_FILES.map((pattern) => {
    try {
      return execSync(`git ls-files ${pattern}`, {
        encoding: 'utf-8',
      }).trim()
    } catch {
      return ''
    }
  })
    .join('\n')
    .split('\n')
    .filter(Boolean)

  const hasher = crypto.createHash('sha256')

  for (const file of files) {
    if (existsSync(file)) {
      const content = readFileSync(file)
      hasher.update(content)
    }
  }

  return hasher.digest('hex')
}

function getLastBuildHash(): string | null {
  if (existsSync(HASH_FILE)) {
    return readFileSync(HASH_FILE, 'utf-8').trim()
  }
  return null
}

async function main() {
  const args = process.argv.slice(2)
  const checkOnly = args.includes('--check')

  const currentHash = getCurrentHash()
  const lastHash = getLastBuildHash()

  if (checkOnly) {
    // exit with 0 if unchanged, 1 if changed
    if (currentHash === lastHash) {
      console.info('Tauri files have not changed since last build')
      process.exit(0)
    } else {
      console.info('Tauri files have changed, rebuild needed')
      console.info(`Current hash: ${currentHash}`)
      console.info(`Last hash: ${lastHash || 'none'}`)
      process.exit(1)
    }
  } else {
    // save current hash
    const fs = await import('node:fs')
    fs.writeFileSync(HASH_FILE, currentHash)
    console.info(`Saved build hash: ${currentHash}`)
  }
}

if (import.meta.main) {
  main()
}
