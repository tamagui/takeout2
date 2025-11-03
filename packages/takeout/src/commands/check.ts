/**
 * Check command - verify prerequisites (for postinstall)
 */

import { defineCommand } from 'citty'
import { checkOnboarded } from '../utils/files'
import { checkAllPrerequisites, hasRequiredPrerequisites } from '../utils/prerequisites'
import { displayPrerequisites, displayWelcome, showInfo } from '../utils/prompts'

export const checkCommand = defineCommand({
  meta: {
    name: 'check',
    description: 'Check prerequisites and project setup status',
  },
  args: {
    silent: {
      type: 'boolean',
      description: 'Run silently (no output)',
      default: false,
    },
  },
  async run({ args }) {
    const cwd = process.cwd()

    // Skip if in CI
    if (process.env.CI === 'true') {
      return
    }

    // Silent mode for non-interactive environments
    if (args.silent) {
      return
    }

    // Check if already onboarded
    const isOnboarded = checkOnboarded(cwd)

    if (isOnboarded) {
      // Already set up, just exit
      return
    }

    // First time setup - show welcome message
    displayWelcome()

    const checks = checkAllPrerequisites()
    const hasRequired = hasRequiredPrerequisites(checks)

    displayPrerequisites(checks)

    console.info()

    if (hasRequired) {
      showInfo("Ready to get started! Run 'bun onboard' for guided setup, or:")
      console.info()
      console.info('  bun backend  # Start services (Docker)')
      console.info('  bun migrate  # Run DB migrations')
      console.info('  bun dev      # Start development')
      console.info()
      console.info('Documentation: /docs')
    } else {
      showInfo("Some prerequisites are missing. Run 'bun onboard' for guided setup.")
    }

    console.info()
  },
})
