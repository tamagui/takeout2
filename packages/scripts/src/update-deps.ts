#!/usr/bin/env bun

/**
 * @description Update dependencies across workspace packages
 */

import { existsSync, readdirSync, readFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'

import { $ } from 'bun'

let globalTag: string | undefined
const packagePatterns: string[] = []

const args = process.argv.slice(2)

for (const arg of args) {
  if (arg.startsWith('--tag=')) {
    const tagValue = arg.split('=')[1]
    if (tagValue) {
      globalTag = tagValue
    } else {
      console.error('Error: --tag option requires a value. Example: --tag=canary')
      process.exit(1)
    }
  } else if (arg === '--tag') {
    console.error('Error: --tag option requires a value and must use = syntax.')
    console.error('Correct usage: --tag=canary')
    console.error('Example: bun update-deps.ts --tag=canary react react-dom')
    process.exit(1)
  } else if (arg === '--canary') {
    globalTag = 'canary'
  } else if (arg === '--rc') {
    globalTag = 'rc'
  } else {
    packagePatterns.push(arg)
  }
}

if (packagePatterns.length === 0) {
  console.error('Please provide at least one package pattern to update.')
  console.error('Example: bun update-deps.ts @vxrn/* vxrn')
  console.error('Or with a tag: bun update-deps.ts --tag=canary @vxrn/* vxrn')
  process.exit(1)
}

interface PackageJson {
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
  peerDependencies?: Record<string, string>
  optionalDependencies?: Record<string, string>
}

function findPackageJsonFiles(dir: string): string[] {
  const results: string[] = []

  if (existsSync(join(dir, 'package.json'))) {
    results.push(join(dir, 'package.json'))
  }

  // Check if it's a monorepo with workspaces
  try {
    const packageJson = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf-8'))
    if (packageJson.workspaces) {
      let workspacePaths: string[] = []

      if (Array.isArray(packageJson.workspaces)) {
        workspacePaths = packageJson.workspaces
      } else if (packageJson.workspaces.packages) {
        workspacePaths = packageJson.workspaces.packages
      }

      for (const workspace of workspacePaths) {
        const workspaceDir = workspace.replace(/\/\*$/, '')
        if (existsSync(join(dir, workspaceDir))) {
          const subdirs = readdirSync(join(dir, workspaceDir), { withFileTypes: true })
            .filter((dirent) => dirent.isDirectory())
            .map((dirent) => join(dir, workspaceDir, dirent.name))

          for (const subdir of subdirs) {
            if (existsSync(join(subdir, 'package.json'))) {
              results.push(join(subdir, 'package.json'))
            }
          }
        }
      }
    }
  } catch (_error) {
    // Ignore errors parsing package.json
  }

  return results
}

function extractDependencies(packageJsonPath: string): string[] {
  try {
    const content = readFileSync(packageJsonPath, 'utf-8')
    const packageJson = JSON.parse(content) as PackageJson

    const deps: string[] = []

    const addNonWorkspaceDeps = (depsObject: Record<string, string> | undefined) => {
      if (!depsObject) return
      for (const [name, version] of Object.entries(depsObject)) {
        // skip workspace dependencies
        if (!version.startsWith('workspace:')) {
          deps.push(name)
        }
      }
    }

    addNonWorkspaceDeps(packageJson.dependencies)
    addNonWorkspaceDeps(packageJson.devDependencies)
    addNonWorkspaceDeps(packageJson.peerDependencies)
    addNonWorkspaceDeps(packageJson.optionalDependencies)

    return deps
  } catch (error) {
    console.error(`Error parsing ${packageJsonPath}:`, error)
    return []
  }
}

function doesPackageMatchPattern(packageName: string, pattern: string): boolean {
  if (pattern.includes('*')) {
    const regex = new RegExp(`^${pattern.replace(/\*/g, '.*')}$`)
    return regex.test(packageName)
  }
  return packageName === pattern
}

async function updatePackagesInWorkspace(
  packagesToUpdate: string[],
  cwd: string,
  workspaceName: string
) {
  if (packagesToUpdate.length === 0) {
    return
  }

  $.cwd(cwd)

  if (globalTag) {
    // check which packages actually have the tag
    const packagesWithTag = (
      await Promise.all(
        packagesToUpdate.map(async (pkg) => {
          try {
            await $`npm view ${pkg}@${globalTag} version --json`.quiet()
            return pkg
          } catch {
            return null
          }
        })
      )
    ).filter((pkg): pkg is string => pkg !== null)

    if (packagesWithTag.length === 0) {
      return
    }

    console.info(`  📦 ${workspaceName}: updating ${packagesWithTag.length} package(s)`)

    const packageNamesWithTags = packagesWithTag.map((pkg) => `${pkg}@${globalTag}`)

    try {
      await $`bun add ${packageNamesWithTags} --ignore-scripts`.quiet()
    } catch (error: any) {
      const errorMessage = error.message?.split('\n')[0]
      console.warn(`  ⚠️ ${workspaceName}: ${errorMessage}`)
    }
  } else {
    console.info(`  📦 ${workspaceName}: updating ${packagesToUpdate.length} package(s)`)

    try {
      await $`bun update ${packagesToUpdate} --latest --ignore-scripts`.quiet()
    } catch (error: any) {
      const errorMessage = error.message?.split('\n')[0]
      console.warn(`  ⚠️ ${workspaceName}: ${errorMessage}`)
    }
  }
}

async function updatePackages(
  packagesByWorkspace: Map<string, { dir: string; packages: string[] }>,
  rootDir: string
) {
  try {
    rmSync(`node_modules/vite`, {
      recursive: true,
      force: true,
    })
  } catch (_e) {
    // ignore if vite is not there
  }

  if (globalTag) {
    console.info(`🔍 Checking which packages have tag '${globalTag}'...\n`)
    const allPackages = new Set<string>()
    for (const { packages } of packagesByWorkspace.values()) {
      packages.forEach((pkg) => allPackages.add(pkg))
    }

    const packagesWithTag = new Set<string>()
    await Promise.all(
      [...allPackages].map(async (pkg) => {
        try {
          await $`npm view ${pkg}@${globalTag} version --json`.quiet()
          console.info(`  ✓ ${pkg}@${globalTag} exists`)
          packagesWithTag.add(pkg)
        } catch {
          console.info(`  ⊘ ${pkg}@${globalTag} not found, skipping`)
        }
      })
    )

    if (packagesWithTag.size === 0) {
      console.info(`\n⚠️ No packages found with tag '${globalTag}'`)
      return
    }

    console.info(`\n📦 Updating packages across workspaces...`)

    for (const [name, { dir, packages }] of packagesByWorkspace) {
      const validPackages = packages.filter((pkg) => packagesWithTag.has(pkg))
      await updatePackagesInWorkspace(validPackages, dir, name)
    }
  } else {
    console.info(`\n📦 Updating packages across workspaces...`)

    for (const [name, { dir, packages }] of packagesByWorkspace) {
      await updatePackagesInWorkspace(packages, dir, name)
    }
  }

  console.info(
    "\n⚙️ Running a final 'bun install' to process all changes and run lifecycle scripts..."
  )
  $.cwd(rootDir)
  try {
    await $`bun install`
    console.info("✅ Final 'bun install' completed successfully.")
  } catch (error: any) {
    const errorMessage = error.message?.split('\n')[0]
    console.error(`🚨 Final 'bun install' failed. Error: ${errorMessage}`)
    console.error(
      'Your dependencies might be in an inconsistent state. Please check manually.'
    )
  }
}

function getWorkspaceName(packageJsonPath: string, rootDir: string): string {
  const dir = packageJsonPath.replace('/package.json', '')
  if (dir === rootDir) return 'root'
  return dir.replace(rootDir + '/', '')
}

async function main() {
  const rootDir = process.cwd()
  const packageJsonFiles = findPackageJsonFiles(rootDir)
  console.info(`Found ${packageJsonFiles.length} package.json files`)

  // get workspace package names to exclude from updates
  const workspacePackageNames = new Set<string>()
  for (const packageJsonPath of packageJsonFiles) {
    if (packageJsonPath === join(rootDir, 'package.json')) continue

    try {
      const content = readFileSync(packageJsonPath, 'utf-8')
      const packageJson = JSON.parse(content)
      if (packageJson.name) {
        workspacePackageNames.add(packageJson.name)
      }
    } catch (_error) {
      // ignore errors
    }
  }

  console.info(
    `Found ${workspacePackageNames.size} workspace packages to exclude from updates`
  )

  // build map of packages to update per workspace
  const packagesByWorkspace = new Map<string, { dir: string; packages: string[] }>()
  const allMatchingDeps = new Set<string>()

  for (const packageJsonPath of packageJsonFiles) {
    const deps = extractDependencies(packageJsonPath)
    const matchingDeps: string[] = []

    for (const dep of deps) {
      // skip workspace packages
      if (workspacePackageNames.has(dep)) continue

      for (const pattern of packagePatterns) {
        if (doesPackageMatchPattern(dep, pattern)) {
          matchingDeps.push(dep)
          allMatchingDeps.add(dep)
          break
        }
      }
    }

    if (matchingDeps.length > 0) {
      const dir = packageJsonPath.replace('/package.json', '')
      const name = getWorkspaceName(packageJsonPath, rootDir)
      packagesByWorkspace.set(name, { dir, packages: matchingDeps })
    }
  }

  console.info(
    `Found ${allMatchingDeps.size} dependencies matching patterns: ${packagePatterns.join(', ')}`
  )
  console.info(`Found matches in ${packagesByWorkspace.size} workspace(s)`)

  if (allMatchingDeps.size === 0) {
    console.info('No matching packages found to update.')
    return
  }

  if (globalTag) {
    console.info(`🏷️ Using tag '${globalTag}'`)
  }

  await updatePackages(packagesByWorkspace, rootDir)

  console.info('\n🎉 Dependency update complete!')
}

await main()
