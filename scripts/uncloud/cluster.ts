#!/usr/bin/env bun

/**
 * @description Manage encrypted cluster config for team sharing
 */

import { execSync } from 'node:child_process'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

const UNCLOUD_CONFIG_DIR = join(homedir(), '.config', 'uncloud')
const ENCRYPTED_CONFIG_PATH = join(process.cwd(), '.uncloud-cluster.enc')
const CONFIG_ARCHIVE = join(process.cwd(), '.uncloud-cluster.tar.gz')

function exec(command: string, silent = false): string {
  return execSync(command, {
    stdio: silent ? 'pipe' : 'inherit',
    encoding: 'utf-8',
  })
}

function getPassword(): string {
  const envPassword = process.env.UNCLOUD_CLUSTER_PASSWORD
  if (envPassword) {
    return envPassword
  }

  console.error('❌ UNCLOUD_CLUSTER_PASSWORD not set')
  console.error('\nset it with:')
  console.error('  export UNCLOUD_CLUSTER_PASSWORD=your-secure-password')
  process.exit(1)
}

async function save() {
  console.info('💾 saving cluster config...\n')

  if (!existsSync(UNCLOUD_CONFIG_DIR)) {
    console.error(`❌ uncloud config not found at ${UNCLOUD_CONFIG_DIR}`)
    console.error('\ninitialize a cluster first: bun run deploy:local')
    process.exit(1)
  }

  const password = getPassword()

  // create tarball
  console.info('creating archive...')
  exec(`tar -czf ${CONFIG_ARCHIVE} -C ${homedir()}/.config uncloud`, true)

  // encrypt with openssl
  console.info('encrypting...')
  exec(
    `openssl enc -aes-256-cbc -salt -pbkdf2 -in ${CONFIG_ARCHIVE} -out ${ENCRYPTED_CONFIG_PATH} -pass pass:${password}`,
    true
  )

  // cleanup
  exec(`rm ${CONFIG_ARCHIVE}`, true)

  console.info(`✅ encrypted cluster config saved to ${ENCRYPTED_CONFIG_PATH}`)
  console.info('\nadd to .gitignore if needed, or commit for team sharing')
  console.info('\nteam members can load with:')
  console.info('  export UNCLOUD_CLUSTER_PASSWORD=your-secure-password')
  console.info('  bun scripts/cluster-config.ts load')
}

async function load() {
  console.info('📂 loading cluster config...\n')

  if (!existsSync(ENCRYPTED_CONFIG_PATH)) {
    console.error(`❌ encrypted config not found at ${ENCRYPTED_CONFIG_PATH}`)
    console.error('\nsave cluster config first: bun scripts/cluster-config.ts save')
    process.exit(1)
  }

  const password = getPassword()

  // decrypt
  console.info('decrypting...')
  try {
    exec(
      `openssl enc -aes-256-cbc -d -pbkdf2 -in ${ENCRYPTED_CONFIG_PATH} -out ${CONFIG_ARCHIVE} -pass pass:${password}`,
      true
    )
  } catch {
    console.error('❌ decryption failed - wrong password?')
    process.exit(1)
  }

  // extract
  console.info('extracting...')
  exec(`tar -xzf ${CONFIG_ARCHIVE} -C ${homedir()}/.config`, true)

  // cleanup
  exec(`rm ${CONFIG_ARCHIVE}`, true)

  console.info(`✅ cluster config loaded to ${UNCLOUD_CONFIG_DIR}`)
  console.info('\nyou can now use uncloud cli:')
  console.info('  uc ls')
  console.info('  uc machine ls')
  console.info('  bun run deploy')
}

async function main() {
  const command = process.argv[2]

  if (!command || !['save', 'load'].includes(command)) {
    console.info(`
Uncloud Cluster Config Management

Usage:
  bun scripts/cluster-config.ts [command]

Commands:
  save    Save and encrypt current cluster config
  load    Load and decrypt cluster config

Environment:
  UNCLOUD_CLUSTER_PASSWORD    Password for encryption/decryption

Examples:
  # save cluster config (after deploying)
  export UNCLOUD_CLUSTER_PASSWORD=team-secret-password
  bun scripts/cluster-config.ts save

  # team member loads config
  export UNCLOUD_CLUSTER_PASSWORD=team-secret-password
  bun scripts/cluster-config.ts load
  uc ls  # now works
`)
    process.exit(1)
  }

  if (command === 'save') {
    await save()
  } else if (command === 'load') {
    await load()
  }
}

main().catch((error) => {
  console.error('\n💥 failed:', error.message)
  process.exit(1)
})
