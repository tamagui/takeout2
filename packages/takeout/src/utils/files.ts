/**
 * File operations for updating project configuration
 */

import { execSync } from 'node:child_process'
import { existsSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
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
  const packagePath = join(cwd, 'package.json')
  if (!existsSync(packagePath)) return false

  try {
    const pkg = JSON.parse(readFileSync(packagePath, 'utf-8'))
    return pkg.takeout?.onboarded === true
  } catch {
    return false
  }
}

export function markOnboarded(cwd: string): { success: boolean; error?: string } {
  const packagePath = join(cwd, 'package.json')

  if (!existsSync(packagePath)) {
    return { success: false, error: 'package.json not found' }
  }

  try {
    const content = readFileSync(packagePath, 'utf-8')
    const pkg = JSON.parse(content)

    if (!pkg.takeout) {
      pkg.takeout = {}
    }
    pkg.takeout.onboarded = true

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

export interface EjectOptions {
  dryRun?: boolean
}

export interface EjectResult {
  success: boolean
  error?: string
  packages?: { name: string; version: string }[]
  warnings?: string[]
}

/**
 * Ejects from monorepo setup by removing ./packages and updating workspace:* versions
 */
export async function ejectFromMonorepo(
  cwd: string,
  options: EjectOptions = {}
): Promise<EjectResult> {
  const { dryRun = false } = options
  const packagePath = join(cwd, 'package.json')
  const packagesDir = join(cwd, 'packages')
  const warnings: string[] = []

  if (!existsSync(packagePath)) {
    return { success: false, error: 'package.json not found' }
  }

  try {
    // read package.json
    const content = readFileSync(packagePath, 'utf-8')
    const pkg = JSON.parse(content)

    // check if already ejected
    if (!existsSync(packagesDir)) {
      return { success: false, error: 'packages directory not found - already ejected?' }
    }

    if (!pkg.workspaces) {
      return { success: false, error: 'no workspaces field found - already ejected?' }
    }

    // dynamically discover workspace packages from ./packages directory
    const workspacePackages: { name: string; version: string }[] = []

    const entries = readdirSync(packagesDir, { withFileTypes: true })
    for (const entry of entries) {
      if (!entry.isDirectory()) continue
      const pkgJsonPath = join(packagesDir, entry.name, 'package.json')
      if (existsSync(pkgJsonPath)) {
        try {
          const pkgJson = JSON.parse(readFileSync(pkgJsonPath, 'utf-8'))
          if (pkgJson.name && pkgJson.version) {
            workspacePackages.push({ name: pkgJson.name, version: pkgJson.version })
          } else {
            warnings.push(`skipped ${entry.name}: missing name or version`)
          }
        } catch (e) {
          warnings.push(`skipped ${entry.name}: invalid package.json`)
        }
      }
    }

    if (workspacePackages.length === 0) {
      return { success: false, error: 'no valid workspace packages found' }
    }

    // check for workspace:* references that won't be resolved
    const unresolvedDeps: string[] = []
    const allDeps = { ...pkg.dependencies, ...pkg.devDependencies }
    for (const [name, version] of Object.entries(allDeps)) {
      if (version === 'workspace:*') {
        const found = workspacePackages.find((p) => p.name === name)
        if (!found) {
          unresolvedDeps.push(name)
        }
      }
    }

    if (unresolvedDeps.length > 0) {
      return {
        success: false,
        error: `unresolved workspace dependencies: ${unresolvedDeps.join(', ')}`,
        packages: workspacePackages,
      }
    }

    // dry run returns here without making changes
    if (dryRun) {
      return {
        success: true,
        packages: workspacePackages,
        warnings: warnings.length > 0 ? warnings : undefined,
      }
    }

    // replace workspace:* with actual versions
    for (const { name, version } of workspacePackages) {
      if (pkg.dependencies?.[name] === 'workspace:*') {
        pkg.dependencies[name] = `^${version}`
      }
      if (pkg.devDependencies?.[name] === 'workspace:*') {
        pkg.devDependencies[name] = `^${version}`
      }
    }

    // remove workspaces field
    delete pkg.workspaces

    // write updated package.json
    writeFileSync(packagePath, JSON.stringify(pkg, null, 2) + '\n', 'utf-8')

    // remove packages directory
    rmSync(packagesDir, { recursive: true, force: true })

    // install the published packages
    try {
      execSync('bun install', { cwd, stdio: 'inherit' })
    } catch {
      // restore packages directory hint in error
      return {
        success: false,
        error:
          'failed to install published packages. package.json was modified but install failed. ' +
          'try running "bun install" manually, or restore from git.',
        packages: workspacePackages,
      }
    }

    return {
      success: true,
      packages: workspacePackages,
      warnings: warnings.length > 0 ? warnings : undefined,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
