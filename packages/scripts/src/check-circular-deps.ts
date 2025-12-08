#!/usr/bin/env bun

import { basename } from 'node:path'

import { $ } from 'bun'
import { globSync } from 'glob'

const projectRoot = process.cwd()

// parse --ignore flag
const args = process.argv.slice(2)
const ignoreIndex = args.indexOf('--ignore')
const ignoredFiles: string[] = []

if (ignoreIndex !== -1 && args[ignoreIndex + 1]) {
  // split comma-separated files
  const ignoreArg = args[ignoreIndex + 1]
  if (ignoreArg) {
    const ignoreList = ignoreArg.split(',')
    ignoredFiles.push(...ignoreList.map((f) => f.trim()))
  }
}

// glob all tsx files in app directory
const appFiles = globSync('app/**/*.tsx', {
  cwd: projectRoot,
  absolute: true,
})

// glob all tsx files in src directory
const srcFiles = globSync('src/**/*.tsx', {
  cwd: projectRoot,
  absolute: true,
})

// combine all files
const allFiles = [...appFiles, ...srcFiles]

if (allFiles.length === 0) {
  console.error('No tsx files found')
  process.exit(1)
}

// build the command with all -r flags
const commandArgs = [
  'bunx',
  '@glideapps/ts-helper',
  '-c', // check circular dependencies
  '-p',
  projectRoot,
  ...allFiles.flatMap((file) => ['-r', file]),
]

console.info(`Checking circular dependencies for ${allFiles.length} files...`)

try {
  // run the command and capture output
  await $`${commandArgs}`.quiet()
  console.info('✅ No circular dependencies found')
} catch (error: any) {
  // parse the output to check for cycles
  const output = error.stderr?.toString() || error.stdout?.toString() || ''

  // check if this is a tool crash (assertion error) rather than actual cycle detection
  if (output.includes('Assertion failed') || output.includes('at panic')) {
    const nodeVersion = process.versions.node
    const majorVersion = parseInt(nodeVersion.split('.')[0] || '0', 10)
    if (majorVersion >= 24) {
      console.warn(`⚠️ @glideapps/ts-helper crashes on Node.js ${nodeVersion}`)
      console.warn('   skipping locally - CI uses Node 20 where this check runs properly')
      process.exit(0)
    }
    // unknown crash on older node, fail
    console.error(output)
    console.error('❌ Circular dependency check crashed unexpectedly')
    process.exit(1)
  }

  // parse cycle arrays from output
  const cycleRegex = /\[([^\]]+)\]/g
  const cycles: string[][] = []
  let match

  while ((match = cycleRegex.exec(output)) !== null) {
    // parse the cycle array
    const cycleStr = match[1]
    if (cycleStr) {
      const files = cycleStr.split(',').map((f) => f.trim().replace(/"/g, ''))
      cycles.push(files)
    }
  }

  // filter out cycles that contain ignored files
  const remainingCycles = cycles.filter((cycle) => {
    const containsIgnored = cycle.some((file) =>
      ignoredFiles.some((ignored) => basename(file) === ignored || file.includes(ignored))
    )
    return !containsIgnored
  })

  if (remainingCycles.length > 0) {
    // reconstruct output with filtered cycles
    console.info(
      output
        .split('\n')
        .filter((line: string) => !line.startsWith('['))
        .join('\n')
    )
    console.info(`Found ${remainingCycles.length} dependency cycles`)
    remainingCycles.forEach((cycle) => {
      console.info(JSON.stringify(cycle))
    })
    console.error('❌ Circular dependencies detected')
    process.exit(1)
  } else if (cycles.length > 0) {
    // all cycles were ignored
    console.info(
      `✅ Found ${cycles.length} circular dependencies but all contain ignored files`
    )
    if (ignoredFiles.length > 0) {
      console.info(`   Ignored files: ${ignoredFiles.join(', ')}`)
    }
  } else {
    // no cycles found, but command failed for another reason
    console.error(output)
    console.error('❌ Error running circular dependency check')
    process.exit(1)
  }
}
