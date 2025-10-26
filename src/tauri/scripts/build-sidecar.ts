#!/usr/bin/env bun
/**
 * Build sidecar binaries for Tauri
 * Handles building native modules that run alongside the main app
 */

import { execSync } from 'node:child_process'
import { existsSync, mkdirSync, copyFileSync } from 'node:fs'
import { join } from 'node:path'

const SIDECAR_DIR = 'src-tauri/binaries'
const SUPPORTED_TARGETS = {
  'darwin-x64': 'x86_64-apple-darwin',
  'darwin-arm64': 'aarch64-apple-darwin',
  'linux-x64': 'x86_64-unknown-linux-gnu',
  'win32-x64': 'x86_64-pc-windows-msvc',
}

async function buildSidecar(name: string, sourcePath: string) {
  console.info(`Building sidecar: ${name}`)

  // ensure sidecar directory exists
  if (!existsSync(SIDECAR_DIR)) {
    mkdirSync(SIDECAR_DIR, { recursive: true })
  }

  // detect current platform
  const platform = process.platform
  const arch = process.arch
  const platformKey = `${platform}-${arch}` as keyof typeof SUPPORTED_TARGETS
  const target = SUPPORTED_TARGETS[platformKey]

  if (!target) {
    console.error(`Unsupported platform: ${platformKey}`)
    process.exit(1)
  }

  // build based on source type
  const ext = sourcePath.split('.').pop()

  if (ext === 'ts' || ext === 'js') {
    // build TypeScript/JavaScript with bun
    console.info('Building TypeScript/JavaScript sidecar with bun...')

    const outputName = platform === 'win32' ? `${name}.exe` : name
    const outputPath = join(SIDECAR_DIR, `${name}-${target}`)

    execSync(`bun build ${sourcePath} --compile --target=bun --outfile ${outputPath}`, {
      stdio: 'inherit',
    })

    console.info(`Sidecar built: ${outputPath}`)
  } else if (ext === 'rs') {
    // build Rust
    console.info('Building Rust sidecar...')

    execSync(`cargo build --release --target ${target}`, {
      stdio: 'inherit',
      cwd: sourcePath.replace(/\/[^/]+$/, ''), // get directory
    })

    const outputName = platform === 'win32' ? `${name}.exe` : name
    const rustOutput = join('target', target, 'release', outputName)
    const finalOutput = join(SIDECAR_DIR, `${name}-${target}`)

    copyFileSync(rustOutput, finalOutput)
    console.info(`Sidecar built: ${finalOutput}`)
  } else {
    console.error(`Unsupported source file type: ${ext}`)
    process.exit(1)
  }
}

async function main() {
  const args = process.argv.slice(2)

  if (args.length < 2) {
    console.error('Usage: bun build:sidecar <name> <source-path>')
    console.error('Example: bun build:sidecar my-tool ./src/tauri/sidecars/my-tool.ts')
    process.exit(1)
  }

  const name = args[0]
  const sourcePath = args[1]

  if (!name || !sourcePath) {
    console.error('Name and source path are required')
    process.exit(1)
  }

  if (!existsSync(sourcePath)) {
    console.error(`Source file not found: ${sourcePath}`)
    process.exit(1)
  }

  await buildSidecar(name, sourcePath)
}

if (import.meta.main) {
  main().catch((error) => {
    console.error('Build failed:', error)
    process.exit(1)
  })
}
