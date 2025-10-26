#!/usr/bin/env bun

import { readFileSync, existsSync, writeFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { createHash } from 'node:crypto'

const HASH_FILE_PATH = '.tauri-hash'
const TAURI_DIR = join(__dirname, '..')
const ROOT_DIR = join(TAURI_DIR, '..', '..')

// Files and directories to include in the hash
const PATHS_TO_CHECK = [
  // Tauri config and capabilities
  join(TAURI_DIR, 'tauri.conf.json'),
  join(TAURI_DIR, 'capabilities'),

  // Rust/Cargo files
  join(TAURI_DIR, 'Cargo.toml'),
  join(TAURI_DIR, 'Cargo.lock'),
  join(TAURI_DIR, 'build.rs'),
  join(TAURI_DIR, 'rust-toolchain'),
  join(TAURI_DIR, 'rust-toolchain.toml'),

  // Native Rust source code
  join(TAURI_DIR, 'src'),
]

// Patterns to check in package.json - only Tauri packages/dependencies
const TAURI_PACKAGE_PATTERNS = ['@tauri-apps/', 'tauri']

function getAllFiles(dir: string, extension?: string): string[] {
  const files: string[] = []

  if (!existsSync(dir)) {
    return files
  }

  const entries = readdirSync(dir)

  for (const entry of entries) {
    const fullPath = join(dir, entry)
    const stat = statSync(fullPath)

    if (stat.isDirectory()) {
      // Skip build directories
      if (entry === 'target' || entry === 'node_modules' || entry === '.git') {
        continue
      }
      files.push(...getAllFiles(fullPath, extension))
    } else {
      // If extension filter is provided, only include matching files
      if (!extension || fullPath.endsWith(extension)) {
        files.push(fullPath)
      }
    }
  }

  return files
}

function extractTauriRelatedContent(packageJson: any): Record<string, any> {
  const tauriDeps: Record<string, any> = {}

  // Extract Tauri-related dependencies only
  for (const depType of ['dependencies', 'devDependencies']) {
    if (packageJson[depType]) {
      for (const [pkg, version] of Object.entries(packageJson[depType])) {
        if (TAURI_PACKAGE_PATTERNS.some((pattern) => pkg.includes(pattern))) {
          tauriDeps[pkg] = version as string
        }
      }
    }
  }

  return tauriDeps
}

function calculateHash(): string {
  const hash = createHash('sha256')

  // Get all files to check
  const filesToCheck = new Set<string>()

  for (const path of PATHS_TO_CHECK) {
    if (existsSync(path)) {
      const stat = statSync(path)
      if (stat.isDirectory()) {
        // For src directory, only include .rs files
        const extension = path.endsWith('/src') ? '.rs' : undefined
        getAllFiles(path, extension).forEach((file) => filesToCheck.add(file))
      } else {
        filesToCheck.add(path)
      }
    }
  }

  // Sort files for consistent hashing
  const sortedFiles = Array.from(filesToCheck).sort()

  // Hash each file
  for (const file of sortedFiles) {
    const content = readFileSync(file)
    const relativePath = relative(ROOT_DIR, file)

    // Include file path in hash to detect renames
    hash.update(relativePath)
    hash.update('\0')
    hash.update(content)
    hash.update('\0')
  }

  // Handle package.json separately - only hash Tauri-related content
  const packageJsonPath = join(ROOT_DIR, 'package.json')
  if (existsSync(packageJsonPath)) {
    try {
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'))
      const tauriContent = extractTauriRelatedContent(packageJson)
      hash.update('package.json-tauri-content')
      hash.update('\0')
      hash.update(JSON.stringify(tauriContent, null, 2))
      hash.update('\0')
    } catch (error) {
      console.warn('Could not parse package.json:', error)
    }
  }

  return hash.digest('hex')
}

async function fetchRemoteHash(): Promise<string | null> {
  try {
    const response = await fetch(
      'https://storage.start.chat/onechatimages/releases/macos/latest-hash.txt'
    )
    if (response.ok) {
      const hash = await response.text()
      return hash.trim()
    } else {
      console.error(`Not ok response`)
    }
  } catch (error) {
    console.warn('Could not fetch remote hash:', error)
  }
  return null
}

async function main() {
  const currentHash = calculateHash()

  // Check if hash file exists locally
  const hashFilePath = join(ROOT_DIR, HASH_FILE_PATH)
  let previousHash: string | null = null

  // Try to get the hash from local file first
  if (existsSync(hashFilePath)) {
    previousHash = readFileSync(hashFilePath, 'utf-8').trim()
  }

  // If no local hash or in CI environment, try to fetch from remote
  if (!previousHash || process.env.CI === 'true') {
    const remoteHash = await fetchRemoteHash()
    if (remoteHash) {
      previousHash = remoteHash
      // Save the remote hash locally for future use
      if (!existsSync(hashFilePath) || process.env.CI === 'true') {
        writeFileSync(hashFilePath, remoteHash)
      }
    }
  }

  const hasChanged = previousHash !== currentHash

  if (process.argv.includes('--update')) {
    writeFileSync(hashFilePath, currentHash)
    console.info('Tauri hash updated locally to', currentHash)
    console.info('Note: Remember to upload the hash file when releasing')
  } else if (process.argv.includes('--check')) {
    if (hasChanged) {
      console.info('Tauri has changed')
      console.info(`Previous hash: ${previousHash || 'none'}`)
      console.info(`Current hash:  ${currentHash}`)
      if (process.env.CI === 'true') {
        console.info('(Hash fetched from remote in CI environment)')
      }
      process.exit(1) // Exit with error to indicate change
    } else {
      console.info('Tauri has not changed')
      if (process.env.CI === 'true' && previousHash) {
        console.info('(Hash fetched from remote in CI environment)')
      }
      process.exit(0)
    }
  } else {
    // Default behavior - just output whether it changed
    console.info(hasChanged ? 'true' : 'false')
    process.exit(hasChanged ? 1 : 0)
  }
}

main().catch((error) => {
  console.error('Error checking Tauri changes:', error)
  process.exit(1)
})
