/**
 * File operations for updating project configuration
 */

import { execSync } from 'node:child_process'
import { existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
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

/**
 * Updates the env section in package.json to remove platform-specific variables
 */
export function updatePackageJsonEnv(
  cwd: string,
  platform: 'sst' | 'uncloud'
): { success: boolean; error?: string } {
  const packagePath = join(cwd, 'package.json')

  if (!existsSync(packagePath)) {
    return { success: false, error: 'package.json not found' }
  }

  try {
    const content = readFileSync(packagePath, 'utf-8')
    const pkg = JSON.parse(content)

    if (!pkg.env) {
      return { success: false, error: 'env section not found in package.json' }
    }

    if (platform === 'sst') {
      // remove uncloud-specific vars, keep sst vars
      delete pkg.env.DEPLOY_HOST
      delete pkg.env.DEPLOY_USER
      delete pkg.env.DEPLOY_SSH_KEY
    } else if (platform === 'uncloud') {
      // remove sst-specific vars, keep uncloud vars
      delete pkg.env.CLOUDFLARE_API_TOKEN
      delete pkg.env.AWS_ACCESS_KEY_ID
      delete pkg.env.AWS_SECRET_ACCESS_KEY
    }

    writeFileSync(packagePath, JSON.stringify(pkg, null, 2) + '\n', 'utf-8')
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Ejects from monorepo setup by removing ./packages and updating workspace:* versions
 */
export async function ejectFromMonorepo(cwd: string): Promise<{
  success: boolean
  error?: string
}> {
  const packagePath = join(cwd, 'package.json')
  const packagesDir = join(cwd, 'packages')

  if (!existsSync(packagePath)) {
    return { success: false, error: 'package.json not found' }
  }

  try {
    // read package.json
    const content = readFileSync(packagePath, 'utf-8')
    const pkg = JSON.parse(content)

    // get the current version from takeout package
    const takeoutPkgPath = join(packagesDir, 'takeout/package.json')
    let latestVersion = '0.0.26' // fallback version

    if (existsSync(takeoutPkgPath)) {
      const takeoutPkg = JSON.parse(readFileSync(takeoutPkgPath, 'utf-8'))
      latestVersion = takeoutPkg.version
    }

    // replace workspace:* with actual version for all @take-out/* packages
    const workspacePackages = [
      '@take-out/better-auth-utils',
      '@take-out/helpers',
      '@take-out/hooks',
      '@take-out/postgres',
      '@take-out/scripts',
      '@take-out/takeout',
    ]

    for (const pkgName of workspacePackages) {
      if (pkg.dependencies?.[pkgName] === 'workspace:*') {
        pkg.dependencies[pkgName] = `^${latestVersion}`
      }
      if (pkg.devDependencies?.[pkgName] === 'workspace:*') {
        pkg.devDependencies[pkgName] = `^${latestVersion}`
      }
    }

    // remove workspaces field
    delete pkg.workspaces

    // write updated package.json
    writeFileSync(packagePath, JSON.stringify(pkg, null, 2) + '\n', 'utf-8')

    // remove packages directory
    if (existsSync(packagesDir)) {
      rmSync(packagesDir, { recursive: true, force: true })
    }

    // install the published packages
    try {
      execSync('bun install', { cwd, stdio: 'inherit' })
    } catch (installError) {
      return {
        success: false,
        error:
          'Failed to install published packages. You may need to run "bun install" manually.',
      }
    }

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
