#!/usr/bin/env node

const command = require.resolve('create-takeout')
const args = process.argv.slice(2)

try {
  require('node:child_process').execSync(`node ${command} ${args.join(' ')}`, {
    stdio: 'inherit',
  })
} catch (err) {
  process.exit(1)
}
