#!/usr/bin/env node
import { resolve } from 'node:path'

import { defineCommand, runMain } from 'citty'

import { generate, watch } from './generate'

const generateCommand = defineCommand({
  meta: {
    name: 'generate',
    description: 'Generate models, types, tables, and query validators',
  },
  args: {
    dir: {
      type: 'positional',
      description: 'Base directory (defaults to src/data)',
      required: false,
      default: 'src/data',
    },
    watch: {
      type: 'boolean',
      description: 'Watch for changes and regenerate',
      required: false,
      default: false,
    },
    after: {
      type: 'string',
      description: 'Command to run after generation completes',
      required: false,
    },
  },

  async run({ args }) {
    const opts = { dir: resolve(args.dir), after: args.after }

    if (args.watch) {
      await watch(opts)
      await new Promise(() => {})
    } else {
      await generate(opts)
    }
  },
})

const main = defineCommand({
  meta: {
    name: 'on-zero',
    description: 'on-zero CLI tools',
  },
  subCommands: {
    generate: generateCommand,
  },
})

runMain(main)
