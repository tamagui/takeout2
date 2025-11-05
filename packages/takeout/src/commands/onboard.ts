/**
 * Onboard command - interactive setup for Takeout starter kit
 */

import { defineCommand } from 'citty'
import { execSync } from 'node:child_process'
import {
  copyEnvFile,
  createEnvLocal,
  envFileExists,
  generateSecret,
  updateEnvVariable,
} from '../utils/env'
import { setupProductionEnv } from '../utils/env-setup'
import { markOnboarded, updateAppConfig, updatePackageJson } from '../utils/files'
import { checkAllPorts, getConflictingPorts } from '../utils/ports'
import { checkAllPrerequisites, hasRequiredPrerequisites } from '../utils/prerequisites'
import {
  confirmContinue,
  displayOutro,
  displayPortConflicts,
  displayPrerequisites,
  displayWelcome,
  promptText,
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
      description: 'Skip interactive prompts',
      default: false,
    },
  },
  async run({ args }) {
    const cwd = process.cwd()

    if (args.skip) {
      showInfo('Skipping onboarding (--skip flag)')
      return
    }

    // Phase 1: Welcome & Prerequisites
    displayWelcome()
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

    // Phase 2: Environment Setup
    showStep('Setting up environment files...')
    console.info()

    // Check if .env already exists
    const hasEnv = envFileExists(cwd, '.env')

    if (hasEnv) {
      showInfo('.env file already exists')
      const shouldReconfigure = await confirmContinue('Reconfigure environment?', false)

      if (!shouldReconfigure) {
        showInfo('Skipping environment setup')
      } else {
        await setupEnvironment(cwd)
      }
    } else {
      await setupEnvironment(cwd)
    }

    console.info()

    // Phase 3: Project Identity
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

    // Phase 4: Production Environment (Optional)
    showStep('Production environment configuration...')
    console.info()

    // run production env setup but don't fail onboarding if skipped
    await setupProductionEnv(cwd, {
      interactive: true,
      skipOptional: false,
    })

    console.info()

    // Phase 5: Port Check
    showStep('Checking service ports...')
    console.info()

    const portChecks = checkAllPorts()
    const conflicts = getConflictingPorts(portChecks)

    if (conflicts.length > 0) {
      displayPortConflicts(conflicts)
      showWarning('Some ports are already in use. You may need to stop other services.')
    }

    console.info()

    // Phase 6: Next Steps
    showStep('Setup complete!')
    console.info()

    showSuccess('✓ Environment configured')
    showSuccess('✓ Project ready for development')

    // Mark as onboarded
    markOnboarded(cwd)

    console.info()
    showInfo('Next steps:')
    console.info()
    console.info('  bun dev            # Start development server')
    console.info('  bun ios            # Build iOS dev app')
    console.info('  bun android        # Build Android dev app')
    console.info('  takeout docs list  # View Takeout docs')
    console.info()
    console.info()

    displayOutro('Happy coding! 🚀')
  },
})

async function setupEnvironment(cwd: string): Promise<void> {
  // Copy .env.development to .env
  const copyResult = copyEnvFile(cwd, '.env.development', '.env')

  if (!copyResult.success) {
    showError(`Failed to create .env: ${copyResult.error}`)
    return
  }

  showSuccess('Created .env from .env.development')

  // Generate auth secret
  const useExisting = await confirmContinue(
    'Use existing BETTER_AUTH_SECRET from .env.development?',
    true
  )

  if (!useExisting) {
    const secret = generateSecret()
    updateEnvVariable(cwd, 'BETTER_AUTH_SECRET', secret)
    showSuccess('Generated new BETTER_AUTH_SECRET')
  }

  // GitHub OAuth (optional)
  const setupGithub = await confirmContinue('Set up GitHub OAuth?', false)

  if (setupGithub) {
    const clientId = await promptText(
      'GitHub Client ID:',
      undefined,
      'Iv23liNaYfNSauaySodL'
    )
    if (clientId) {
      updateEnvVariable(cwd, 'ONECHAT_GITHUB_CLIENT_ID', clientId)
    }

    const clientSecret = await promptText(
      'GitHub Client Secret (optional):',
      undefined,
      'Leave empty to skip'
    )
    if (clientSecret) {
      updateEnvVariable(cwd, 'ONECHAT_GITHUB_CLIENT_SECRET', clientSecret)
    }
  }

  // Create .env.local
  createEnvLocal(cwd)
  showSuccess('Created .env.local for personal overrides')
}

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
