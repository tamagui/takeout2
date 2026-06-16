#!/usr/bin/env bun

import { cmd } from './cmd'

interface PackageJson {
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
  peerDependencies?: Record<string, string>
  optionalDependencies?: Record<string, string>
  workspaces?: string[] | { packages?: string[] }
  upgradePackageJsonGlobs?: string[]
  upgradeSets?: Record<string, string[]>
}

await cmd`upgrade packages by name or pattern`
  .args('--tag string --canary boolean --rc boolean')
  .run(async ({ args, $, path, fs }) => {
    let globalTag: string | undefined = args.tag
    if (args.canary) globalTag = 'canary'
    if (args.rc) globalTag = 'rc'

    const packagePatterns: string[] = []
    const rootDir = process.cwd()
    const rootPackageJson = JSON.parse(
      fs.readFileSync(path.join(rootDir, 'package.json'), 'utf-8'),
    )
    const upgradeSets: Record<string, string[]> = rootPackageJson.upgradeSets || {}
    const upgradePackageJsonGlobs = Array.isArray(rootPackageJson.upgradePackageJsonGlobs)
      ? rootPackageJson.upgradePackageJsonGlobs
      : []

    for (const arg of args.rest) {
      if (arg in upgradeSets) {
        // expand named upgrade set to its patterns
        packagePatterns.push(...upgradeSets[arg]!)
      } else {
        packagePatterns.push(arg)
      }
    }

    if (packagePatterns.length === 0) {
      const setNames = Object.keys(upgradeSets)
      if (setNames.length > 0) {
        console.info('Usage: bun tko up <target|pattern> [options]')
        console.info(`\nAvailable upgrade sets: ${setNames.join(', ')}`)
        console.info('\nOr provide package patterns directly:')
        console.info('  bun tko up @vxrn/* vxrn')
        console.info('  bun tko up --tag canary react react-dom')
      } else {
        console.error('Please provide at least one package pattern to update.')
        console.error('Example: bun tko up @vxrn/* vxrn')
        console.error('Or with a tag: bun tko up --tag canary @vxrn/* vxrn')
      }
      process.exit(1)
    }

    function findPackageJsonFiles(
      dir: string,
      extraPackageJsonGlobs = upgradePackageJsonGlobs,
    ): string[] {
      const results: string[] = []
      const seen = new Set<string>()

      const addPackageJson = (packageJsonPath: string) => {
        if (seen.has(packageJsonPath)) return
        seen.add(packageJsonPath)
        results.push(packageJsonPath)
      }

      if (fs.existsSync(path.join(dir, 'package.json'))) {
        addPackageJson(path.join(dir, 'package.json'))
      }

      // check if it's a monorepo with workspaces
      try {
        const packageJson = JSON.parse(
          fs.readFileSync(path.join(dir, 'package.json'), 'utf-8'),
        ) as PackageJson
        const packageJsonGlobs = [...extraPackageJsonGlobs]

        if (packageJson.workspaces) {
          let workspacePaths: string[] = []

          if (Array.isArray(packageJson.workspaces)) {
            workspacePaths = packageJson.workspaces
          } else if (packageJson.workspaces.packages) {
            workspacePaths = packageJson.workspaces.packages
          }

          packageJsonGlobs.unshift(...workspacePaths)
        }

        if (packageJsonGlobs.length > 0) {
          for (const workspace of packageJsonGlobs) {
            // handle glob patterns like "packages/*", "code/**/*", "./code/ui/**/*"
            const normalizedWorkspace = workspace
              .replace(/^\.\//, '')
              .replace(/\/package\.json$/, '')

            if (normalizedWorkspace.includes('**')) {
              // nested glob pattern - use glob to find all package.json files
              const baseDir = normalizedWorkspace.split('**')[0]!.replace(/\/$/, '')
              const basePath = path.join(dir, baseDir)

              if (fs.existsSync(basePath)) {
                const findPackages = (searchDir: string) => {
                  try {
                    const entries = fs.readdirSync(searchDir, { withFileTypes: true })
                    for (const entry of entries) {
                      if (entry.isDirectory() && entry.name !== 'node_modules') {
                        const subPath = path.join(searchDir, entry.name)
                        const pkgPath = path.join(subPath, 'package.json')
                        if (fs.existsSync(pkgPath)) {
                          addPackageJson(pkgPath)
                        }
                        // recurse into subdirectories
                        findPackages(subPath)
                      }
                    }
                  } catch (_e) {
                    // ignore permission errors
                  }
                }
                findPackages(basePath)
              }
            } else if (normalizedWorkspace.includes('*')) {
              // simple glob pattern like "packages/*"
              const workspaceDir = normalizedWorkspace.replace(/\/\*$/, '')
              if (fs.existsSync(path.join(dir, workspaceDir))) {
                const subdirs = fs
                  .readdirSync(path.join(dir, workspaceDir), {
                    withFileTypes: true,
                  })
                  .filter((dirent) => dirent.isDirectory())
                  .map((dirent) => path.join(dir, workspaceDir, dirent.name))

                for (const subdir of subdirs) {
                  if (fs.existsSync(path.join(subdir, 'package.json'))) {
                    addPackageJson(path.join(subdir, 'package.json'))
                  }
                }
              }
            } else {
              // exact path like "code/tamagui.dev" or "./code/sandbox"
              const pkgPath = path.join(dir, normalizedWorkspace, 'package.json')
              if (fs.existsSync(pkgPath)) {
                addPackageJson(pkgPath)
              }
            }
          }
        }
      } catch (_error) {
        // ignore errors parsing package.json
      }

      return results
    }

    function extractDependencies(packageJsonPath: string): string[] {
      try {
        const content = fs.readFileSync(packageJsonPath, 'utf-8')
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

    function updatePackageJsonVersions(
      packageJsonPath: string,
      packagesToUpdate: string[],
      versionMap: Map<string, string>,
    ): number {
      const content = fs.readFileSync(packageJsonPath, 'utf-8')
      const packageJson = JSON.parse(content) as PackageJson
      let updatedCount = 0

      const updateDeps = (depsObject: Record<string, string> | undefined) => {
        if (!depsObject) return
        for (const pkg of packagesToUpdate) {
          const current = depsObject[pkg]
          if (current && !current.startsWith('workspace:')) {
            const newVersion = versionMap.get(pkg)
            if (newVersion) {
              // for tagged versions (canary, rc, etc), use exact version (no prefix)
              // otherwise preserve version prefix (^, ~, >=, etc)
              if (globalTag) {
                depsObject[pkg] = newVersion
              } else {
                // wildcard "*" means newly added placeholder, use ^ prefix
                if (current === '*') {
                  depsObject[pkg] = `^${newVersion}`
                  updatedCount++
                  continue
                }
                const prefixMatch = current.match(/^([^\d]*)/)
                const prefix = prefixMatch?.[1] || ''
                depsObject[pkg] = `${prefix}${newVersion}`
              }
              updatedCount++
            }
          }
        }
      }

      updateDeps(packageJson.dependencies)
      updateDeps(packageJson.devDependencies)
      updateDeps(packageJson.peerDependencies)
      updateDeps(packageJson.optionalDependencies)

      if (updatedCount > 0) {
        fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n')
      }

      return updatedCount
    }

    async function updatePackages(
      packagesByManifest: Map<string, { dir: string; packages: string[] }>,
      rootDir: string,
      packageJsonFiles: string[],
    ) {
      try {
        fs.rmSync(`node_modules/vite`, {
          recursive: true,
          force: true,
        })
      } catch (_e) {
        // ignore if vite is not there
      }

      // collect all unique packages to update
      const allPackages = new Set<string>()
      for (const { packages } of packagesByManifest.values()) {
        packages.forEach((pkg) => allPackages.add(pkg))
      }

      // fetch versions for all packages (with tag if specified)
      const versionMap = new Map<string, string>()
      console.info(`\n🔍 Fetching versions for ${allPackages.size} package(s)...`)

      await Promise.all(
        [...allPackages].map(async (pkg) => {
          try {
            const tag = globalTag || 'latest'
            const result = await $`npm view ${pkg}@${tag} version`.quiet()
            const version = result.text().trim()
            if (version) {
              versionMap.set(pkg, version)
              console.info(`  ✓ ${pkg}@${tag} → ${version}`)
            }
          } catch {
            if (globalTag) {
              console.info(`  ⊘ ${pkg}@${globalTag} not found, skipping`)
            } else {
              console.info(`  ⊘ ${pkg} not found, skipping`)
            }
          }
        }),
      )

      if (versionMap.size === 0) {
        console.info(`\n⚠️ No packages found to update`)
        return
      }

      // update all package.json files directly
      console.info(`\n📦 Updating ${packageJsonFiles.length} package.json file(s)...`)
      let totalUpdates = 0

      for (const packageJsonPath of packageJsonFiles) {
        const packagesInManifest =
          packagesByManifest.get(getWorkspaceName(packageJsonPath, rootDir))?.packages ||
          []

        if (packagesInManifest.length > 0) {
          const updates = updatePackageJsonVersions(
            packageJsonPath,
            packagesInManifest,
            versionMap,
          )
          if (updates > 0) {
            const name = getWorkspaceName(packageJsonPath, rootDir)
            console.info(`  ✓ ${name}: ${updates} package(s)`)
            totalUpdates += updates
          }
        }
      }

      console.info(`\n📝 Updated ${totalUpdates} dependency version(s)`)

      console.info(`\n⚙️ Running 'bun install'...`)
      $.cwd(rootDir)
      try {
        await $`bun install`
        console.info('✅ Done!')
      } catch (error: any) {
        const stderr = error.stderr?.toString() || error.message || ''
        // check if it's a version resolution error (common after new publish)
        if (
          stderr.includes('No version matching') ||
          stderr.includes('failed to resolve')
        ) {
          console.info(`⚠️ Version not in cache, clearing cache and retrying...`)
          try {
            await $`bun pm cache rm`.quiet()
            await $`bun install`
            console.info('✅ Done!')
          } catch (retryError: any) {
            const retryStderr = retryError.stderr?.toString() || retryError.message || ''
            console.error(
              `🚨 'bun install' failed after cache clear: ${retryStderr.split('\n')[0]}`,
            )
          }
        } else {
          console.error(`🚨 'bun install' failed: ${stderr.split('\n')[0]}`)
        }
      }
    }

    function getWorkspaceName(packageJsonPath: string, rootDir: string): string {
      const dir = packageJsonPath.replace('/package.json', '')
      if (dir === rootDir) return 'root'
      return dir.replace(rootDir + '/', '')
    }

    const packageJsonFiles = findPackageJsonFiles(rootDir)
    console.info(`Found ${packageJsonFiles.length} package.json files`)

    const workspacePackageJsonFiles = findPackageJsonFiles(rootDir, [])

    // get workspace package names to exclude from updates
    const workspacePackageNames = new Set<string>()
    for (const packageJsonPath of workspacePackageJsonFiles) {
      if (packageJsonPath === path.join(rootDir, 'package.json')) continue

      try {
        const content = fs.readFileSync(packageJsonPath, 'utf-8')
        const packageJson = JSON.parse(content)
        if (packageJson.name) {
          workspacePackageNames.add(packageJson.name)
        }
      } catch (_error) {
        // ignore errors
      }
    }

    console.info(
      `Found ${workspacePackageNames.size} workspace packages to exclude from updates`,
    )

    // build map of packages to update per manifest
    const packagesByManifest = new Map<string, { dir: string; packages: string[] }>()
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
        packagesByManifest.set(name, { dir, packages: matchingDeps })
      }
    }

    if (allMatchingDeps.size === 0) {
      // no existing deps matched, but exact patterns (no wildcards) can be added fresh
      const exactPatterns = packagePatterns.filter((p) => !p.includes('*'))
      if (exactPatterns.length === 0) {
        console.info(
          `Found 0 dependencies matching patterns: ${packagePatterns.join(', ')}`,
        )
        console.info('No matching packages found to update.')
        return
      }

      // add as new dependencies to the root package.json
      console.info(`No existing deps found, adding to root: ${exactPatterns.join(', ')}`)
      const rootPkgPath = path.join(rootDir, 'package.json')

      for (const pkg of exactPatterns) {
        allMatchingDeps.add(pkg)
      }

      packagesByManifest.set('root', {
        dir: rootDir,
        packages: exactPatterns,
      })

      // insert placeholder so updatePackageJsonVersions can set the real version
      const rootPkg = JSON.parse(fs.readFileSync(rootPkgPath, 'utf-8'))
      if (!rootPkg.dependencies) {
        rootPkg.dependencies = {}
      }
      for (const pkg of exactPatterns) {
        if (!rootPkg.dependencies[pkg] && !rootPkg.devDependencies?.[pkg]) {
          rootPkg.dependencies[pkg] = '*'
        }
      }
      fs.writeFileSync(rootPkgPath, JSON.stringify(rootPkg, null, 2) + '\n')
    } else {
      console.info(
        `Found ${allMatchingDeps.size} dependencies matching patterns: ${packagePatterns.join(', ')}`,
      )
      console.info(`Found matches in ${packagesByManifest.size} package manifest(s)`)
    }

    if (globalTag) {
      console.info(`🏷️ Using tag '${globalTag}'`)
    }

    await updatePackages(packagesByManifest, rootDir, packageJsonFiles)

    // sync resolved $dep: values (like ZERO_VERSION) to all env targets
    if (
      Object.values(rootPackageJson.env || {}).some(
        (v: any) => typeof v === 'string' && v.startsWith('$dep:'),
      )
    ) {
      console.info('\n🔄 Syncing env variables...')
      await $`bun tko run env-update`
    }

    console.info('\n🎉 Dependency update complete!')
  })
