#!/usr/bin/env bun

import { cmd } from '@take-out/cli'

await cmd`Setup iOS release secrets for App Store deployment`.run(async ({ prompt, colors, fs, os, path }) => {
  const clack = prompt
  const pc = colors

  interface AppleSecret {
    key: string
    description: string
    sensitive: boolean
    multiline?: boolean
  }

  const APPLE_SECRETS: AppleSecret[] = [
    {
      key: 'APP_STORE_CONNECT_API_KEY_ID',
      description: 'API Key ID from App Store Connect',
      sensitive: true,
    },
    {
      key: 'APP_STORE_CONNECT_API_KEY_ISSUER_ID',
      description: 'Issuer ID from App Store Connect',
      sensitive: true,
    },
    {
      key: 'APP_STORE_CONNECT_API_KEY_P8',
      description: 'P8 private key content (paste the full key)',
      sensitive: true,
      multiline: true,
    },
    {
      key: 'APPLE_CODE_SIGNING_GIT_URL',
      description: 'Git URL for fastlane match certificates repo',
      sensitive: false,
    },
    {
      key: 'APPLE_CODE_SIGNING_GIT_SSH_KEY',
      description: 'SSH private key for match repo access',
      sensitive: true,
      multiline: true,
    },
    {
      key: 'APPLE_CODE_SIGNING_GIT_PASSPHRASE',
      description: 'Passphrase for match repo encryption',
      sensitive: true,
    },
    {
      key: 'APPLE_DEVELOPER_TEAM_ID',
      description: 'Apple Developer Team ID (10 character string)',
      sensitive: false,
    },
    {
      key: 'IOS_BUNDLE_ID_PREVIEW',
      description: 'iOS bundle ID for preview/staging builds (e.g., com.example.app.preview)',
      sensitive: false,
    },
    {
      key: 'IOS_BUNDLE_ID_PRODUCTION',
      description: 'iOS bundle ID for production builds (e.g., com.example.app)',
      sensitive: false,
    },
  ]

  interface SecretValue {
    key: string
    value: string
  }

  const cwd = process.cwd()
  const cliArgs = process.argv.slice(2)
  const dryRun = cliArgs.includes('--dry-run')
  const yes = cliArgs.includes('--yes') || cliArgs.includes('-y')
  const showHelp = cliArgs.includes('--help') || cliArgs.includes('-h')
  const syncOnly = cliArgs.includes('--sync')
  const checkOnly = cliArgs.includes('--check')

  if (showHelp) {
    console.info(`
${pc.bold('iOS Release Setup')}

Setup and sync Apple secrets for iOS App Store deployment.

${pc.bold('Usage:')}
  bun tko ios setup-release [options]

${pc.bold('Options:')}
  --sync       Only sync existing secrets to GitHub (skip interactive setup)
  --check      Check which secrets are configured
  --dry-run    Show what would be synced without making changes
  --yes, -y    Skip confirmation prompts
  --help, -h   Show this help message

${pc.bold('Secrets managed:')}
${APPLE_SECRETS.map((s) => `  ${pc.cyan(s.key.padEnd(40))} ${pc.gray(s.description)}`).join('\n')}

${pc.bold('Workflow:')}
  1. First run: Interactive setup to configure all secrets
  2. Subsequent runs: Use --sync to push secrets to GitHub

${pc.bold('Getting credentials:')}
  1. App Store Connect API Key:
     - Go to https://appstoreconnect.apple.com/access/integrations/api
     - Create a new key with "Admin" or "App Manager" access
     - Download the .p8 file (only available once!)
     - Note the Key ID and Issuer ID

  2. Code Signing (fastlane match):
     - Create a private git repo for certificates
     - Run: fastlane match init
     - Choose a passphrase for encryption

  3. Team ID:
     - Go to https://developer.apple.com/account
     - Team ID is shown in the top right or in Membership details
`)
    return
  }

  clack.intro(pc.bgMagenta(pc.black(' iOS Release Setup ')))

  // check for gh cli
  try {
    await Bun.$`gh --version`.quiet()
  } catch {
    clack.cancel('GitHub CLI (gh) not found. Install from: https://cli.github.com')
    process.exit(1)
  }

  // check auth
  try {
    await Bun.$`gh auth status`.quiet()
  } catch {
    clack.cancel('Not authenticated with GitHub. Run: gh auth login')
    process.exit(1)
  }

  // check fastlane version (>= 2.228.0 required for templateName fix)
  const MIN_FASTLANE_VERSION = '2.228.0'
  try {
    const versionOutput = await Bun.$`fastlane --version 2>&1`.text()
    const versionMatch = versionOutput.match(/(\d+\.\d+\.\d+)/)
    if (versionMatch && versionMatch[1]) {
      const currentVersion = versionMatch[1]
      const curParts = currentVersion.split('.').map(Number)
      const minParts = MIN_FASTLANE_VERSION.split('.').map(Number)
      const [curMajor = 0, curMinor = 0, curPatch = 0] = curParts
      const [minMajor = 0, minMinor = 0, minPatch = 0] = minParts

      const isOldVersion =
        curMajor < minMajor ||
        (curMajor === minMajor && curMinor < minMinor) ||
        (curMajor === minMajor && curMinor === minMinor && curPatch < minPatch)

      if (isOldVersion) {
        clack.log.warning(
          `fastlane ${currentVersion} is outdated. Version >= ${MIN_FASTLANE_VERSION} required.\n` +
            `  Run: ${pc.cyan('brew upgrade fastlane')} or ${pc.cyan('gem install fastlane')}`
        )
      } else {
        clack.log.info(`fastlane ${currentVersion} ✓`)
      }
    }
  } catch {
    clack.log.warning(
      `fastlane not found. Install with: ${pc.cyan('brew install fastlane')}`
    )
  }

  const secretsFilePath = path.resolve(cwd, '.env.ios')

  // check mode
  if (checkOnly) {
    await checkSecrets()
    return
  }

  // load existing secrets from file
  const existingSecrets = await loadSecretsFile(secretsFilePath)

  if (syncOnly) {
    if (Object.keys(existingSecrets).length === 0) {
      clack.cancel('No secrets found. Run without --sync to configure secrets first.')
      process.exit(1)
    }
    await syncToGitHub(existingSecrets, dryRun, yes)
    return
  }

  // interactive setup
  console.info()
  clack.note(
    `This will configure Apple secrets for iOS App Store deployment.
Secrets are stored locally in ${pc.cyan('.env.ios')} and synced to GitHub.

${pc.yellow('Note:')} Add .env.ios to .gitignore (it contains sensitive data)`,
    'Setup'
  )

  const secrets: SecretValue[] = []

  for (const secret of APPLE_SECRETS) {
    const existingValue = existingSecrets[secret.key]
    const hasExisting = existingValue && existingValue.length > 0

    if (hasExisting) {
      const displayValue = secret.sensitive
        ? `${'*'.repeat(Math.min(existingValue.length, 20))}...`
        : existingValue.length > 40
          ? existingValue.substring(0, 37) + '...'
          : existingValue

      const keepExisting = await clack.confirm({
        message: `${pc.cyan(secret.key)}: Keep existing value? (${pc.gray(displayValue)})`,
        initialValue: true,
      })

      if (clack.isCancel(keepExisting)) {
        clack.cancel('Setup cancelled')
        return
      }

      if (keepExisting) {
        secrets.push({ key: secret.key, value: existingValue })
        continue
      }
    }

    console.info()
    console.info(pc.gray(`  ${secret.description}`))

    let value: string

    if (secret.multiline) {
      console.info(pc.gray('  (paste content, then press Enter twice to finish)'))

      const result = await clack.text({
        message: secret.key,
        placeholder: 'Paste content here...',
      })

      if (clack.isCancel(result)) {
        clack.cancel('Setup cancelled')
        return
      }

      value = result
    } else if (secret.sensitive) {
      const result = await clack.password({
        message: secret.key,
      })

      if (clack.isCancel(result)) {
        clack.cancel('Setup cancelled')
        return
      }

      value = result
    } else {
      const result = await clack.text({
        message: secret.key,
        placeholder: existingValue || 'Enter value...',
      })

      if (clack.isCancel(result)) {
        clack.cancel('Setup cancelled')
        return
      }

      value = result
    }

    if (!value || value.trim() === '') {
      clack.log.warning(`Skipping ${secret.key} (empty value)`)
      continue
    }

    secrets.push({ key: secret.key, value: value.trim() })
  }

  if (secrets.length === 0) {
    clack.outro(pc.yellow('No secrets configured'))
    return
  }

  // save to local file
  const spinner = clack.spinner()
  spinner.start('Saving secrets locally...')

  const envContent = secrets.map(({ key, value }) => {
    // handle multiline values
    if (value.includes('\n')) {
      return `${key}="${value.replace(/"/g, '\\"')}"`
    }
    return `${key}=${value}`
  }).join('\n')

  await fs.promises.writeFile(secretsFilePath, envContent + '\n')
  spinner.stop('Secrets saved to .env.ios')

  // ensure gitignore
  await ensureGitignore(cwd, '.env.ios')

  // offer to sync to github
  console.info()
  const shouldSync = await clack.confirm({
    message: 'Sync secrets to GitHub now?',
    initialValue: true,
  })

  if (clack.isCancel(shouldSync)) {
    clack.cancel('Setup cancelled')
    return
  }

  if (shouldSync) {
    const secretsMap: Record<string, string> = {}
    for (const s of secrets) {
      secretsMap[s.key] = s.value
    }
    await syncToGitHub(secretsMap, dryRun, yes)
  } else {
    clack.outro(pc.green('Secrets saved locally'))
    console.info()
    console.info(pc.gray('To sync to GitHub later, run:'))
    console.info(pc.cyan('  bun tko ios setup-release --sync'))
  }

  async function loadSecretsFile(filePath: string): Promise<Record<string, string>> {
    if (!fs.existsSync(filePath)) {
      return {}
    }

    const content = await fs.promises.readFile(filePath, 'utf-8')
    const secrets: Record<string, string> = {}
    const lines = content.split('\n')
    let currentKey: string | null = null
    let currentValue: string[] = []
    let inMultiline = false

    const saveCurrentKey = () => {
      if (currentKey) {
        let value = currentValue.join('\n')
        // remove surrounding quotes if present
        if ((value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1)
        }
        // unescape quotes
        value = value.replace(/\\"/g, '"')
        secrets[currentKey] = value
      }
      currentKey = null
      currentValue = []
      inMultiline = false
    }

    for (const line of lines) {
      if (inMultiline) {
        currentValue.push(line)
        // check if this line ends the multiline value
        if (line.includes('-----END') && line.includes('KEY-----')) {
          const trimmed = line.trim()
          if (trimmed.endsWith('"') || trimmed.endsWith("'")) {
            saveCurrentKey()
          }
        } else if (line.trim().endsWith('"') || line.trim().endsWith("'")) {
          saveCurrentKey()
        }
        continue
      }

      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue

      // match KEY=value or KEY="value
      const match = trimmed.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/)
      if (match && match[1]) {
        // save any previous key
        if (currentKey) saveCurrentKey()

        currentKey = match[1]
        const valueStart = match[2] || ''

        // check if value starts with quote and doesn't end with it (multiline)
        if ((valueStart.startsWith('"') && !valueStart.endsWith('"')) ||
            (valueStart.startsWith("'") && !valueStart.endsWith("'"))) {
          inMultiline = true
          currentValue = [valueStart]
        } else {
          // single line value
          currentValue = [valueStart]
          saveCurrentKey()
        }
      }
    }
    // handle any remaining key
    if (currentKey) saveCurrentKey()

    return secrets
  }

  async function syncToGitHub(
    secrets: Record<string, string>,
    dryRun: boolean,
    skipConfirm: boolean
  ) {
    const varsToSync = Object.entries(secrets).filter(([_, value]) => value && value.length > 0)

    if (varsToSync.length === 0) {
      clack.outro(pc.yellow('No secrets to sync'))
      return
    }

    console.info()
    console.info(pc.bold('Secrets to sync to GitHub:'))
    console.info()

    for (const [key, value] of varsToSync) {
      const isSensitive = /KEY|SECRET|PASSWORD|PASSPHRASE|PRIVATE/i.test(key)
      const displayValue = isSensitive
        ? pc.gray(`${'*'.repeat(Math.min(value.length, 30))}`)
        : pc.gray(value.length > 50 ? value.substring(0, 47) + '...' : value)

      console.info(`  ${pc.cyan(key.padEnd(40))} ${displayValue}`)
    }

    console.info()
    console.info(pc.gray(`Total: ${varsToSync.length} secrets`))

    if (dryRun) {
      console.info()
      clack.outro(pc.yellow('Dry run - no changes made'))
      return
    }

    if (!skipConfirm) {
      console.info()
      const confirm = await clack.confirm({
        message: `Sync ${varsToSync.length} secrets to GitHub?`,
        initialValue: true,
      })

      if (clack.isCancel(confirm) || !confirm) {
        clack.cancel('Sync cancelled')
        return
      }
    }

    const spinner = clack.spinner()
    spinner.start('Syncing to GitHub...')

    const results: Array<{ key: string; success: boolean; error?: string }> = []

    for (const [key, value] of varsToSync) {
      try {
        // write to temp file to preserve multiline values (esp SSH keys)
        const tmpFile = path.join(os.tmpdir(), `gh-secret-${key}-${Date.now()}`)
        await Bun.write(tmpFile, value)
        await Bun.$`gh secret set ${key} < ${tmpFile}`.quiet()
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

    const successful = results.filter((r) => r.success)
    const failed = results.filter((r) => !r.success)

    console.info()
    if (successful.length > 0) {
      console.info(pc.green(`✓ Successfully synced ${successful.length} secrets:`))
      for (const { key } of successful) {
        console.info(pc.gray(`  ${key}`))
      }
    }

    if (failed.length > 0) {
      console.info()
      console.info(pc.red(`✗ Failed to sync ${failed.length} secrets:`))
      for (const { key, error } of failed) {
        console.info(pc.gray(`  ${key}: ${error}`))
      }
    }

    console.info()

    if (failed.length === 0) {
      clack.outro(pc.green('All secrets synced to GitHub!'))
      console.info()
      console.info(pc.gray('Your GitHub Actions can now:'))
      console.info(pc.gray('  - Sign iOS apps with fastlane match'))
      console.info(pc.gray('  - Upload to TestFlight automatically'))
      console.info()
      console.info(pc.gray('To trigger a release, push a commit with "native:" prefix'))
    } else {
      clack.outro(pc.yellow('Sync completed with errors'))
    }
  }

  async function checkSecrets() {
    console.info()
    console.info(pc.bold('Checking GitHub secrets status...'))
    console.info()

    const spinner = clack.spinner()
    spinner.start('Fetching secrets from GitHub...')

    let existingSecrets: string[] = []
    try {
      const result = await Bun.$`gh secret list --json name -q '.[].name'`.text()
      existingSecrets = result.trim().split('\n').filter(Boolean)
    } catch {
      spinner.stop('Failed to fetch secrets')
      clack.cancel('Could not fetch GitHub secrets. Check your permissions.')
      return
    }

    spinner.stop('Secrets fetched')

    console.info()
    console.info(pc.bold('iOS Release Secrets:'))
    console.info()

    let configured = 0
    let missing = 0

    for (const secret of APPLE_SECRETS) {
      const hasSecret = existingSecrets.includes(secret.key)
      const icon = hasSecret ? pc.green('✓') : pc.red('✗')
      const status = hasSecret ? pc.green('configured') : pc.red('missing')

      console.info(`  ${icon} ${pc.cyan(secret.key.padEnd(40))} ${status}`)

      if (hasSecret) {
        configured++
      } else {
        missing++
      }
    }

    console.info()
    console.info(pc.gray(`Configured: ${configured}/${APPLE_SECRETS.length}`))

    if (missing > 0) {
      console.info()
      console.info(pc.yellow(`Run ${pc.cyan('bun tko ios setup-release')} to configure missing secrets`))
    }

    clack.outro(missing === 0 ? pc.green('All secrets configured!') : pc.yellow(`${missing} secrets missing`))
  }

  async function ensureGitignore(cwd: string, filename: string) {
    const gitignorePath = path.resolve(cwd, '.gitignore')

    if (!fs.existsSync(gitignorePath)) {
      return
    }

    const content = await fs.promises.readFile(gitignorePath, 'utf-8')

    if (!content.includes(filename)) {
      await fs.promises.writeFile(gitignorePath, content.trimEnd() + '\n' + filename + '\n')
      clack.log.info(`Added ${filename} to .gitignore`)
    }
  }
})
