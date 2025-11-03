/**
 * File operations for updating project configuration
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

export function updatePackageJson(
  cwd: string,
  updates: { name?: string; description?: string }
): { success: boolean; error?: string } {
  const packagePath = join(cwd, 'package.json')

  if (!existsSync(packagePath)) {
    return { success: false, error: 'package.json not found' }
  }

  try {
    const content = readFileSync(packagePath, 'utf-8')
    const pkg = JSON.parse(content)

    if (updates.name) pkg.name = updates.name
    if (updates.description) pkg.description = updates.description

    writeFileSync(packagePath, JSON.stringify(pkg, null, 2) + '\n', 'utf-8')
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

export function updateAppConfig(
  cwd: string,
  updates: { name?: string; slug?: string; bundleId?: string }
): { success: boolean; error?: string } {
  const configPath = join(cwd, 'app.config.ts')

  if (!existsSync(configPath)) {
    return { success: false, error: 'app.config.ts not found' }
  }

  try {
    let content = readFileSync(configPath, 'utf-8')

    if (updates.name) {
      // Update name field
      content = content.replace(/(name:\s*['"])([^'"]+)(['"])/, `$1${updates.name}$3`)
    }

    if (updates.slug) {
      // Update slug field
      content = content.replace(/(slug:\s*['"])([^'"]+)(['"])/, `$1${updates.slug}$3`)
    }

    if (updates.bundleId) {
      // Update iOS bundle identifier
      content = content.replace(
        /(bundleIdentifier:\s*['"])([^'"]+)(['"])/,
        `$1${updates.bundleId}$3`
      )
      // Update Android package
      content = content.replace(
        /(package:\s*['"])([^'"]+)(['"])/,
        `$1${updates.bundleId}$3`
      )
    }

    writeFileSync(configPath, content, 'utf-8')
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

export function checkOnboarded(cwd: string): boolean {
  return existsSync(join(cwd, '.onboarded'))
}

export function markOnboarded(cwd: string): { success: boolean; error?: string } {
  const marker = join(cwd, '.onboarded')

  try {
    const timestamp = new Date().toISOString()
    writeFileSync(
      marker,
      `Onboarded at: ${timestamp}\nRun 'bun onboard' to reconfigure.\n`,
      'utf-8'
    )
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
