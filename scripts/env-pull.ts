#!/usr/bin/env bun

import { existsSync, writeFileSync } from 'node:fs'
import * as path from 'node:path'
import { getEnvironment } from './sst-get-environment'

const rootDir = path.resolve(__dirname, '..')

const envFilePath = path.join(rootDir, '.env.production')
if (existsSync(envFilePath)) {
  console.error(
    '❌ Error: .env.production already exists. Please remove or rename it first.'
  )
  process.exit(1)
}

const packageJson = require(path.join(rootDir, 'package.json'))
const envVarsNeeded = packageJson.env ? Object.keys(packageJson.env) : []
if (!envVarsNeeded.length) {
  console.error(
    `❌ Error: No environment variables specified in package.json 'env' array.`
  )
  process.exit(1)
}

try {
  const envVars = getEnvironment('WebApp')

  let envFileContent = ''
  let foundCount = 0

  for (const varName of envVarsNeeded) {
    if (envVars[varName] !== undefined) {
      envFileContent += `${varName}=${envVars[varName]}\n`
      foundCount++
    } else {
      console.warn(`⚠️  Warning: Didn't find env: ${varName}`)
    }
  }

  if (foundCount === 0) {
    console.error(`❌ Error: None of the required environment variables were found.`)
    process.exit(1)
  }

  writeFileSync(envFilePath, envFileContent)

  console.info(
    `✅ Success! ${foundCount} environment variables written to .env.production`
  )
} catch (error) {
  console.error('❌ Error fetching environment variables:', error)
  process.exit(1)
}
