/**
 * Onboard command - interactive setup for Takeout starter kit
 */

import { execSync } from 'node:child_process'
import { randomBytes } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { resolve } from 'node:path'

import { defineCommand } from 'citty'
import pc from 'picocolors'

import {
  copyEnvFile,
  createEnvLocal,
  envFileExists,
  updateEnvVariable,
} from '../utils/env'
import { setupProductionEnv } from '../utils/env-setup'
import {
  ejectFromMonorepo,
  markOnboarded,
  updateAppConfig,
  updatePackageJson,
  updatePackageJsonEnv,
} from '../utils/files'
import { checkAllPorts, getConflictingPorts } from '../utils/ports'
import { checkAllPrerequisites, hasRequiredPrerequisites } from '../utils/prerequisites'
import {
  confirmContinue,
  displayOutro,
  displayPortConflicts,
  displayPrerequisites,
  displayWelcome,
  promptText,
  promptSelect,
  promptStartStep,
  showError,
  showInfo,
  showSpinner,
  showStep,
  showSuccess,
  showWarning,
} from '../utils/prompts'

export const onboardCommand = defineCommand({
  meta: {
    name: 'onboard',
    description: 'Interactive onboarding for Takeout starter kit',
  },
  args: {
    skip: {
      type: 'boolean',
      description: 'Skip onboarding entirely',
      default: false,
    },
    defaults: {
      type: 'boolean',
      description: 'Run with defaults (non-interactive)',
      default: false,
    },
  },
  async run({ args }) {
    const cwd = process.cwd()

    if (args.skip) {
      showInfo('Skipping onboarding (--skip flag)')
      return
    }

    // non-interactive defaults mode
    if (args.defaults) {
      showInfo('Running onboarding with defaults (--defaults flag)')
      console.info()

      // setup environment
      const hasEnv = envFileExists(cwd, '.env')
      if (!hasEnv) {
        const copyResult = copyEnvFile(cwd, '.env.development', '.env')
        if (copyResult.success) {
          showSuccess('Created .env from .env.development')
        } else {
          showError(`Failed to create .env: ${copyResult.error}`)
          return
        }
        createEnvLocal(cwd)
        showSuccess('Created .env.local for personal overrides')
      } else {
        showInfo('.env already exists, skipping')
      }

      markOnboarded(cwd)
      showSuccess('Onboarding complete with defaults')
      console.info()
      showInfo('Next steps:')
      console.info('  bun backend        # start docker services')
      console.info('  bun dev            # start web dev server')
      return
    }

    // Phase 0: Check for saved state
    displayWelcome()

    const savedState = loadOnboardState(cwd)
    let startStep:
      | 'full'
      | 'prerequisites'
      | 'identity'
      | 'ports'
      | 'eject'
      | 'ci-runners'
      | 'production'
      | 'cancel'

    if (savedState) {
      console.info()
      showInfo(`Found incomplete setup from previous session (${savedState.step})`)
      const shouldResume = await confirmContinue('Resume from where you left off?', true)

      if (shouldResume) {
        startStep = savedState.step
      } else {
        clearOnboardState(cwd)
        startStep = await promptStartStep()
      }
    } else {
      startStep = await promptStartStep()
    }

    if (startStep === 'cancel') {
      displayOutro('Setup cancelled')
      return
    }

    // Direct eject - skip to eject step
    if (startStep === 'eject') {
      showStep('Monorepo Ejection')
      console.info()

      console.info(
        pc.gray(
          "We've included a variety of packages we found useful building apps with this stack:"
        )
      )
      console.info(pc.gray('  • @take-out/cli - CLI tools and onboarding'))
      console.info(pc.gray('  • @take-out/helpers - Utility functions'))
      console.info(pc.gray('  • @take-out/hooks - React hooks'))
      console.info(pc.gray('  • @take-out/postgres - Database utilities'))
      console.info(pc.gray('  • @take-out/scripts - Build and dev scripts'))
      console.info(pc.gray('  • @take-out/better-auth-utils - Auth helpers'))
      console.info()

      const shouldEject = await confirmContinue(
        'Eject from monorepo setup? (removes ./packages, uses published versions)',
        true
      )

      if (shouldEject) {
        // first run a dry-run to show what will happen
        const dryResult = await ejectFromMonorepo(cwd, { dryRun: true })

        if (!dryResult.success) {
          showError(`Cannot eject: ${dryResult.error}`)
          clearOnboardState(cwd)
          return
        }

        console.info()
        showInfo(`Found ${dryResult.packages?.length} packages to convert:`)
        for (const pkg of dryResult.packages || []) {
          console.info(pc.gray(`  • ${pkg.name}@${pkg.version}`))
        }
        if (dryResult.warnings?.length) {
          for (const warn of dryResult.warnings) {
            showWarning(warn)
          }
        }
        console.info()

        const confirmEject = await confirmContinue('Proceed with ejection?', true)
        if (!confirmEject) {
          showInfo('Eject cancelled')
          clearOnboardState(cwd)
          displayOutro('Done!')
          return
        }

        const spinner = showSpinner('Ejecting from monorepo...')

        const result = await ejectFromMonorepo(cwd)

        if (result.success) {
          spinner.stop('Ejected from monorepo')
          showSuccess('✓ Removed ./packages directory')
          showSuccess('✓ Updated package.json to use published versions')
          showSuccess('✓ Installed published packages')

          try {
            execSync('git add -A && git commit -m "ejected from monorepo"', {
              cwd,
              stdio: 'ignore',
            })
            showSuccess('✓ Committed eject changes')
          } catch {
            showWarning('Git commit skipped (not a git repo or no changes)')
          }

          console.info()
          showInfo('You can now upgrade packages with: bun up takeout')
        } else {
          spinner.stop('Ejection failed')
          showError(`Failed to eject: ${result.error}`)
          if (result.error?.includes('install failed')) {
            showInfo('You may be able to fix this by running "bun install" manually')
            showInfo('Or restore the repo from git with "git checkout ."')
          }
        }
      } else {
        showInfo('Eject cancelled')
      }

      clearOnboardState(cwd)
      displayOutro('Done!')
      return
    }

    // Phase 1: Prerequisites
    if (startStep === 'prerequisites' || startStep === 'full') {
      saveOnboardState(cwd, { step: 'prerequisites', timestamp: Date.now() })
      showStep('Checking prerequisites...')
      console.info()

      const checks = checkAllPrerequisites()
      displayPrerequisites(checks)

      const hasRequired = hasRequiredPrerequisites(checks)

      if (!hasRequired) {
        showWarning(
          'Some required prerequisites are missing. You can continue, but setup may fail.'
        )
        const shouldContinue = await confirmContinue('Continue anyway?', false)
        if (!shouldContinue) {
          displayOutro('Setup cancelled. Install prerequisites and try again.')
          return
        }
      }

      console.info()
    }

    // Phase 2: Project Identity
    if (
      startStep === 'prerequisites' ||
      startStep === 'identity' ||
      startStep === 'full'
    ) {
      saveOnboardState(cwd, { step: 'identity', timestamp: Date.now() })
      showStep('Configuring project identity...')
      console.info()

      const shouldCustomize = await confirmContinue(
        'Customize project name and bundle identifier?',
        false
      )

      if (shouldCustomize) {
        await customizeProject(cwd)
      } else {
        showInfo('Keeping default project configuration')
      }

      console.info()
    }

    // Phase 3: Web Port Configuration
    if (
      startStep === 'prerequisites' ||
      startStep === 'identity' ||
      startStep === 'ports' ||
      startStep === 'full'
    ) {
      saveOnboardState(cwd, { step: 'ports', timestamp: Date.now() })
      showStep('Configuring web server port...')
      console.info()

      showInfo('Default web port: 8081 (TAMA in T9)')
      const shouldCustomizePort = await confirmContinue(
        'Customize web server port?',
        false
      )

      if (shouldCustomizePort) {
        const newPort = await promptText(
          'Web server port:',
          '8081',
          '3000, 8080, 8081, etc.'
        )

        if (newPort && newPort !== '8081') {
          await replacePortInProject(cwd, '8081', newPort)
          showSuccess(`✓ Updated web server port to ${newPort}`)
        }
      } else {
        showInfo('Keeping default port 8081')
      }

      console.info()
      showStep('Checking service ports...')
      console.info()

      const portChecks = checkAllPorts()
      const conflicts = getConflictingPorts(portChecks)

      if (conflicts.length > 0) {
        displayPortConflicts(conflicts)
        showWarning('Some ports are already in use. You may need to stop other services.')
      }

      console.info()
    }

    // Phase 4: CI/CD Runner Configuration
    if (
      startStep === 'prerequisites' ||
      startStep === 'identity' ||
      startStep === 'ports' ||
      startStep === 'full'
    ) {
      saveOnboardState(cwd, { step: 'ci-runners', timestamp: Date.now() })
      showStep('Configuring CI/CD runners...')
      console.info()

      const shouldConfigureCI = await confirmContinue(
        'Configure GitHub Actions CI runners?',
        true
      )

      if (shouldConfigureCI) {
        await configureCIRunners(cwd)
      } else {
        showInfo('Skipping CI runner configuration')
        showWarning(
          'Default CI uses ARM64 Docker builds. If not using ARM runners, update scripts/web/build-docker.ts'
        )
      }

      console.info()
    }

    // Phase 6: Development Complete
    if (startStep !== 'production') {
      showStep('Development setup complete!')
      console.info()

      showSuccess('✓ Environment configured')
      showSuccess('✓ Project ready for development')

      markOnboarded(cwd)

      console.info()
      showInfo('Next steps (run in separate terminals):')
      console.info()
      console.info('  bun backend        # start docker services first')
      console.info('  bun dev            # start web dev server')
      console.info()
      console.info('  bun ios            # build iOS dev app')
      console.info('  bun android        # build Android dev app')
      console.info('  bun tko docs list  # view Takeout docs')
      console.info()
    }

    // Phase 6.5: Monorepo Ejection (Optional)
    if (startStep !== 'production') {
      console.info()
      showStep('Monorepo Setup')
      console.info()

      console.info(
        pc.gray(
          "We've included a variety of packages we found useful building apps with this stack:"
        )
      )
      console.info(pc.gray('  • @take-out/cli - CLI tools and onboarding'))
      console.info(pc.gray('  • @take-out/helpers - Utility functions'))
      console.info(pc.gray('  • @take-out/hooks - React hooks'))
      console.info(pc.gray('  • @take-out/postgres - Database utilities'))
      console.info(pc.gray('  • @take-out/scripts - Build and dev scripts'))
      console.info(pc.gray('  • @take-out/better-auth-utils - Auth helpers'))
      console.info()
      console.info(pc.gray('These packages are included locally for two reasons:'))
      console.info(
        pc.gray('  1. You can see their source and decide if you want to keep them')
      )
      console.info(
        pc.gray('  2. Anyone can easily submit fixes or improvements back to our repo')
      )
      console.info()
      console.info(
        pc.gray(
          "Over time we'll publish new versions. You can sync with 'bun tko sync' (monorepo)"
        )
      )
      console.info(pc.gray("or if you eject, use 'bun up takeout' for package updates."))
      console.info()

      const shouldEject = await confirmContinue(
        'Eject from monorepo setup? (removes ./packages, uses published versions)',
        false
      )

      if (shouldEject) {
        // first run a dry-run to show what will happen
        const dryResult = await ejectFromMonorepo(cwd, { dryRun: true })

        if (!dryResult.success) {
          showError(`Cannot eject: ${dryResult.error}`)
        } else {
          console.info()
          showInfo(`Found ${dryResult.packages?.length} packages to convert:`)
          for (const pkg of dryResult.packages || []) {
            console.info(pc.gray(`  • ${pkg.name}@${pkg.version}`))
          }
          if (dryResult.warnings?.length) {
            for (const warn of dryResult.warnings) {
              showWarning(warn)
            }
          }
          console.info()

          const confirmEject = await confirmContinue('Proceed with ejection?', true)
          if (confirmEject) {
            const spinner = showSpinner('Ejecting from monorepo...')

            const result = await ejectFromMonorepo(cwd)

            if (result.success) {
              spinner.stop('Ejected from monorepo')
              showSuccess('✓ Removed ./packages directory')
              showSuccess('✓ Updated package.json to use published versions')
              showSuccess('✓ Installed published packages')

              // commit the eject changes
              try {
                execSync('git add -A && git commit -m "ejected from monorepo"', {
                  cwd,
                  stdio: 'ignore',
                })
                showSuccess('✓ Committed eject changes')
              } catch {
                showWarning('Git commit skipped (not a git repo or no changes)')
              }

              console.info()
              showInfo('You can now upgrade packages with: bun up takeout')
            } else {
              spinner.stop('Ejection failed')
              showError(`Failed to eject: ${result.error}`)
              if (result.error?.includes('install failed')) {
                showInfo('You may be able to fix this by running "bun install" manually')
                showInfo('Or restore the repo from git with "git checkout ."')
              }
            }
          } else {
            showInfo('Keeping monorepo setup - you can customize packages locally')
            showInfo('Run "bun tko sync" to sync with upstream Takeout updates later')
          }
        }
      } else {
        showInfo('Keeping monorepo setup - you can customize packages locally')
        showInfo('Run "bun tko sync" to sync with upstream Takeout updates later')
      }

      console.info()
    }

    // Phase 7: Production Setup (Optional or direct)
    if (startStep === 'full' || startStep === 'production') {
      saveOnboardState(cwd, { step: 'production', timestamp: Date.now() })
      console.info()
      showStep('Production deployment setup')
      console.info()

      // Only ask to confirm if doing full setup, skip if directly chose production
      let setupProd = startStep === 'production'
      if (startStep === 'full') {
        setupProd = await confirmContinue('Set up production deployment?', false)
      }

      if (setupProd) {
        await setupProductionDeployment(cwd)
      } else {
        showInfo('Skipping production setup')
        showInfo('You can set up production later with: bun tko onboard --production')
      }
    }

    // Clear state on successful completion
    clearOnboardState(cwd)

    console.info()
    displayOutro('Happy coding! 🚀')
  },
})

async function customizeProject(cwd: string): Promise<void> {
  const projectName = await promptText('Project name:', 'takeout', 'my-awesome-app')

  const slug = await promptText(
    'Project slug (URL-friendly):',
    projectName.toLowerCase().replace(/\s+/g, '-'),
    'my-awesome-app'
  )

  const bundleId = await promptText(
    'Bundle identifier:',
    `com.${slug}.app`,
    'com.example.app'
  )

  const domain = await promptText(
    'Development domain:',
    'localhost:8081',
    'localhost:8081'
  )

  // Update package.json
  const pkgResult = updatePackageJson(cwd, {
    name: projectName,
    description: `${projectName} - Built with Takeout starter kit`,
  })

  if (pkgResult.success) {
    showSuccess('Updated package.json')
  } else {
    showError(`Failed to update package.json: ${pkgResult.error}`)
  }

  // Update app.config.ts
  const configResult = updateAppConfig(cwd, {
    name: projectName,
    slug,
    bundleId,
  })

  if (configResult.success) {
    showSuccess('Updated app.config.ts')
  } else {
    showError(`Failed to update app.config.ts: ${configResult.error}`)
  }

  // Update .env URLs
  const serverUrl = `http://${domain}`
  updateEnvVariable(cwd, 'BETTER_AUTH_URL', serverUrl)
  updateEnvVariable(cwd, 'ONE_SERVER_URL', serverUrl)
  showSuccess('Updated environment URLs')
}

async function setupProductionDeployment(cwd: string): Promise<void> {
  // Choose platform
  const platform = await promptSelect<'uncloud' | 'sst'>('Choose deployment platform:', [
    {
      value: 'uncloud',
      label: 'Uncloud',
      hint: 'Simpler and quicker (~10 minutes setup)',
    },
    {
      value: 'sst',
      label: 'AWS SST',
      hint: 'Proven and reliable (~1 hour setup)',
    },
  ])

  if (platform === 'cancel') {
    showInfo('Skipping production setup')
    return
  }

  console.info()

  if (platform === 'uncloud') {
    await setupUncloudDeployment(cwd)
  } else {
    await setupSSTDeployment(cwd)
  }
}

async function setupUncloudDeployment(cwd: string): Promise<void> {
  showInfo('Setting up Uncloud deployment')
  console.info()
  console.info(
    pc.gray(
      'Uncloud provides:\n  • Managed PostgreSQL with logical replication\n  • Free subdomain (your-app.uncld.dev)\n  • Automatic SSL certificates\n  • Easy scaling'
    )
  )
  console.info()

  // ask about server architecture
  console.info()
  showInfo('Server Architecture')
  console.info(pc.gray('Docker images must match your server CPU architecture'))
  console.info()

  const architecture = await promptSelect<'amd64' | 'arm64'>(
    'What CPU architecture is your deployment server?',
    [
      {
        value: 'amd64',
        label: 'AMD64/x86_64 (Intel/AMD)',
        hint: 'Most VPS providers (DigitalOcean, Linode, Vultr)',
      },
      {
        value: 'arm64',
        label: 'ARM64 (Apple Silicon)',
        hint: 'Hetzner ARM, Oracle ARM, Bare metal ARM servers',
      },
    ]
  )

  if (architecture === 'cancel') {
    showInfo('Skipping production setup')
    return
  }

  const deploymentArch = architecture === 'arm64' ? 'linux/arm64' : 'linux/amd64'
  console.info()
  showInfo(`Will build Docker images for: ${deploymentArch}`)
  console.info()

  // Read app name from constants
  const appConstantsPath = resolve(cwd, 'src/constants/app.ts')
  let defaultAppName = 'my-app'
  try {
    const appConstants = readFileSync(appConstantsPath, 'utf-8')
    const appNameMatch = appConstants.match(/APP_NAME_LOWERCASE\s*=\s*['"](.+?)['"]/)
    if (appNameMatch?.[1]) {
      defaultAppName = appNameMatch[1]
    }
  } catch {
    // use default if can't read file
  }

  // Domain choice
  const useFreeSubdomain = await confirmContinue('Use free Uncloud subdomain?', true)

  let domain: string
  let zeroUrl: string

  // TODO: reconsider the domain configuration onboarding flow as the cluster DNS xxxxxx.uncld.dev will be available
  // only after initializing the cluster.
  if (useFreeSubdomain) {
    const appName = await promptText(
      'App name for subdomain:',
      defaultAppName,
      defaultAppName
    )
    domain = `https://${appName}.uncld.dev`
    zeroUrl = `https://zero-${appName}.uncld.dev`
  } else {
    domain = await promptText(
      'Enter your custom domain:',
      undefined,
      'https://yourapp.com'
    )
    zeroUrl = await promptText(
      'Enter your Zero sync domain:',
      undefined,
      'https://zero.yourapp.com'
    )
    console.info()
    showWarning('Custom domain setup requires DNS configuration after deployment')
    // TODO: there is no such doc
    console.info(pc.gray('See: https://uncloud.run/docs/domains'))
  }

  console.info()

  // Database setup
  showInfo('Database Configuration')
  console.info()
  console.info(pc.gray('PostgreSQL database with logical replication enabled'))
  console.info(pc.gray('Zero sync requires 3 databases on the same host:'))
  console.info(pc.gray('  • Main database (your app data)'))
  console.info(pc.gray('  • Two Zero databases (for sync infrastructure)'))
  console.info()
  console.info(pc.gray('Use a managed database (DigitalOcean, Render, Supabase, etc.)'))
  console.info(pc.gray('The deployment will automatically create the Zero databases'))
  console.info()

  const dbUser = await promptText('Database username:', 'postgres', 'postgres')
  const dbPassword = await promptText('Database password:', undefined, '')
  const dbHost = await promptText(
    'Database host (e.g., db-xxx.ondigitalocean.com):',
    undefined,
    'localhost'
  )
  const dbPort = await promptText('Database port:', '5432', '5432')
  const dbName = await promptText(
    'Main database name (will derive Zero databases from this):',
    'postgres',
    'postgres'
  )

  // Construct database URL (deployment script will derive Zero databases from this)
  const dbUrl = `postgresql://${dbUser}:${dbPassword}@${dbHost}:${dbPort}/${dbName}`

  // Generate auth secret
  console.info()
  const authSecret = randomBytes(32).toString('hex')

  // Ensure .env.production exists (create from example if needed)
  const envFile = '.env.production'
  if (!envFileExists(cwd, envFile)) {
    const copyResult = copyEnvFile(cwd, '.env.production.example', envFile)
    if (copyResult.success) {
      showSuccess(`Created ${envFile} from .env.production.example`)
    } else {
      showError(`Failed to create ${envFile}: ${copyResult.error}`)
      return
    }
  }

  updateEnvVariable(cwd, 'DEPLOYMENT_PLATFORM', 'uncloud', envFile)
  updateEnvVariable(cwd, 'DEPLOYMENT_ARCH', deploymentArch, envFile)
  updateEnvVariable(cwd, 'DEPLOY_DB', dbUrl, envFile)
  updateEnvVariable(cwd, 'BETTER_AUTH_SECRET', authSecret, envFile)
  updateEnvVariable(cwd, 'BETTER_AUTH_URL', domain, envFile)
  updateEnvVariable(cwd, 'ONE_SERVER_URL', domain, envFile)
  // extract hostname from URL (remove protocol)
  const zeroHost = zeroUrl.replace(/^https?:\/\//, '')
  const webHost = domain.replace(/^https?:\/\//, '')
  updateEnvVariable(cwd, 'VITE_ZERO_HOSTNAME', zeroHost, envFile)
  updateEnvVariable(cwd, 'VITE_WEB_HOSTNAME', webHost, envFile)

  // derive zero database URLs from the main database URL
  const dbBase = dbUrl.split('/').slice(0, -1).join('/')
  const zeroCvrDb = `${dbBase}/zero_cvr`
  const zeroChangeDb = `${dbBase}/zero_cdb`

  // set zero database vars in .env.production (for production deployment)
  updateEnvVariable(cwd, 'ZERO_UPSTREAM_DB', dbUrl, envFile)
  updateEnvVariable(cwd, 'ZERO_CVR_DB', zeroCvrDb, envFile)
  updateEnvVariable(cwd, 'ZERO_CHANGE_DB', zeroChangeDb, envFile)

  // also set in .env for local dev
  updateEnvVariable(cwd, 'ZERO_UPSTREAM_DB', dbUrl, '.env')
  updateEnvVariable(cwd, 'ZERO_CVR_DB', zeroCvrDb, '.env')
  updateEnvVariable(cwd, 'ZERO_CHANGE_DB', zeroChangeDb, '.env')

  // Extract host from domain URL and save for deployment
  const deployHost = new URL(domain).hostname
  updateEnvVariable(cwd, 'DEPLOY_HOST', deployHost, envFile)
  updateEnvVariable(cwd, 'DEPLOY_USER', 'root', envFile)

  // SSH key setup
  console.info()
  showInfo('SSH Key Configuration')
  console.info(pc.gray('Deployment requires SSH access to your server'))
  console.info()

  const sshKeyPath = await promptText(
    'Path to SSH private key:',
    `${homedir()}/.ssh/id_rsa`,
    `${homedir()}/.ssh/id_rsa`
  )

  if (sshKeyPath) {
    // verify the key exists
    if (existsSync(sshKeyPath)) {
      updateEnvVariable(cwd, 'DEPLOY_SSH_KEY', sshKeyPath, envFile)
      showSuccess(`✓ SSH key configured: ${sshKeyPath}`)
      console.info()
      showInfo(
        pc.gray(
          "For CI/CD, you'll need to add the SSH private key content as a GitHub secret"
        )
      )
      showInfo(pc.gray('The sync script will help with this'))
    } else {
      showWarning(`SSH key not found at: ${sshKeyPath}`)
      showInfo('You can add DEPLOY_SSH_KEY to .env.production manually later')
    }
  }

  console.info()
  showSuccess(`✓ Saved configuration to ${envFile}`)

  // Custom domain setup (optional)
  console.info()
  showInfo('Custom Domain Setup (Optional)')
  console.info(pc.gray('By default, your app will use:'))
  console.info(pc.gray(`  ${deployHost} (cluster subdomain from Uncloud DNS)`))
  console.info()
  console.info(
    pc.gray('You can optionally configure custom domains (e.g., app.yourdomain.com) by:')
  )
  console.info(pc.gray('  1. Adding CNAME records in your DNS provider'))
  console.info(pc.gray(`  2. Pointing to your cluster subdomain`))
  console.info(
    pc.gray('  3. Setting VITE_WEB_HOSTNAME and VITE_ZERO_HOSTNAME in .env.production')
  )
  console.info()

  const configureCustomDomain = await confirmContinue(
    'Configure custom domain now?',
    false
  )

  if (configureCustomDomain) {
    console.info()
    console.info(pc.gray('First, run: uc dns reserve'))
    console.info(pc.gray('This will give you a cluster subdomain like: abc123.uncld.dev'))
    console.info()

    const clusterSubdomain = await promptText(
      'Enter your cluster subdomain from uc dns show:',
      '',
      ''
    )

    if (clusterSubdomain) {
      console.info()
      showInfo('DNS Setup Instructions:')
      console.info(
        pc.gray('Add these CNAME records in your DNS provider (e.g., Cloudflare):')
      )
      console.info()

      const webDomain = await promptText(
        'Custom domain for web app (e.g., app.yourdomain.com):',
        '',
        ''
      )

      const zeroDomain = await promptText(
        'Custom domain for zero sync (e.g., zero.yourdomain.com):',
        '',
        ''
      )

      if (webDomain) {
        console.info()
        console.info(pc.cyan(`  CNAME: ${webDomain} → ${clusterSubdomain}`))
        if (zeroDomain) {
          console.info(pc.cyan(`  CNAME: ${zeroDomain} → ${clusterSubdomain}`))
        }
        console.info()
        console.info(pc.yellow('⚠️  Set DNS to "DNS only" mode (gray cloud), not proxied'))
        console.info()

        const webUrl = `https://${webDomain}`
        updateEnvVariable(cwd, 'VITE_WEB_HOSTNAME', webDomain, envFile)
        updateEnvVariable(cwd, 'BETTER_AUTH_URL', webUrl, envFile)
        updateEnvVariable(cwd, 'ONE_SERVER_URL', webUrl, envFile)

        if (zeroDomain) {
          updateEnvVariable(cwd, 'VITE_ZERO_HOSTNAME', zeroDomain, envFile)
        }

        showSuccess('✓ Custom domains configured')
        console.info()
        showInfo(pc.gray('DNS propagation typically takes 5-30 minutes'))

        // offer cloudflare origin ca option
        console.info()
        showInfo('SSL Certificate Options')
        console.info(
          pc.gray("By default, Caddy will use Let's Encrypt for SSL certificates.")
        )
        console.info(pc.gray('If using Cloudflare, you can use Origin CA instead to:'))
        console.info(pc.gray("  • Bypass Let's Encrypt rate limits"))
        console.info(pc.gray('  • Enable Cloudflare proxy (DDoS protection, caching)'))
        console.info()

        const useOriginCA = await confirmContinue(
          'Use Cloudflare Origin CA? (requires Cloudflare account)',
          false
        )

        if (useOriginCA) {
          console.info()
          showInfo('Cloudflare Origin CA Setup')
          console.info(pc.gray('1. Go to Cloudflare Dashboard → SSL/TLS → Origin Server'))
          console.info(pc.gray('2. Click "Create Certificate"'))
          console.info(
            pc.gray(
              `3. Add hostnames: ${webDomain}${zeroDomain ? `, ${zeroDomain}` : ''}`
            )
          )
          console.info(pc.gray('4. Choose 15 year validity'))
          console.info(pc.gray('5. Save certificate to: certs/origin.pem'))
          console.info(pc.gray('6. Save private key to: certs/origin.key'))
          console.info()

          const certPath = await promptText(
            'Path to Origin CA certificate:',
            'certs/origin.pem',
            'certs/origin.pem'
          )

          const keyPath = await promptText(
            'Path to Origin CA private key:',
            'certs/origin.key',
            'certs/origin.key'
          )

          if (certPath && keyPath) {
            updateEnvVariable(cwd, 'ORIGIN_CA_CERT', certPath, envFile)
            updateEnvVariable(cwd, 'ORIGIN_CA_KEY', keyPath, envFile)

            showSuccess('✓ Origin CA configured')
            console.info(pc.gray('  Caddyfile will be auto-generated during deploy'))
            console.info()
            console.info(pc.yellow('Important: In Cloudflare Dashboard:'))
            console.info(pc.yellow('  1. Enable proxy (orange cloud) for your domains'))
            console.info(pc.yellow('  2. Set SSL mode to "Full (strict)"'))
          }
        }
      }
    }
  }

  // update package.json env section to remove sst-specific vars
  console.info()
  showInfo('Updating package.json env section for Uncloud deployment...')
  const envUpdateResult = updatePackageJsonEnv(cwd, 'uncloud')
  if (envUpdateResult.success) {
    showSuccess('✓ Removed SST-specific environment variables from package.json')
  } else {
    showWarning(`Failed to update package.json env: ${envUpdateResult.error}`)
  }

  // run env:update to sync to GitHub workflow
  console.info()
  showInfo('Updating GitHub workflow with environment variables...')
  try {
    execSync('bun env:update', { cwd, stdio: 'ignore' })
    showSuccess('✓ GitHub workflow updated')
  } catch (error) {
    showWarning('Failed to update GitHub workflow (non-critical)')
  }

  // offer to sync to github
  console.info()
  const syncToGitHub = await confirmContinue(
    'Sync environment to GitHub secrets for CI/CD?',
    true
  )

  if (syncToGitHub) {
    try {
      execSync('bun scripts/env/sync-to-github.ts --yes', { cwd, stdio: 'inherit' })
    } catch (error) {
      showWarning('Failed to sync to GitHub (you can do this later)')
      showInfo('Run manually: bun scripts/env/sync-to-github.ts')
    }
  } else {
    showInfo('You can sync later with: bun scripts/env/sync-to-github.ts')
  }

  // Next steps
  console.info()
  showStep('Ready to deploy!')
  console.info()
  console.info(pc.bold('Next steps:'))
  console.info()
  console.info(pc.cyan('1. Install Uncloud CLI (if not already installed):'))
  console.info(pc.gray('   npm install -g uncloud-cli'))
  console.info()
  console.info(pc.cyan('2. Login to Uncloud:'))
  console.info(pc.gray('   uncloud login'))
  console.info()
  console.info(pc.cyan('3. Deploy your app:'))
  console.info(pc.gray('   bun tko uncloud deploy-prod'))
  console.info()
  console.info(pc.cyan('Or push to main branch for automatic CI/CD deployment:'))
  console.info(pc.gray('   git push origin main'))
  console.info()
  console.info(pc.bold('scaling to multiple machines:'))
  console.info(pc.gray('   uc machine add --name server-2 root@IP'))
  console.info(pc.gray('   uc scale web 3    # run 3 instances'))
  console.info()
  console.info(pc.gray('view detailed guide: bun tko docs read deployment-uncloud'))
  console.info(pc.gray('or see: docs/deployment-uncloud.md'))
}

async function setupSSTDeployment(cwd: string): Promise<void> {
  showInfo('Setting up AWS SST deployment')
  console.info()
  showWarning('AWS setup takes approximately 30 minutes')
  console.info()
  console.info(
    pc.gray(
      'SST provides:\n  • AWS infrastructure (ECS, Aurora, ALB)\n  • Auto-scaling\n  • Full control over resources\n  • Higher setup complexity'
    )
  )
  console.info()

  // ask about architecture (ARM is cheaper for AWS)
  console.info()
  showInfo('AWS ECS Architecture')
  console.info(pc.gray('AWS Graviton (ARM64) is ~40% cheaper than x86_64'))
  console.info(
    pc.gray('Both have excellent performance, ARM recommended for cost savings')
  )
  console.info()

  const architecture = await promptSelect<'amd64' | 'arm64'>(
    'What CPU architecture for AWS ECS?',
    [
      {
        value: 'arm64',
        label: 'ARM64 (Graviton) - Recommended',
        hint: 'Significantly cheaper, excellent performance',
      },
      {
        value: 'amd64',
        label: 'AMD64/x86_64 (Intel/AMD)',
        hint: 'Standard option if you need specific x86 dependencies',
      },
    ]
  )

  if (architecture === 'cancel') {
    showInfo('Skipping AWS setup')
    return
  }

  const deploymentArch = architecture === 'arm64' ? 'linux/arm64' : 'linux/amd64'
  console.info()
  showInfo(`Will build Docker images for: ${deploymentArch}`)
  console.info()

  const shouldContinue = await confirmContinue(
    'Continue with AWS SST setup? (requires AWS account)',
    false
  )

  if (!shouldContinue) {
    showInfo('Skipping AWS setup')
    showInfo('You can set up AWS later with: bun tko env:setup --category aws')
    return
  }

  // Run the existing production env setup with AWS category
  await setupProductionEnv(cwd, {
    onlyCategory: 'aws',
    envFile: '.env.production',
    interactive: true,
  })

  // Save deployment platform
  const envFile = '.env.production'
  updateEnvVariable(cwd, 'DEPLOYMENT_PLATFORM', 'sst', envFile)
  updateEnvVariable(cwd, 'DEPLOYMENT_ARCH', deploymentArch, envFile)

  // update sst.config.ts architecture
  console.info()
  showInfo('Updating sst.config.ts architecture...')
  try {
    const sstConfigPath = resolve(cwd, 'sst.config.ts')
    let sstConfig = readFileSync(sstConfigPath, 'utf-8')

    // replace architecture in all services
    const archValue = architecture === 'arm64' ? 'arm64' : 'x86_64'
    sstConfig = sstConfig.replace(
      /architecture:\s*['"]arm64['"]/g,
      `architecture: '${archValue}'`
    )
    sstConfig = sstConfig.replace(
      /architecture:\s*['"]x86_64['"]/g,
      `architecture: '${archValue}'`
    )

    writeFileSync(sstConfigPath, sstConfig)
    showSuccess(`✓ Updated sst.config.ts to use ${archValue}`)
  } catch (error) {
    showWarning('Could not update sst.config.ts (you can update manually)')
  }

  // update package.json env section to remove uncloud-specific vars
  console.info()
  showInfo('Updating package.json env section for SST deployment...')
  const envUpdateResult = updatePackageJsonEnv(cwd, 'sst')
  if (envUpdateResult.success) {
    showSuccess('✓ Removed Uncloud-specific environment variables from package.json')
  } else {
    showWarning(`Failed to update package.json env: ${envUpdateResult.error}`)
  }

  // run env:update to sync to GitHub workflow
  console.info()
  showInfo('Updating GitHub workflow with environment variables...')
  try {
    execSync('bun env:update', { cwd, stdio: 'ignore' })
    showSuccess('✓ GitHub workflow updated')
  } catch (error) {
    showWarning('Failed to update GitHub workflow (non-critical)')
  }

  // offer to sync to github
  console.info()
  const syncToGitHub = await confirmContinue(
    'Sync environment to GitHub secrets for CI/CD?',
    true
  )

  if (syncToGitHub) {
    try {
      execSync('bun scripts/env/sync-to-github.ts --yes', { cwd, stdio: 'inherit' })
    } catch (error) {
      showWarning('Failed to sync to GitHub (you can do this later)')
      showInfo('Run manually: bun scripts/env/sync-to-github.ts')
    }
  } else {
    showInfo('You can sync later with: bun scripts/env/sync-to-github.ts')
  }

  console.info()
  showInfo(
    'For complete AWS deployment guide, see: https://docs.yourapp.com/deployment/sst'
  )
}

async function configureCIRunners(cwd: string): Promise<void> {
  showInfo('GitHub Actions CI/CD Runner Configuration')
  console.info()
  console.info(
    pc.gray(
      'Your project uses ARM64 (Apple Silicon) architecture for Docker builds.\n' +
        'GitHub Actions requires compatible runners for CI/CD to work properly.'
    )
  )
  console.info()

  const runnerChoice = await promptSelect<'warp' | 'github-arm' | 'github-x64' | 'skip'>(
    'Choose your CI runner configuration:',
    [
      {
        value: 'warp',
        label: 'Warp Runners (Recommended)',
        hint: 'Fast ARM64 runners, cheaper than GitHub ($0.005/min)',
      },
      {
        value: 'github-arm',
        label: 'GitHub ARM Runners',
        hint: 'Native ARM64, requires GitHub Teams/Enterprise ($0.16/min)',
      },
      {
        value: 'github-x64',
        label: 'GitHub x64 Runners (Free)',
        hint: 'Requires changing Docker builds to x64 architecture',
      },
      {
        value: 'skip',
        label: 'Configure Later',
        hint: 'Skip for now (CI will fail until configured)',
      },
    ]
  )

  if (runnerChoice === 'cancel' || runnerChoice === 'skip') {
    showInfo('Skipping CI runner configuration')
    showWarning(
      'CI/CD will fail until you configure runners. Update .github/workflows/ci.yml'
    )
    return
  }

  const ciConfigPath = resolve(cwd, '.github/workflows/ci.yml')
  const dockerBuildPath = resolve(cwd, 'scripts/web/build-docker.ts')

  try {
    let ciContent = readFileSync(ciConfigPath, 'utf-8')
    let dockerContent = readFileSync(dockerBuildPath, 'utf-8')

    if (runnerChoice === 'warp') {
      console.info()
      showStep('Setting up Warp runners')
      console.info()
      console.info(pc.cyan('1. Sign up for Warp Build (if not already):'))
      console.info(pc.gray('   https://www.warpbuild.com'))
      console.info()
      console.info(pc.cyan('2. Install Warp GitHub App:'))
      console.info(pc.gray('   https://github.com/apps/warp-build'))
      console.info()
      console.info(pc.cyan('3. Grant access to your repository'))
      console.info()

      // CI config is already set for Warp, just confirm
      showSuccess('✓ CI configuration already set for Warp runners')
      showInfo('Warp uses ARM64 runners matching your local architecture')
    } else if (runnerChoice === 'github-arm') {
      // Update CI to use GitHub ARM runners
      ciContent = ciContent.replace(
        /runs-on:.*warp-ubuntu-latest-arm64.*/,
        'runs-on: ubuntu-24.04-arm'
      )
      writeFileSync(ciConfigPath, ciContent)

      console.info()
      showSuccess('✓ Updated CI to use GitHub ARM runners')
      showWarning('Note: GitHub ARM runners require Teams or Enterprise plan')
      showInfo('Pricing: $0.16/minute for ARM runners')
    } else if (runnerChoice === 'github-x64') {
      // Update CI to use standard GitHub runners
      ciContent = ciContent.replace(
        /runs-on:.*warp-ubuntu-latest-arm64.*/,
        'runs-on: ubuntu-latest'
      )
      writeFileSync(ciConfigPath, ciContent)

      // Update Docker build script to use x64
      dockerContent = dockerContent.replace('linux/arm64', 'linux/amd64')
      writeFileSync(dockerBuildPath, dockerContent)

      console.info()
      showSuccess('✓ Updated CI to use free GitHub x64 runners')
      showSuccess('✓ Updated Docker builds to x64 architecture')
      showWarning(
        "Note: Docker images built on x64 won't run on ARM64 machines without emulation"
      )
    }

    console.info()
    showInfo('CI runner configuration complete')
  } catch (error) {
    showError('Failed to update CI configuration')
    showInfo(
      'Please manually update .github/workflows/ci.yml and scripts/web/build-docker.ts'
    )
  }
}

async function startServices(cwd: string): Promise<void> {
  const spinner = showSpinner('Starting Docker services...')

  try {
    // Start services in background
    execSync('bun backend', {
      stdio: 'ignore',
      cwd,
    })

    // Wait a bit for services to start
    await new Promise((resolve) => setTimeout(resolve, 3000))

    spinner.stop('Docker services started')
    showSuccess('✓ PostgreSQL running on port 5432')
    showSuccess('✓ Zero sync running on port 4848')
    showSuccess('✓ MinIO (S3) running on port 9090')

    // Run migrations
    const shouldMigrate = await confirmContinue('Run database migrations?', true)

    if (shouldMigrate) {
      const migrateSpinner = showSpinner('Running migrations...')
      try {
        execSync('bun migrate', { stdio: 'ignore', cwd })
        migrateSpinner.stop('Database migrated')
        showSuccess('✓ Database migrations complete')
      } catch {
        migrateSpinner.stop('Migration failed')
        showError('Failed to run migrations')
        showInfo("Try running 'bun migrate' manually")
      }
    }
  } catch (error) {
    spinner.stop('Failed to start services')
    showError(error instanceof Error ? error.message : 'Unknown error')
    showInfo("Try running 'bun backend' manually")
  }
}

/**
 * Replace port throughout project files (cross-platform)
 */
async function replacePortInProject(
  cwd: string,
  oldPort: string,
  newPort: string
): Promise<void> {
  const spinner = showSpinner(
    `Replacing port ${oldPort} with ${newPort} throughout project...`
  )

  // directories to skip
  const excludeDirs = new Set([
    'node_modules',
    '.git',
    'dist',
    'build',
    '.next',
    '.turbo',
    'types',
  ])

  // file extensions to process
  const includeExts = new Set([
    '.ts',
    '.tsx',
    '.js',
    '.jsx',
    '.json',
    '.md',
    '.yml',
    '.yaml',
  ])

  // recursively find and replace in files
  async function processDir(dir: string): Promise<void> {
    const { readdirSync, statSync } = await import('node:fs')
    const { join, extname, basename } = await import('node:path')

    const entries = readdirSync(dir)

    for (const entry of entries) {
      const fullPath = join(dir, entry)

      try {
        const stat = statSync(fullPath)

        if (stat.isDirectory()) {
          if (!excludeDirs.has(entry)) {
            await processDir(fullPath)
          }
        } else if (stat.isFile()) {
          const ext = extname(entry)
          const name = basename(entry)
          // check extension or .env* pattern
          if (includeExts.has(ext) || name.startsWith('.env')) {
            const content = readFileSync(fullPath, 'utf-8')
            if (content.includes(oldPort)) {
              const newContent = content.split(oldPort).join(newPort)
              writeFileSync(fullPath, newContent, 'utf-8')
            }
          }
        }
      } catch {
        // skip files we can't read
      }
    }
  }

  try {
    await processDir(cwd)
    spinner.stop(`Port updated from ${oldPort} to ${newPort}`)
  } catch (error) {
    spinner.stop('Port replacement failed')
    showError('Failed to replace port. You may need to update manually.')
    throw error
  }
}

// State management helpers
interface OnboardState {
  step: 'prerequisites' | 'identity' | 'ports' | 'eject' | 'ci-runners' | 'production'
  platform?: 'uncloud' | 'sst'
  timestamp: number
}

function getStatePath(cwd: string): string {
  return resolve(cwd, 'node_modules/.takeout/onboard-state.json')
}

function saveOnboardState(cwd: string, state: OnboardState): void {
  const statePath = getStatePath(cwd)
  const stateDir = resolve(cwd, 'node_modules/.takeout')

  if (!existsSync(stateDir)) {
    mkdirSync(stateDir, { recursive: true })
  }

  writeFileSync(statePath, JSON.stringify(state, null, 2))
}

function loadOnboardState(cwd: string): OnboardState | null {
  const statePath = getStatePath(cwd)

  if (!existsSync(statePath)) {
    return null
  }

  try {
    const content = readFileSync(statePath, 'utf-8')
    return JSON.parse(content)
  } catch {
    return null
  }
}

function clearOnboardState(cwd: string): void {
  const statePath = getStatePath(cwd)

  if (existsSync(statePath)) {
    try {
      unlinkSync(statePath)
    } catch {
      // ignore errors
    }
  }
}
