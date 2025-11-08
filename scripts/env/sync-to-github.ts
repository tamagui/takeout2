#!/usr/bin/env bun

/**
 * @description Sync .env.production variables to GitHub repository secrets
 */

import * as clack from '@clack/prompts'
import { config } from 'dotenv'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import pc from 'picocolors'

interface PackageJson {
  env?: Record<string, string | boolean>
}

async function main() {
  const cwd = process.cwd()
  const args = process.argv.slice(2)
  const dryRun = args.includes('--dry-run')
  const yes = args.includes('--yes') || args.includes('-y')

  clack.intro(pc.bgCyan(pc.black(' Sync Environment to GitHub Secrets ')))

  // check for gh cli
  try {
    await Bun.$`gh --version`.quiet()
  } catch {
    clack.cancel('GitHub CLI (gh) not found. Install from: https://cli.github.com')
    process.exit(1)
  }

  // load .env.production
  const envPath = resolve(cwd, '.env.production')
  if (!existsSync(envPath)) {
    clack.cancel('.env.production not found. Run: bun tko onboard')
    process.exit(1)
  }

  // manually parse .env.production to avoid dotenv loading .env or .env.local
  const envContent = readFileSync(envPath, 'utf-8')
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue

    const match = trimmed.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/)
    if (match && match[1] && match[2] !== undefined) {
      const key = match[1]
      const value = match[2]
      // remove quotes if present
      const cleanValue = value.replace(/^["'](.*)["']$/, '$1')
      process.env[key] = cleanValue
    }
  }

  // load package.json env section
  const packagePath = resolve(cwd, 'package.json')
  const packageJson: PackageJson = JSON.parse(readFileSync(packagePath, 'utf-8'))

  if (!packageJson.env) {
    clack.cancel('No env section found in package.json')
    process.exit(1)
  }

  // collect vars to sync
  const varsToSync: Array<{ key: string; value: string; isSensitive: boolean }> = []
  const skippedVars: Array<{ key: string; reason: string }> = []

  for (const [key, defaultValue] of Object.entries(packageJson.env)) {
    let value = process.env[key]

    // skip if no value in .env.production
    if (!value || value === '') {
      if (defaultValue === true) {
        skippedVars.push({ key, reason: 'no value in .env.production' })
      }
      continue
    }

    // skip if it's a default value (not true)
    if (defaultValue !== true && value === String(defaultValue)) {
      skippedVars.push({ key, reason: 'using default value' })
      continue
    }

    // for DEPLOY_SSH_KEY, read the file content if it's a path
    if (key === 'DEPLOY_SSH_KEY' && value.startsWith('/')) {
      try {
        const keyContent = readFileSync(value, 'utf-8')
        value = keyContent
        console.info(pc.gray(`  reading ssh key from: ${process.env[key]}`))
      } catch (error) {
        skippedVars.push({
          key,
          reason: `file not found: ${value}`,
        })
        continue
      }
    }

    // determine if sensitive (contains SECRET, KEY, PASSWORD, TOKEN)
    const isSensitive =
      /SECRET|KEY|PASSWORD|TOKEN|PRIVATE/i.test(key) || key === 'DEPLOY_SSH_KEY'

    varsToSync.push({ key, value, isSensitive })
  }

  if (varsToSync.length === 0) {
    clack.outro(pc.yellow('No variables to sync'))
    console.info(pc.gray('\nAll environment variables are either:'))
    console.info(pc.gray('  - Not set in .env.production'))
    console.info(pc.gray('  - Using default values'))
    return
  }

  // show what will be synced
  console.info('')
  console.info(pc.bold('Variables to sync:'))
  console.info('')

  for (const { key, value, isSensitive } of varsToSync) {
    const displayValue = isSensitive
      ? pc.gray(`${'*'.repeat(Math.min(value.length, 40))}`)
      : pc.gray(value.length > 50 ? value.substring(0, 47) + '...' : value)

    console.info(`  ${pc.cyan(key.padEnd(30))} ${displayValue}`)
  }

  if (skippedVars.length > 0) {
    console.info('')
    console.info(pc.gray('Skipped variables:'))
    for (const { key, reason } of skippedVars) {
      console.info(pc.gray(`  ${key.padEnd(30)} (${reason})`))
    }
  }

  console.info('')
  console.info(pc.gray(`Total: ${varsToSync.length} variables will be synced`))

  if (dryRun) {
    console.info('')
    clack.outro(pc.yellow('Dry run - no changes made'))
    return
  }

  // confirm
  if (!yes) {
    console.info('')
    const confirm = await clack.confirm({
      message: `Sync ${varsToSync.length} variables to GitHub secrets?`,
      initialValue: true,
    })

    if (clack.isCancel(confirm) || !confirm) {
      clack.cancel('Sync cancelled')
      return
    }
  }

  // sync to github
  const spinner = clack.spinner()
  spinner.start('Syncing to GitHub...')

  const results: Array<{ key: string; success: boolean; error?: string }> = []

  for (const { key, value } of varsToSync) {
    try {
      // use gh secret set with piped input
      await Bun.$`echo ${value} | gh secret set ${key}`.quiet()
      results.push({ key, success: true })
    } catch (error) {
      results.push({
        key,
        success: false,
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }

  spinner.stop('Sync complete')

  // show results
  const successful = results.filter((r) => r.success)
  const failed = results.filter((r) => !r.success)

  console.info('')
  if (successful.length > 0) {
    console.info(pc.green(`✓ Successfully synced ${successful.length} variables:`))
    for (const { key } of successful) {
      console.info(pc.gray(`  ${key}`))
    }
  }

  if (failed.length > 0) {
    console.info('')
    console.info(pc.red(`✗ Failed to sync ${failed.length} variables:`))
    for (const { key, error } of failed) {
      console.info(pc.gray(`  ${key}: ${error}`))
    }
  }

  console.info('')

  if (failed.length === 0) {
    clack.outro(pc.green('All variables synced successfully!'))
    console.info('')
    console.info(
      pc.gray('Your GitHub Actions workflows now have access to these secrets')
    )
    console.info(pc.gray('Next: git push to trigger CI/CD deployment'))
  } else {
    clack.outro(pc.yellow('Sync completed with errors'))
    console.info('')
    console.info(pc.gray('Check the errors above and try again'))
  }
}

main().catch((error) => {
  console.error(pc.red('\n✗ Unexpected error:'), error.message)
  process.exit(1)
})
