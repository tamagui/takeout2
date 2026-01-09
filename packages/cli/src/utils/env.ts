/**
 * Environment file operations
 */

import { randomBytes } from 'node:crypto'
import { copyFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

export function generateSecret(length = 32): string {
  return randomBytes(length).toString('hex')
}

export function envFileExists(cwd: string, filename = '.env'): boolean {
  return existsSync(join(cwd, filename))
}

export function copyEnvFile(
  cwd: string,
  source: string,
  target: string
): { success: boolean; error?: string } {
  const sourcePath = join(cwd, source)
  const targetPath = join(cwd, target)

  if (!existsSync(sourcePath)) {
    return { success: false, error: `Source file ${source} not found` }
  }

  if (existsSync(targetPath)) {
    return { success: false, error: `Target file ${target} already exists` }
  }

  try {
    copyFileSync(sourcePath, targetPath)
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

export function updateEnvVariable(
  cwd: string,
  key: string,
  value: string,
  filename = '.env'
): { success: boolean; error?: string } {
  const envPath = join(cwd, filename)

  if (!existsSync(envPath)) {
    return { success: false, error: `${filename} not found` }
  }

  try {
    let content = readFileSync(envPath, 'utf-8')

    // Check if key exists
    const keyRegex = new RegExp(`^${key}=.*$`, 'm')

    if (keyRegex.test(content)) {
      // Replace existing value
      content = content.replace(keyRegex, `${key}=${value}`)
    } else {
      // Append new key-value
      content = content.trimEnd() + `\n${key}=${value}\n`
    }

    writeFileSync(envPath, content, 'utf-8')
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

export function createEnvLocal(cwd: string): { success: boolean; error?: string } {
  const envLocalPath = join(cwd, '.env.local')

  if (existsSync(envLocalPath)) {
    return { success: true } // Already exists, that's fine
  }

  const template = `# Local environment overrides
# This file is gitignored and never committed
# Add your personal secrets and local configuration here
# These values override .env

# Example:
# BETTER_AUTH_SECRET=your-secret-here
# AWS_ACCESS_KEY_ID=your-key-here
`

  try {
    writeFileSync(envLocalPath, template, 'utf-8')
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

export function readEnvVariable(
  cwd: string,
  key: string,
  filename = '.env'
): string | null {
  const envPath = join(cwd, filename)

  if (!existsSync(envPath)) {
    return null
  }

  try {
    const content = readFileSync(envPath, 'utf-8')
    const keyRegex = new RegExp(`^${key}=(.*)$`, 'm')
    const match = content.match(keyRegex)
    return match?.[1]?.trim().replace(/^["']|["']$/g, '') || null
  } catch {
    return null
  }
}
