#!/usr/bin/env bun

import { cmd } from '@take-out/cli'

await cmd`Sync env variables to GitHub repository secrets`.run(
  async ({ prompt, colors, fs, os, path }) => {
    const { parseEnvFile } = await import('@take-out/scripts/helpers/parse-env-file')

    const pc = colors

    interface PackageJson {
      env?: Record<string, string | boolean>
    }

    // iOS secrets that should be synced from .env.ios
    const IOS_SECRETS = [
      'APP_STORE_CONNECT_API_KEY_ID',
      'APP_STORE_CONNECT_API_KEY_ISSUER_ID',
      'APP_STORE_CONNECT_API_KEY_P8',
      'APPLE_CODE_SIGNING_GIT_URL',
      'APPLE_CODE_SIGNING_GIT_SSH_KEY',
      'APPLE_CODE_SIGNING_GIT_PASSPHRASE',
      'APPLE_DEVELOPER_TEAM_ID',
      'IOS_BUNDLE_ID_PREVIEW',
      'IOS_BUNDLE_ID_PRODUCTION',
    ]

    const clack = prompt

    const cwd = process.cwd()
    const cliArgs = process.argv.slice(2)
    const dryRun = cliArgs.includes('--dry-run')
    const yes = cliArgs.includes('--yes') || cliArgs.includes('-y')

    const iosOnly = cliArgs.includes('--ios')
    const skipIos = cliArgs.includes('--no-ios')

    // filter to specific env vars (non-flag args)
    const onlyVars = cliArgs
      .filter((a) => !a.startsWith('--') && !a.startsWith('-'))
      .map((a) => a.toUpperCase())

    clack.intro(pc.bgCyan(pc.black(' Sync Environment to GitHub Secrets ')))

    // check for gh cli
    try {
      await Bun.$`gh --version`.quiet()
    } catch {
      clack.cancel('GitHub CLI (gh) not found. Install from: https://cli.github.com')
      process.exit(1)
    }

    // load .env.production (unless --ios only)
    const envPath = path.resolve(cwd, '.env.production')
    if (!iosOnly && !fs.existsSync(envPath)) {
      clack.cancel('.env.production not found. Run: bun tko onboard')
      process.exit(1)
    }

    // parse .env.production (supports multi-line values like PEM keys)
    if (!iosOnly && fs.existsSync(envPath)) {
      const envContent = await fs.promises.readFile(envPath, 'utf-8')
      const parsed = parseEnvFile(envContent)
      for (const [key, value] of Object.entries(parsed)) {
        process.env[key] = value
      }
    }

    // load .env.ios for iOS secrets
    const iosEnvPath = path.resolve(cwd, '.env.ios')
    let iosSecrets: Record<string, string> = {}
    if (fs.existsSync(iosEnvPath)) {
      const iosContent = await fs.promises.readFile(iosEnvPath, 'utf-8')
      iosSecrets = parseEnvFile(iosContent, { allowedKeys: IOS_SECRETS })
    }

    // detect repo for gh commands (handles multiple remotes)
    let repoFlag = ''
    try {
      const repoResult =
        await Bun.$`gh repo view --json nameWithOwner -q .nameWithOwner`.quiet()
      repoFlag = `-R ${repoResult.text().trim()}`
    } catch {
      // fallback - let gh pick default
    }

    // fetch existing github secrets to compare
    let existingSecrets: Set<string> = new Set()
    try {
      const result =
        await Bun.$`gh secret list --json name ${repoFlag ? repoFlag.split(' ') : []}`.quiet()
      const secrets = JSON.parse(result.text()) as Array<{ name: string }>
      existingSecrets = new Set(secrets.map((s) => s.name))
    } catch (e) {
      console.info(pc.dim(`  (couldn't fetch existing secrets: ${e})`))
    }

    // collect vars to sync
    const varsToSync: Array<{
      key: string
      value: string
      isSensitive: boolean
      source: string
      isNew: boolean
    }> = []
    const skippedVars: Array<{ key: string; reason: string }> = []

    // load package.json env section (for .env.production vars)
    if (!iosOnly) {
      const packagePath = path.resolve(cwd, 'package.json')
      const packageJson: PackageJson = JSON.parse(
        await fs.promises.readFile(packagePath, 'utf-8')
      )

      if (!packageJson.env) {
        clack.cancel('No env section found in package.json')
        process.exit(1)
      }

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
            const keyContent = await fs.promises.readFile(value, 'utf-8')
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

        const isNew = !existingSecrets.has(key)
        varsToSync.push({ key, value, isSensitive, source: '.env.production', isNew })
      }
    }

    // add iOS secrets if available and not skipped
    if (!skipIos && Object.keys(iosSecrets).length > 0) {
      for (const [key, value] of Object.entries(iosSecrets)) {
        if (!value || value === '') continue

        const isSensitive = /SECRET|KEY|PASSWORD|TOKEN|PRIVATE|PASSPHRASE/i.test(key)
        const isNew = !existingSecrets.has(key)
        varsToSync.push({ key, value, isSensitive, source: '.env.ios', isNew })
      }
    }

    // filter to specific vars if provided
    const filteredVars =
      onlyVars.length > 0
        ? varsToSync.filter((v) => onlyVars.includes(v.key))
        : varsToSync

    // check for placeholder values
    const forceYes = cliArgs.includes('--force')
    const placeholderVars = filteredVars.filter(
      (v) => v.value.includes('your-') || v.value.includes('your_')
    )
    if (placeholderVars.length > 0 && !forceYes) {
      console.info('')
      console.info(
        pc.red('⚠️  Found placeholder values that look like they were never configured:')
      )
      for (const { key, value } of placeholderVars) {
        console.info(pc.yellow(`  ${key} = ${value}`))
      }
      console.info('')
      console.info(
        pc.gray('These would overwrite real secrets in GitHub with placeholder values.')
      )
      console.info(pc.gray('Either:'))
      console.info(pc.gray('  1. Update .env.production with real values'))
      console.info(
        pc.gray('  2. Sync only specific vars: bun tko env/sync-to-github VAR1 VAR2')
      )
      console.info(pc.gray('  3. Force anyway with --force (dangerous!)'))
      console.info('')
      clack.cancel('Sync aborted due to placeholder values')
      process.exit(1)
    }

    if (filteredVars.length === 0) {
      clack.outro(pc.yellow('No variables to sync'))
      if (onlyVars.length > 0) {
        console.info(pc.gray(`\nNo matching variables found for: ${onlyVars.join(', ')}`))
      } else {
        console.info(pc.gray('\nAll environment variables are either:'))
        console.info(pc.gray('  - Not set in .env.production or .env.ios'))
        console.info(pc.gray('  - Using default values'))
      }
      return
    }

    // separate new vs existing
    const newVars = filteredVars.filter((v) => v.isNew)
    const existingVars = filteredVars.filter((v) => !v.isNew)

    // show what will be synced, grouped by new/existing
    console.info('')

    if (newVars.length > 0) {
      console.info(pc.bold(pc.green(`New secrets (${newVars.length}):`)))
      for (const { key, value, isSensitive, source } of newVars) {
        const displayValue = isSensitive
          ? pc.gray(`${'*'.repeat(Math.min(value.length, 40))}`)
          : pc.gray(value.length > 50 ? value.substring(0, 47) + '...' : value)
        const sourceTag = source === '.env.ios' ? pc.yellow(' [ios]') : ''
        console.info(
          `  ${pc.green('+')} ${pc.cyan(key.padEnd(38))} ${displayValue}${sourceTag}`
        )
      }
      console.info('')
    }

    if (existingVars.length > 0) {
      console.info(pc.bold(pc.dim(`Already in GitHub (${existingVars.length}):`)))
      for (const { key, source } of existingVars) {
        const sourceTag = source === '.env.ios' ? pc.yellow(' [ios]') : ''
        console.info(pc.dim(`    ${key}${sourceTag}`))
      }
      console.info('')
    }

    if (skippedVars.length > 0) {
      console.info(pc.dim(`Skipped (${skippedVars.length}): using default values`))
      console.info('')
    }

    if (dryRun) {
      clack.outro(pc.yellow('Dry run - no changes made'))
      return
    }

    // interactive selection unless --yes or specific vars provided
    let selectedVars = filteredVars
    if (!yes && onlyVars.length === 0) {
      const selectNew = cliArgs.includes('--new')
      const selectAll = cliArgs.includes('--all')

      if (selectNew) {
        // only sync new vars
        selectedVars = newVars
        if (selectedVars.length === 0) {
          clack.outro(pc.green('All secrets already synced to GitHub'))
          return
        }
      } else if (!selectAll) {
        // interactive mode - let user pick
        const choices = filteredVars.map((v) => ({
          value: v.key,
          label: v.key,
          hint: v.isNew ? pc.green('new') : pc.dim('exists'),
        }))

        // pre-select new vars by default
        const initialValues = newVars.map((v) => v.key)

        const selected = await clack.multiselect({
          message: 'Select variables to sync (space to toggle, enter to confirm)',
          options: choices,
          initialValues,
          required: false,
        })

        if (clack.isCancel(selected)) {
          clack.cancel('Sync cancelled')
          return
        }

        if (!selected || (selected as string[]).length === 0) {
          clack.outro(pc.yellow('No variables selected'))
          return
        }

        const selectedKeys = new Set(selected as string[])
        selectedVars = filteredVars.filter((v) => selectedKeys.has(v.key))
      }

      // final confirmation
      console.info('')
      const confirm = await clack.confirm({
        message: `Sync ${selectedVars.length} variable${selectedVars.length === 1 ? '' : 's'} to GitHub?`,
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

    for (const { key, value } of selectedVars) {
      try {
        // write to temp file to preserve multiline values (esp SSH keys)
        const tmpFile = path.join(os.tmpdir(), `gh-secret-${key}-${Date.now()}`)
        await Bun.write(tmpFile, value)
        await Bun.$`gh secret set ${key} ${repoFlag ? repoFlag.split(' ') : []} < ${tmpFile}`.quiet()
        // cross-platform file removal
        await fs.promises.unlink(tmpFile).catch(() => {})
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
)
