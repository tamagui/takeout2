#!/usr/bin/env bun

/**
 * @description Upgrade @rocicorp/zero package
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

import { $ } from 'bun'

const args = process.argv.slice(2)
const skipGitHub = args.includes('--skip-github')

await $`bun tko update-deps ${args.filter((a) => a !== '--skip-github')} @rocicorp/zero`

// run bootstrap to update ZERO_VERSION in .env
await $`bun run bootstrap`

// get the new version from package.json
function getZeroVersion() {
  const packageJsonPath = join(process.cwd(), 'package.json')
  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'))
  return packageJson.dependencies?.['@rocicorp/zero']?.replace(/^[\^~]/, '')
}

const zeroVersion = getZeroVersion()
console.info(`\nzero version: ${zeroVersion}`)

// update .env.production if it exists
const envProdPath = join(process.cwd(), '.env.production')
if (existsSync(envProdPath)) {
  let content = readFileSync(envProdPath, 'utf-8')
  const regex = /^ZERO_VERSION=.*$/m
  if (regex.test(content)) {
    content = content.replace(regex, `ZERO_VERSION=${zeroVersion}`)
  } else {
    content += `\nZERO_VERSION=${zeroVersion}\n`
  }
  writeFileSync(envProdPath, content)
  console.info('updated .env.production')
}

// sync ZERO_VERSION to GitHub secrets
if (!skipGitHub) {
  try {
    await $`gh --version`.quiet()
    console.info('syncing ZERO_VERSION to github secrets...')
    await $`echo ${zeroVersion} | gh secret set ZERO_VERSION`
    console.info('synced ZERO_VERSION to github')
  } catch {
    console.info('skipping github sync (gh cli not available or not authenticated)')
  }
}
