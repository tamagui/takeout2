/**
 * Onboard command - interactive setup for Takeout starter kit
 */

import { defineCommand } from 'citty'
import { execSync } from 'node:child_process'
import { randomBytes } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
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
  promptSelect,
  promptStartStep,
  showError,
  showInfo,
  showSpinner,
  showStep,
  showSuccess,
  showWarning,
} from '../utils/prompts'
import pc from 'picocolors'

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

    // Phase 0: Check for saved state
    displayWelcome()

    const savedState = loadOnboardState(cwd)
    let startStep:
      | 'full'
      | 'prerequisites'
      | 'environment'
      | 'identity'
      | 'ports'
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

    // Phase 2: Environment Setup
    if (
      startStep === 'prerequisites' ||
      startStep === 'environment' ||
      startStep === 'full'
    ) {
      saveOnboardState(cwd, { step: 'environment', timestamp: Date.now() })
      showStep('Setting up environment files...')
      console.info()

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
    }

    // Phase 3: Project Identity
    if (
      startStep === 'prerequisites' ||
      startStep === 'environment' ||
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

    // Phase 4: Port Check
    if (
      startStep === 'prerequisites' ||
      startStep === 'environment' ||
      startStep === 'identity' ||
      startStep === 'ports' ||
      startStep === 'full'
    ) {
      saveOnboardState(cwd, { step: 'ports', timestamp: Date.now() })
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

    // Phase 5: Development Complete
    if (startStep !== 'production') {
      showStep('Development setup complete!')
      console.info()

      showSuccess('✓ Environment configured')
      showSuccess('✓ Project ready for development')

      markOnboarded(cwd)

      console.info()
      showInfo('Next steps:')
      console.info()
      console.info('  bun dev            # Start development server')
      console.info('  bun ios            # Build iOS dev app')
      console.info('  bun android        # Build Android dev app')
      console.info('  takeout docs list  # View Takeout docs')
      console.info()
    }

    // Phase 6: Production Setup (Optional or direct)
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
      'Uncloud provides:\n  • Managed PostgreSQL with logical replication\n  • Free subdomain (your-app.uncloud.run)\n  • Automatic SSL certificates\n  • Easy scaling'
    )
  )
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

  if (useFreeSubdomain) {
    const appName = await promptText(
      'App name for subdomain:',
      defaultAppName,
      defaultAppName
    )
    domain = `https://${appName}.uncloud.run`
    zeroUrl = `https://zero-${appName}.uncloud.run`
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
    console.info(pc.gray('See: https://uncloud.run/docs/domains'))
  }

  console.info()

  // Database setup
  showInfo('Database configuration')
  console.info()
  console.info(pc.gray('PostgreSQL database with logical replication enabled'))
  console.info(
    pc.gray('Zero will use 3 databases on the same host: main, zero_cvr, zero_cdb')
  )
  console.info()

  const dbUser = await promptText('Database username:', undefined, 'postgres')
  const dbPassword = await promptText('Database password:', undefined, '')
  const dbHost = await promptText('Database host:', undefined, 'localhost')
  const dbPort = await promptText('Database port:', '5432', '5432')
  const dbName = await promptText('Main database name:', 'postgres', 'postgres')

  // Construct database URLs
  const dbUrl = `postgresql://${dbUser}:${dbPassword}@${dbHost}:${dbPort}/${dbName}`
  const cvrDb = `postgresql://${dbUser}:${dbPassword}@${dbHost}:${dbPort}/zero_cvr`
  const changeDb = `postgresql://${dbUser}:${dbPassword}@${dbHost}:${dbPort}/zero_cdb`

  // Generate auth secret
  console.info()
  const authSecret = randomBytes(32).toString('hex')

  // Save to .env.production
  const envFile = '.env.production'
  updateEnvVariable(cwd, 'DEPLOYMENT_PLATFORM', 'uncloud', envFile)
  updateEnvVariable(cwd, 'BETTER_AUTH_SECRET', authSecret, envFile)
  updateEnvVariable(cwd, 'BETTER_AUTH_URL', domain, envFile)
  updateEnvVariable(cwd, 'ONE_SERVER_URL', domain, envFile)
  updateEnvVariable(cwd, 'VITE_PUBLIC_ZERO_SERVER', zeroUrl, envFile)
  updateEnvVariable(cwd, 'ZERO_UPSTREAM_DB', dbUrl, envFile)
  updateEnvVariable(cwd, 'ZERO_CVR_DB', cvrDb, envFile)
  updateEnvVariable(cwd, 'ZERO_CHANGE_DB', changeDb, envFile)

  // Extract host from domain URL and save for deployment
  const deployHost = new URL(domain).hostname
  updateEnvVariable(cwd, 'DEPLOY_HOST', deployHost, envFile)
  updateEnvVariable(cwd, 'DEPLOY_USER', 'root', envFile)

  console.info()
  showSuccess(`✓ Saved configuration to ${envFile}`)

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
  console.info(pc.gray('   bun tko uncloud deploy'))
  console.info()
  console.info(
    pc.gray(
      'For detailed deployment guide, see: https://docs.yourapp.com/deployment/uncloud'
    )
  )
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

  console.info()
  showInfo(
    'For complete AWS deployment guide, see: https://docs.yourapp.com/deployment/sst'
  )
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

// State management helpers
interface OnboardState {
  step: 'prerequisites' | 'environment' | 'identity' | 'ports' | 'production'
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
