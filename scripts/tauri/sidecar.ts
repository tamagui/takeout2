/**
 * @description Build Tauri sidecar binaries
 */

import { $ } from 'bun'
import fs from 'node:fs'
import { join } from 'node:path'

// run from ./src/tauri
const cwd = join(__dirname, '..')

$.cwd(cwd)

// Using Bun's native executable builder
console.info('Building sidecar with Bun...')
await $`bun build ./sidecar/main.ts --compile --outfile ./dist/sidecar`

const ext = process.platform === 'win32' ? '.exe' : ''

// for now we are just building mac:
const targetTriple = `aarch64-apple-darwin`

if (!fs.existsSync(join(cwd, './binaries'))) {
  await $`mkdir ./binaries`
}

// Move the compiled binary to the correct location
await $`mv ./dist/sidecar${ext} ./binaries/sidecar-${targetTriple}${ext}`

// Make sure it's executable
await $`chmod +x ./binaries/sidecar-${targetTriple}${ext}`

console.info(`\n\n✓ Built sidecar with Bun native builder`)
