#!/usr/bin/env bun

import { cmd } from '@take-out/cli'

await cmd`Manage encrypted cluster config`.run(async ({ run, os, path }) => {
  const { existsSync } = await import('node:fs')
  const UNCLOUD_CONFIG_DIR = path.join(os.homedir(), '.config', 'uncloud')
  const ENCRYPTED_CONFIG_PATH = path.join(process.cwd(), '.uncloud-cluster.enc')
  const CONFIG_ARCHIVE = path.join(process.cwd(), '.uncloud-cluster.tar.gz')

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

  async function save(): Promise<void> {
    console.info('💾 saving cluster config...\n')

    if (!existsSync(UNCLOUD_CONFIG_DIR)) {
      console.error(`❌ uncloud config not found at ${UNCLOUD_CONFIG_DIR}`)
      console.error('\ninitialize a cluster first: bun run deploy:local')
      process.exit(1)
    }

    const password = getPassword()

    // create tarball
    console.info('creating archive...')
    await run(`tar -czf ${CONFIG_ARCHIVE} -C ${os.homedir()}/.config uncloud`, {
      silent: true,
    })

    // encrypt with openssl
    console.info('encrypting...')
    await run(
      `openssl enc -aes-256-cbc -salt -pbkdf2 -in ${CONFIG_ARCHIVE} -out ${ENCRYPTED_CONFIG_PATH} -pass pass:${password}`,
      { silent: true }
    )

    // cleanup
    await run(`rm ${CONFIG_ARCHIVE}`, { silent: true })

    console.info(`✅ encrypted cluster config saved to ${ENCRYPTED_CONFIG_PATH}`)
    console.info('\nadd to .gitignore if needed, or commit for team sharing')
    console.info('\nteam members can load with:')
    console.info('  export UNCLOUD_CLUSTER_PASSWORD=your-secure-password')
    console.info('  bun scripts/cluster-config.ts load')
  }

  async function load(): Promise<void> {
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
      await run(
        `openssl enc -aes-256-cbc -d -pbkdf2 -in ${ENCRYPTED_CONFIG_PATH} -out ${CONFIG_ARCHIVE} -pass pass:${password}`,
        { silent: true }
      )
    } catch {
      console.error('❌ decryption failed - wrong password?')
      process.exit(1)
    }

    // extract
    console.info('extracting...')
    await run(`tar -xzf ${CONFIG_ARCHIVE} -C ${os.homedir()}/.config`, { silent: true })

    // cleanup
    await run(`rm ${CONFIG_ARCHIVE}`, { silent: true })

    console.info(`✅ cluster config loaded to ${UNCLOUD_CONFIG_DIR}`)
    console.info('\nyou can now use uncloud cli:')
    console.info('  uc ls')
    console.info('  uc machine ls')
    console.info('  bun run deploy')
  }

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
})
