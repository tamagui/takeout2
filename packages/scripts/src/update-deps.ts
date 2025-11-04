#!/usr/bin/env bun

import { $ } from 'bun'
import { existsSync, readdirSync, readFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'

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

async function fetchPackageVersionFromTag(
  packageName: string,
  tag: string
): Promise<string | null> {
  try {
    console.info(`⏳ Lookup ${packageName}@${tag}...`)
    // Use --json to ensure parseable output, even if it's just a string.
    const result = await $`npm view ${packageName}@${tag} version --json`.text()
    const versionData = JSON.parse(result.trim())

    let version: string | undefined
    if (Array.isArray(versionData)) {
      if (versionData.length === 0) {
        console.warn(`❓ No specific versions found for ${packageName}@${tag}.`)
        return null
      }
      // If multiple versions, prefer the last one, as it's often the latest/highest precedent for a tag.
      version = versionData[versionData.length - 1]
      if (versionData.length > 1) {
        console.info(
          `ℹ️ Multiple versions found for ${packageName}@${tag}: [${versionData.join(', ')}]. Using: ${version}`
        )
      }
    } else if (typeof versionData === 'string') {
      version = versionData
    }

    if (typeof version === 'string' && version.trim() !== '') {
      console.info(`✅ Found ${packageName}@${tag}: ${version}`)
      return version
    }

    console.warn(
      `❓ Unexpected or empty version format for ${packageName}@${tag}: ${JSON.stringify(versionData)}`
    )
    return null
  } catch (error: any) {
    // Trim error message to avoid overly verbose logs from npm
    const errorMessage = error.message?.split('\n')[0]
    console.warn(
      `⚠️ Could not fetch version for ${packageName}@${tag}. Error: ${errorMessage}`
    )
    return null
  }
}

async function updatePackages(packagesToUpdate: string[], cwd: string) {
  if (packagesToUpdate.length === 0) {
    console.info('No packages to update after resolving versions.')
    return
  }

  $.cwd(cwd)

  try {
    rmSync(`node_modules/vite`, {
      recursive: true,
      force: true,
    })
  } catch (_e) {
    // ignore if vite is not there
  }

  if (globalTag) {
    // check which packages actually have the tag
    console.info(`🔍 Checking which packages have tag '${globalTag}'...\n`)
    const packagesWithTag: string[] = []

    for (const pkg of packagesToUpdate) {
      try {
        await $`npm view ${pkg}@${globalTag} version --json`.quiet()
        packagesWithTag.push(pkg)
        console.info(`  ✓ ${pkg}@${globalTag} exists`)
      } catch {
        console.info(`  ⊘ ${pkg}@${globalTag} not found, skipping`)
      }
    }

    if (packagesWithTag.length === 0) {
      console.info(`\n⚠️ No packages found with tag '${globalTag}'`)
      return
    }

    console.info(`
📦 Updating ${packagesWithTag.length} package(s) with tag '${globalTag}' using --ignore-scripts...
`)

    const packageNamesWithTags = packagesWithTag.map((pkg) => `${pkg}@${globalTag}`)
    const addCommand = `bun add ${packageNamesWithTags.join(' ')} --ignore-scripts`
    console.info(`\n🪄 Running: ${addCommand}\n`)

    try {
      await $`bun add ${packageNamesWithTags} --ignore-scripts`
      console.info(
        `✅ Successfully updated all packages with tag '${globalTag}' (scripts ignored)`
      )
    } catch (error: any) {
      const errorMessage = error.message?.split('\n')[0]
      console.warn(`⚠️ Failed to update packages. Error: ${errorMessage}`)
    }
  } else {
    // Bulk update when not using tags
    console.info(`
📦 Bulk updating ${packagesToUpdate.length} package(s) using --latest --ignore-scripts...
`)

    const updateCommand = `bun update ${packagesToUpdate.join(' ')} --latest --ignore-scripts`
    console.info(`\n🪄 Running: ${updateCommand}\n`)

    try {
      await $`bun update ${packagesToUpdate} --latest --ignore-scripts`
      console.info(`✅ Successfully updated all packages (scripts ignored)`)
    } catch (error: any) {
      const errorMessage = error.message?.split('\n')[0]
      console.warn(`⚠️ Failed to update packages. Error: ${errorMessage}`)
    }
  }

  console.info(
    "\n⚙️ Running a final 'bun install' to process all changes and run lifecycle scripts..."
  )
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

async function main() {
  const rootDir = process.cwd()
  const packageJsonFiles = findPackageJsonFiles(rootDir)
  console.info(`Found ${packageJsonFiles.length} package.json files`)

  // Get workspace package names to exclude from updates
  const workspacePackageNames = new Set<string>()
  for (const packageJsonPath of packageJsonFiles) {
    // skip the root package.json when collecting workspace names
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

  const allDependencies = new Set<string>()

  for (const packageJsonPath of packageJsonFiles) {
    const deps = extractDependencies(packageJsonPath)
    deps.forEach((dep) => allDependencies.add(dep))
  }

  console.info(`Found ${allDependencies.size} total dependencies`)

  const matchingDependencies: string[] = []
  for (const dep of allDependencies) {
    // skip workspace packages - they should never be updated through bun update
    if (workspacePackageNames.has(dep)) {
      console.info(`⏩ Skipping workspace package: ${dep}`)
      continue
    }

    for (const pattern of packagePatterns) {
      // packagePatterns from arg parsing
      if (doesPackageMatchPattern(dep, pattern)) {
        matchingDependencies.push(dep)
        break
      }
    }
  }

  console.info(
    `Found ${matchingDependencies.length} dependencies matching patterns: ${packagePatterns.join(', ')}`
  )

  if (matchingDependencies.length === 0) {
    console.info('No matching packages found to update.')
    return
  }

  const packagesForBunUpdate: string[] = [...matchingDependencies]

  if (globalTag) {
    console.info(
      `🏷️ Using tag '${globalTag}' for ${packagesForBunUpdate.length} package(s)`
    )
  }

  await updatePackages(packagesForBunUpdate, rootDir)

  console.info('\n🎉 Dependency update complete!')
}

await main()
