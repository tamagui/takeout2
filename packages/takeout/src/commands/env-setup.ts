import { defineCommand } from 'citty'
import pc from 'picocolors'

import { setupProductionEnv, listCategories } from '../utils/env-setup'

export const envSetupCommand = defineCommand({
  meta: {
    name: 'env:setup',
    description: 'Configure production environment variables',
  },
  args: {
    category: {
      type: 'string',
      description: 'Setup only a specific category (e.g., aws, apple, storage)',
      alias: 'c',
    },
    file: {
      type: 'string',
      description: 'Environment file to update',
      default: '.env.production',
      alias: 'f',
    },
    list: {
      type: 'boolean',
      description: 'List all available categories',
      alias: 'l',
      default: false,
    },
    'skip-optional': {
      type: 'boolean',
      description: 'Skip optional categories',
      default: false,
    },
  },
  async run({ args }) {
    try {
      const cwd = process.cwd()

      // list categories if requested
      if (args.list) {
        listCategories()
        return
      }

      console.info('')
      console.info(pc.bold('🚀 Takeout Production Environment Setup'))
      console.info(pc.gray('Configure your production deployment settings'))
      console.info('')

      const success = await setupProductionEnv(cwd, {
        skipOptional: args['skip-optional'],
        envFile: args.file,
        onlyCategory: args.category,
        interactive: true,
      })

      if (!success) {
        console.info(pc.yellow('\n⚠ Environment setup was cancelled'))
        console.info(pc.gray('You can resume anytime with:'))
        console.info(pc.cyan('  bun takeout env:setup'))
        process.exit(1)
      }
    } catch (error) {
      console.error(pc.red('\n✖ Environment setup failed:'))
      console.error(error)
      process.exit(1)
    }
  },
})
