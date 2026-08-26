#!/usr/bin/env bun

import { cmd } from './cmd'

// avoid emitter error
process.setMaxListeners(50)
process.stderr.setMaxListeners(50)
process.stdout.setMaxListeners(50)

await cmd`publish takeout packages to npm`
  .args(
    `--patch boolean --minor boolean --major boolean --canary boolean
     --rerun boolean --republish boolean --finish boolean --skip-finish boolean
     --dry-run boolean --skip-test boolean --skip-build boolean --skip-version boolean --skip-publish boolean
     --dirty boolean --tamagui-git-user boolean
     --undocumented boolean --skip-all boolean`,
  )
  .run(async ({ args, $, run, path, os }) => {
    const fs = (await import('fs-extra')).default
    const { writeJSON } = await import('fs-extra')
    const pMap = (await import('p-map')).default

    // for failed publishes that need to re-run
    const reRun = args.rerun
    const rePublish = reRun || args.republish
    const finish = args.finish
    const skipAll = args.skipAll
    const undocumented = args.undocumented
    const skipFinish = args.skipFinish || skipAll || undocumented

    const canary = args.canary
    const skipVersion = finish || rePublish || args.skipVersion
    const shouldMajor = args.major
    const shouldMinor = args.minor
    const shouldPatch = args.patch
    const dirty = finish || undocumented || args.dirty
    const skipTest =
      finish ||
      rePublish ||
      skipAll ||
      args.skipTest ||
      process.argv.includes('--skip-tests')
    const skipBuild = finish || rePublish || skipAll || args.skipBuild
    const skipPublish = args.skipPublish
    const dryRun = args.dryRun
    const tamaguiGitUser = args.tamaguiGitUser
    async function getWorkspacePackages() {
      // read workspaces from root package.json
      const rootPackageJson = await fs.readJSON(path.join(process.cwd(), 'package.json'))
      const workspaceGlobs = rootPackageJson.workspaces || []

      // resolve workspace paths
      const packagePaths: { name: string; location: string }[] = []
      for (const glob of workspaceGlobs) {
        if (glob.includes('*')) {
          // handle glob patterns like "./packages/*"
          const baseDir = glob.replace('/*', '')
          const fullPath = path.join(process.cwd(), baseDir)
          if (await fs.pathExists(fullPath)) {
            const dirs = await fs.readdir(fullPath)
            for (const dir of dirs) {
              const pkgPath = path.join(fullPath, dir, 'package.json')
              if (await fs.pathExists(pkgPath)) {
                const pkg = await fs.readJSON(pkgPath)
                packagePaths.push({
                  name: pkg.name,
                  location: path.join(baseDir, dir),
                })
              }
            }
          }
        } else {
          // handle direct paths like "./src/start"
          const pkgPath = path.join(process.cwd(), glob, 'package.json')
          if (await fs.pathExists(pkgPath)) {
            const pkg = await fs.readJSON(pkgPath)
            packagePaths.push({
              name: pkg.name,
              location: glob,
            })
          }
        }
      }

      return packagePaths
    }

    async function loadPackageJsons(packagePaths: { name: string; location: string }[]) {
      const allPackageJsons = await Promise.all(
        packagePaths
          .filter((i) => i.location !== '.' && !i.name.startsWith('@takeout'))
          .map(async ({ name, location }) => {
            const cwd = path.join(process.cwd(), location)
            const json = await fs.readJSON(path.join(cwd, 'package.json'))
            return {
              name,
              cwd,
              json,
              path: path.join(cwd, 'package.json'),
              directory: location,
            }
          }),
      )

      const publishablePackages = allPackageJsons.filter(
        (x) => !x.json.skipPublish && !x.json.private,
      )

      return { allPackageJsons, publishablePackages }
    }

    // main release flow
    const curVersion = fs.readJSONSync('./packages/helpers/package.json').version

    // must specify version (unless republishing):
    if (
      !rePublish &&
      !skipVersion &&
      !canary &&
      !shouldPatch &&
      !shouldMinor &&
      !shouldMajor
    ) {
      console.error(`Must specify one of --patch, --minor, or --major`)
      process.exit(1)
    }

    const nextVersion = (() => {
      if (rePublish || skipVersion) {
        return curVersion
      }

      if (canary) {
        return `${curVersion.replace(/(-\d+)+$/, '')}-${Date.now()}`
      }

      const curMajor = +curVersion.split('.')[0] || 0
      const curMinor = +curVersion.split('.')[1] || 0
      const patchAndCanary = curVersion.split('.')[2]
      const [curPatch] = patchAndCanary.split('-')
      const patchVersion = shouldPatch ? +curPatch + 1 : 0
      const minorVersion = curMinor + (shouldMinor ? 1 : 0)
      const majorVersion = curMajor + (shouldMajor ? 1 : 0)
      const next = `${majorVersion}.${minorVersion}.${patchVersion}`

      return next
    })()

    if (!skipVersion) {
      console.info(` 🚀 Releasing:`)
      console.info('  Current:', curVersion)
      console.info(`  Next: ${nextVersion}`)
    }

    let restorePackageJsons: (() => Promise<void>) | undefined
    let publishSucceeded = false
    const publishedNames: string[] = []

    try {
      const hasTrustedPublishingIdentity =
        process.env.GITHUB_ACTIONS === 'true' &&
        Boolean(process.env.ACTIONS_ID_TOKEN_REQUEST_URL) &&
        Boolean(process.env.ACTIONS_ID_TOKEN_REQUEST_TOKEN)

      if (!finish && !skipPublish && !dryRun && !hasTrustedPublishingIdentity) {
        try {
          await run(`npm whoami`, { silent: true, captureOutput: true })
        } catch {
          if (!process.stdin.isTTY || !process.stdout.isTTY) {
            throw new Error(
              'npm authentication is required to publish. Run `npm login` in a terminal, then retry the release.',
            )
          }

          console.info(
            'npm authentication is required. Complete the browser login to continue.',
          )
          await run(`npm login`, { interactive: true })

          try {
            await run(`npm whoami`, { silent: true, captureOutput: true })
          } catch {
            throw new Error(
              'npm authentication still failed after `npm login`. Verify `npm whoami` succeeds, then retry the release.',
            )
          }
        }
      }

      // ensure we are up to date
      // ensure we are on main
      if (!canary && !process.env.CI) {
        if ((await run(`git rev-parse --abbrev-ref HEAD`)).stdout.trim() !== 'main') {
          throw new Error(`Not on main`)
        }
        if (!dirty && !rePublish && !finish) {
          await run(`git pull --rebase origin main`)
        }
      }

      const packagePaths = await getWorkspacePackages()
      const { allPackageJsons, publishablePackages: packageJsons } =
        await loadPackageJsons(packagePaths)
      const originalPackageJsons = new Map<string, string>()
      await Promise.all(
        allPackageJsons.map(async ({ path: pkgPath }) => {
          originalPackageJsons.set(pkgPath, await fs.readFile(pkgPath, 'utf8'))
        }),
      )
      restorePackageJsons = async () => {
        await Promise.all(
          [...originalPackageJsons].map(([pkgPath, contents]) =>
            fs.writeFile(pkgPath, contents),
          ),
        )
      }

      if (!finish) {
        console.info(
          `Publishing in order:\n\n${packageJsons.map((x) => x.name).join('\n')}`,
        )
      }

      async function checkDistDirs() {
        await Promise.all(
          packageJsons.map(async ({ cwd, json }) => {
            const distDir = path.join(cwd, 'dist')
            if (json.scripts?.build) {
              if (!(await fs.pathExists(distDir))) {
                console.warn('no dist dir!', distDir)
                process.exit(1)
              }
            }
          }),
        )
      }

      if (tamaguiGitUser) {
        await run(`git config --global user.name 'Tamagui'`)
        await run(`git config --global user.email 'tamagui@users.noreply.github.com`)
      }

      console.info('install and build')

      if (!rePublish && !finish) {
        await run(process.env.CI ? `bun install --frozen-lockfile` : `bun install`)
      }

      if (!skipBuild && !finish) {
        await run(`bun clean`)
        await run(`bun run build`)
        await checkDistDirs()
      }

      if (!finish) {
        console.info('run checks')

        if (!skipTest) {
          await run(`bun lint`)
          await run(`bun check`)
          // only in packages
          // await run(`bun test`)
        }
      }

      if (!dirty && !dryRun && !rePublish) {
        const out = await run(`git status --porcelain`)
        if (out.stdout) {
          throw new Error(`Has unsaved git changes: ${out.stdout}`)
        }
      }

      // snapshot workspace:* deps before mutation (shallow copy mutates originals)
      const workspaceDeps = new Map<string, Record<string, Record<string, string>>>()
      for (const { json, path: pkgPath } of allPackageJsons) {
        const deps: Record<string, Record<string, string>> = {}
        for (const field of [
          'dependencies',
          'devDependencies',
          'optionalDependencies',
          'peerDependencies',
        ]) {
          if (!json[field]) continue
          for (const depName in json[field]) {
            if (json[field][depName].startsWith('workspace:')) {
              deps[field] ??= {}
              deps[field][depName] = json[field][depName]
            }
          }
        }
        if (Object.keys(deps).length) workspaceDeps.set(pkgPath, deps)
      }

      if (!skipVersion && !finish) {
        await Promise.all(
          allPackageJsons.map(async ({ json, path: pkgPath }) => {
            const next = { ...json }

            next.version = nextVersion

            for (const field of [
              'dependencies',
              'devDependencies',
              'optionalDependencies',
              'peerDependencies',
            ]) {
              const nextDeps = next[field]
              if (!nextDeps) continue
              for (const depName in nextDeps) {
                if (allPackageJsons.some((p) => p.name === depName)) {
                  nextDeps[depName] = nextVersion
                }
              }
            }

            await writeJSON(pkgPath, next, { spaces: 2 })
          }),
        )
      }

      if (!finish && !rePublish) {
        await run(`git diff`)
      }

      if (!finish && !skipPublish) {
        const packDir = path.join(os.tmpdir(), `takeout-release-${nextVersion}`)
        await fs.remove(packDir)
        await fs.ensureDir(packDir)

        const isPublished = async ({ name }: (typeof packageJsons)[number]) => {
          try {
            const result = await run(`npm view ${name}@${nextVersion} version --json`, {
              cwd: packDir,
              captureOutput: true,
              silent: true,
            })
            return JSON.parse(result.stdout.trim()) === nextVersion
          } catch (error) {
            const message = String(error)
            const cause = error instanceof Error ? (error.cause as any) : undefined
            const output = `${message}\n${cause?.stdout || ''}\n${cause?.stderr || ''}`
            if (/E404|404 Not Found|is not in this registry/i.test(output)) {
              return false
            }
            throw new Error(`Could not verify ${name}@${nextVersion} on npm:\n${output}`)
          }
        }

        console.info(`Checking ${packageJsons.length} package versions on npm...`)
        const publishedChecks = await pMap(
          packageJsons,
          async (pkg) => ({ pkg, published: await isPublished(pkg) }),
          { concurrency: 8 },
        )
        const pendingPackages = publishedChecks
          .filter(({ pkg, published }) => {
            if (published) {
              console.info(`Skipping ${pkg.name}: this version is already published`)
              return false
            }
            return true
          })
          .map(({ pkg }) => pkg)

        const prepareOne = async ({ name, cwd, json }: (typeof packageJsons)[number]) => {
          const publishOptions = [canary && `--tag canary`, dryRun && `--dry-run`]
            .filter(Boolean)
            .join(' ')
          const tgzPath = path.join(packDir, `${name.replace('/', '-')}.tgz`)
          const packageJsonPath = path.join(cwd, 'package.json')
          const packageJsonBeforePack = await fs.readFile(packageJsonPath, 'utf8')
          const packageJsonForPublish = JSON.parse(packageJsonBeforePack)
          packageJsonForPublish.repository = {
            type: 'git',
            url: 'https://github.com/tamagui/takeout2.git',
            directory: path.relative(process.cwd(), cwd),
          }
          await writeJSON(packageJsonPath, packageJsonForPublish, { spaces: 2 })

          // pack with bun (properly converts workspace:* to versions)
          // use swap-exports for packages with build scripts, otherwise just pack
          try {
            if (json.scripts?.build) {
              await run(
                `bun run build --swap-exports -- bun pm pack --filename ${tgzPath}`,
                {
                  cwd,
                  silent: true,
                },
              )
            } else {
              await run(`bun pm pack --filename ${tgzPath}`, {
                cwd,
                silent: true,
              })
            }
          } finally {
            await fs.writeFile(packageJsonPath, packageJsonBeforePack)
          }

          const workspaceDir = path.join(packDir, 'workspaces', name.replace('/', '_'))
          await fs.ensureDir(workspaceDir)
          await run(
            `tar -xzf ${JSON.stringify(tgzPath)} -C ${JSON.stringify(workspaceDir)} --strip-components=1`,
            { silent: true },
          )

          return {
            workspace: path.relative(packDir, workspaceDir),
            publishOptions,
          }
        }

        if (pendingPackages.length > 0) {
          if (process.stdin.isTTY && process.stdout.isTTY && !dryRun) {
            console.info(
              'npm will open the browser for 2FA once. Select “do not challenge for the next 5 minutes” so the same short-lived approval can publish the remaining packages.',
            )
          }

          const prepared = await pMap(pendingPackages, prepareOne, {
            concurrency: 8,
            stopOnError: false,
          })
          await writeJSON(
            path.join(packDir, 'package.json'),
            {
              name: 'takeout-release',
              private: true,
              workspaces: prepared.map(({ workspace }) => workspace),
            },
            { spaces: 2 },
          )

          const publishOptions = prepared[0]?.publishOptions || ''
          const webAuthCache = path.join(process.cwd(), 'scripts/cache-npm-webauth.cjs')
          const nodeOptions = [process.env.NODE_OPTIONS, `--require=${webAuthCache}`]
            .filter(Boolean)
            .join(' ')

          try {
            await run(
              `npm publish --workspaces --ignore-scripts --access public ${publishOptions}`.trim(),
              {
                cwd: packDir,
                env: { NODE_OPTIONS: nodeOptions },
                interactive: true,
              },
            )
            publishedNames.push(...pendingPackages.map(({ name }) => name))
          } catch (error) {
            const postflight = await pMap(
              pendingPackages,
              async (pkg) => ({ pkg, published: await isPublished(pkg) }),
              { concurrency: 8 },
            )
            const completed = postflight.filter(({ published }) => published)
            const missing = postflight.filter(({ published }) => !published)
            publishedNames.push(...completed.map(({ pkg }) => pkg.name))

            throw new Error(
              `Publish stopped after ${completed.length} packages. Still missing:\n${missing.map(({ pkg }) => pkg.name).join('\n')}\n\nRe-run with --republish to retry only these packages.`,
              { cause: error },
            )
          }
        }

        publishSucceeded = true
        console.info(`✅ ${dryRun ? '[dry-run] ' : ''}Published\n`)

        // restore workspace:* protocols after publishing
        if (!dryRun) {
          await Promise.all(
            allPackageJsons.map(async ({ path: pkgPath }) => {
              const saved = workspaceDeps.get(pkgPath)
              if (!saved) return
              const current = await fs.readJSON(pkgPath)
              for (const field in saved) {
                if (!current[field]) continue
                for (const depName in saved[field]) {
                  current[field][depName] = saved[field][depName]
                }
              }
              await writeJSON(pkgPath, current, { spaces: 2 })
            }),
          )
        }

        // revert version changes after dry-run
        if (dryRun && !rePublish) {
          await restorePackageJsons()
          console.info('Reverted version changes\n')
        }

        // restore package.json files for undocumented releases (no git history)
        if (undocumented) {
          console.info('restoring package.json files...')
          await run(`git checkout -- packages/*/package.json`, { silent: true })
          console.info(`✅ restored package.json files (undocumented release)\n`)
        }
      }

      if (!skipFinish && !dryRun) {
        // then git tag, commit, push
        if (!finish) {
          await run(`bun install`)
        }
        const tagPrefix = canary ? 'canary' : 'v'
        const gitTag = `${tagPrefix}${nextVersion}`

        await finishAndCommit()

        async function finishAndCommit(cwd = process.cwd()) {
          if (!rePublish || reRun || finish) {
            await run(`git add -A`, { cwd })

            await run(`git commit -m ${gitTag}`, { cwd })

            if (!canary) {
              await run(`git tag ${gitTag}`, { cwd })
            }

            if (!dirty) {
              // pull once more before pushing so if there was a push in interim we get it
              await run(`git pull --rebase origin HEAD`, { cwd })
            }

            await run(`git push origin head`, { cwd })
            if (!canary) {
              await run(`git push origin ${gitTag}`, { cwd })
            }

            console.info(`✅ Pushed and versioned\n`)
          }
        }
      }

      console.info(`✅ Done\n`)
    } catch (err) {
      if (!publishSucceeded && publishedNames.length === 0 && restorePackageJsons) {
        await restorePackageJsons()
        console.info('restored package.json files after failed release')
      }
      console.info('\nError:\n', err)
      process.exit(1)
    }
  })
