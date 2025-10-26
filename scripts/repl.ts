#!/usr/bin/env node

import { sleep, throttle } from '@vxrn/helpers'
import { promises as fs } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import repl from 'node:repl'
import { aiActions } from '~/data/server/actions/aiActions'
import { zeroServer } from '~/zero/server'
import { loadEnv } from './helpers/env-load'

// Configure environment based on command line args
const isProduction =
  process.argv.includes('--prod') || process.argv.includes('--production')
const environment = isProduction ? 'production' : 'development'

// Load environment variables
await loadEnv(environment, { optional: [] })

console.info(`🚀 Starting ${environment} REPL...`)

// Setup history file
const historyFile = join(homedir(), `.chat_repl_history${isProduction ? '_prod' : ''}`)

// Create the global helper object
const _ = {
  sleep: sleep,
  timeout: (ms: number) => new Promise((resolve) => setTimeout(resolve, ms)),
  immediate: () => new Promise((resolve) => setImmediate(resolve)),
  throttle,
  log: console.info,
  info: console.info,
  warn: console.warn,
  error: console.error,
  clear: () => {},

  // Database
  zeroServer,

  // adding in our helpers
  summarize: aiActions.summarize,
  llm: aiActions.llm,

  // Environment info
  env: process.env.NODE_ENV,
  isProduction,
  isDevelopment: !isProduction,

  // Quick helpers
  stringify: (obj: any) => JSON.stringify(obj, null, 2),
  parse: (str: string) => JSON.parse(str),
  pretty: (obj: any) => console.info(JSON.stringify(obj, null, 2)),

  // Help function - auto-generated from available properties
  help: function () {
    const helpers = Object.keys(this)
      .filter((key) => key !== 'help')
      .sort()
    console.info('\nAvailable helpers under _:\n')
    helpers.forEach((key) => {
      const value = (this as any)[key]
      const type = typeof value
      if (type === 'function') {
        console.info(`  _.${key}()`)
      } else {
        console.info(`  _.${key} (${type})`)
      }
    })
    console.info('\nType _.help() to see this again.\n')
  },
}

// Custom completer function
const customCompleter = (line: string) => {
  // If line contains '_.' show helper completions
  if (line.includes('_.')) {
    const helperKeys = Object.keys(_).map((key) => `_.${key}`)
    const hits = helperKeys.filter((key) => key.startsWith(line))
    return [hits.length ? hits : helperKeys, line]
  }

  // Default Node.js completion
  const builtinCompletions = [
    'console',
    'process',
    'Buffer',
    'global',
    'require',
    'setTimeout',
    'setInterval',
    'clearTimeout',
    'clearInterval',
    'Math',
    'Date',
    'JSON',
    'Object',
    'Array',
    'String',
    'Number',
  ]
  const hits = builtinCompletions.filter((key) => key.startsWith(line))
  return [hits, line]
}

// Start the REPL
const replServer = repl.start({
  prompt: isProduction ? '🌍 prod> ' : '🛠 dev> ',
  useColors: true,
  useGlobal: false,
  ignoreUndefined: false,
  replMode: repl.REPL_MODE_STRICT,
  breakEvalOnSigint: true,
  preview: true,
  completer: customCompleter,
})

// Add helpers to context
replServer.context._ = _

// Override eval to handle promises automatically
const originalEval = replServer.eval
;(replServer as any).eval = function (
  cmd: string,
  context: any,
  filename: string,
  callback: (err: Error | null, result?: any) => void
) {
  originalEval.call(this, cmd, context, filename, (err: Error | null, result: any) => {
    if (!err && result && typeof result.then === 'function') {
      // if the result is a promise, wait for it and log the resolved value
      result
        .then((resolvedValue: any) => {
          callback(null, resolvedValue)
        })
        .catch((error: Error) => {
          callback(error)
        })
    } else {
      callback(err, result)
    }
  })
}

// Set up history persistence
replServer.setupHistory(historyFile, (err) => {
  if (err) {
    console.warn('Failed to setup history:', err.message)
  }
})

// Enhanced commands
replServer.defineCommand('helpers', {
  help: 'Show available helpers',
  action() {
    this.clearBufferedCommand()
    _.help()
    this.displayPrompt()
  },
})

replServer.defineCommand('env', {
  help: 'Show environment info',
  action() {
    this.clearBufferedCommand()
    console.info(`Environment: ${environment}`)
    console.info(`NODE_ENV: ${process.env.NODE_ENV}`)
    console.info(`Production: ${isProduction}`)
    this.displayPrompt()
  },
})

replServer.defineCommand('load', {
  help: 'Load and execute a JavaScript file',
  action(filename) {
    if (!filename) {
      console.info('Usage: .load <filename>')
      this.displayPrompt()
      return
    }

    this.clearBufferedCommand()

    fs.readFile(filename, 'utf8')
      .then((content) => {
        console.info(`Loading ${filename}...`)
        // Split content by lines and execute each line
        const lines = content.split('\n').filter((line) => line.trim())
        for (const line of lines) {
          if (line.trim()) {
            this.write(`${line}\n`)
          }
        }
      })
      .catch((err) => {
        console.error('Error reading file:', err.message)
      })
      .finally(() => {
        this.displayPrompt()
      })
  },
})

// Welcome message and help (deferred to ensure prompt displays)
setImmediate(() => {
  console.info(`
Welcome to the Chat App REPL!
Environment: ${environment}
Helpers available under: _

Type _.help() to see available utilities
Type .help to see REPL commands
`)

  // Show the help on startup
  _.help()

  // Force prompt display
  replServer.displayPrompt()
})
