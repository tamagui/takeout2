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
     --dry-run boolean --skip-test boolean --skip-build boolean --skip-version boolean
     --dirty boolean --tamagui-git-user boolean --sync-on-zero boolean --skip-on-zero-sync boolean`
  )
  .run(async ({ args, $, run, path, os }) => {
    const fs = (await import('fs-extra')).default
    const { writeJSON } = await import('fs-extra')
    const pMap = (await import('p-map')).default

    // on-zero sync paths
    const onZeroGithub = path.join(os.homedir(), 'github', 'on-zero')
    const onZeroTakeout = path.join(process.cwd(), 'packages', 'on-zero')

    // for failed publishes that need to re-run
    const reRun = args.rerun
    const rePublish = reRun || args.republish
    const finish = args.finish
    const skipFinish = args.skipFinish

    const canary = args.canary
    const skipVersion = finish || rePublish || args.skipVersion
    const shouldMajor = args.major
    const shouldMinor = args.minor
    const shouldPatch = args.patch
    const dirty = finish || args.dirty
    const skipTest =
      finish || rePublish || args.skipTest || process.argv.includes('--skip-tests')
    const skipBuild = finish || rePublish || args.skipBuild
    const dryRun = args.dryRun
    const tamaguiGitUser = args.tamaguiGitUser
    const syncOnZeroOnly = args.syncOnZero
    const skipOnZeroSync = args.skipOnZeroSync

    async function syncOnZeroIn() {
      if (!(await fs.pathExists(onZeroGithub))) return

      // check if there are commits after the last sync commit
      const log = (
        await $`git -C ${onZeroGithub} log --oneline --format=%s`.text()
      ).trim()
      const commits = log.split('\n')
      const lastSyncIdx = commits.findIndex((c) => c.startsWith('sync: from takeout'))

      // no commits before sync, or first commit is a sync = nothing to pull in
      if (lastSyncIdx <= 0) {
        console.info('  ← on-zero: no new github commits to sync in')
        return
      }

      const newCommits = commits
        .slice(0, lastSyncIdx)
        .filter((c) => !c.match(/^v\d+\.\d+\.\d+/))
      if (!newCommits.length) {
        console.info('  ← on-zero: no new github commits to sync in')
        return
      }

      console.info(`  ← on-zero: syncing ${newCommits.length} commits from github`)
      for (const c of newCommits) console.info(`      ${c}`)

      if (dryRun) {
        console.info('    [dry-run] would copy src from github')
        return
      }

      await fs.copy(path.join(onZeroGithub, 'src'), path.join(onZeroTakeout, 'src'), {
        overwrite: true,
      })

      const status = (await $`git status --porcelain`.text()).trim()
      if (status) {
        await $`git add packages/on-zero`
        await $`git commit -m "on-zero: sync from github"`
      }
    }

    async function syncOnZeroOut(version: string) {
      if (!(await fs.pathExists(onZeroGithub))) return

      // copy src files from takeout to github
      await fs.copy(path.join(onZeroTakeout, 'src'), path.join(onZeroGithub, 'src'), {
        overwrite: true,
      })
      await fs.copy(
        path.join(onZeroTakeout, 'cli.cjs'),
        path.join(onZeroGithub, 'cli.cjs')
      )
      await fs.copy(
        path.join(onZeroTakeout, 'tsconfig.json'),
        path.join(onZeroGithub, 'tsconfig.json')
      )

      // update package.json preserving github-specific fields
      const takeoutPkg = await fs.readJSON(path.join(onZeroTakeout, 'package.json'))
      const githubPkg = await fs.readJSON(path.join(onZeroGithub, 'package.json'))
      const convertDeps = (deps: Record<string, string>) =>
        Object.fromEntries(
          Object.entries(deps || {}).map(([k, v]) => [
            k,
            v.startsWith('workspace:') ? `^${version}` : v,
          ])
        )
      await fs.writeJSON(
        path.join(onZeroGithub, 'package.json'),
        {
          ...takeoutPkg,
          files: githubPkg.files,
          repository: githubPkg.repository,
          homepage: githubPkg.homepage,
          bugs: githubPkg.bugs,
          dependencies: convertDeps(takeoutPkg.dependencies),
          devDependencies: convertDeps(takeoutPkg.devDependencies),
        },
        { spaces: 2 }
      )

      // only commit if there are actual changes
      const status = (await $`git -C ${onZeroGithub} status --porcelain`.text()).trim()
      if (!status) return

      console.info('  → on-zero: syncing out to github')

      if (dryRun) {
        console.info(`    [dry-run] would push: sync: from takeout v${version}`)
        await $`git -C ${onZeroGithub} checkout -- .`
        return
      }

      await $`git -C ${onZeroGithub} add -A`
      await $`git -C ${onZeroGithub} commit -m ${'sync: from takeout v' + version}`
      await $`git -C ${onZeroGithub} push origin main`
    }

    // sync on-zero: copy src from github to takeout, then takeout to github after release
    async function syncOnZero() {
      if (!(await fs.pathExists(onZeroGithub))) return
      const pkg = await fs.readJSON(path.join(onZeroTakeout, 'package.json'))
      await syncOnZeroIn()
      await syncOnZeroOut(pkg.version)
    }

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
          })
      )

      const publishablePackages = allPackageJsons.filter(
        (x) => !x.json.skipPublish && !x.json.private
      )

      return { allPackageJsons, publishablePackages }
    }

    // handle --sync-on-zero standalone mode
    if (syncOnZeroOnly) {
      try {
        await syncOnZero()
      } catch (err) {
        console.error('sync failed:', err)
        process.exit(1)
      }
      return
    }

    // main release flow
    const curVersion = fs.readJSONSync('./packages/helpers/package.json').version

    // must specify version (unless republishing):
    if (!rePublish && !skipVersion && !shouldPatch && !shouldMinor && !shouldMajor) {
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

    try {
      // sync on-zero IN (before release)
      if (!skipOnZeroSync && !finish && !rePublish) {
        await syncOnZeroIn()
      }

      // ensure we are up to date
      // ensure we are on main
      if (!canary) {
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

      if (!finish) {
        console.info(
          `Publishing in order:\n\n${packageJsons.map((x) => x.name).join('\n')}`
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
          })
        )
      }

      if (tamaguiGitUser) {
        await run(`git config --global user.name 'Tamagui'`)
        await run(`git config --global user.email 'tamagui@users.noreply.github.com`)
      }

      console.info('install and build')

      if (!rePublish && !finish) {
        await run(`bun install`)
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
          await run(`bun check:all`)
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
          })
        )
      }

      if (!finish && !rePublish) {
        await run(`git diff`)
      }

      if (!finish) {
        const packDir = path.join(os.tmpdir(), `takeout-release-${nextVersion}`)
        await fs.ensureDir(packDir)

        await pMap(
          packageJsons,
          async ({ name, cwd, json }) => {
            const publishOptions = [canary && `--tag canary`, dryRun && `--dry-run`]
              .filter(Boolean)
              .join(' ')
            const tgzPath = path.join(packDir, `${name.replace('/', '-')}.tgz`)

            // pack with bun (properly converts workspace:* to versions)
            // use swap-exports for packages with build scripts, otherwise just pack
            if (json.scripts?.build) {
              await run(
                `bun run build --swap-exports -- bun pm pack --filename ${tgzPath}`,
                {
                  cwd,
                  silent: true,
                }
              )
            } else {
              await run(`bun pm pack --filename ${tgzPath}`, {
                cwd,
                silent: true,
              })
            }

            // publish the tgz directly
            await run(`npm publish ${tgzPath} ${publishOptions}`.trim(), {
              cwd: packDir,
              silent: true,
            })

            console.info(`${dryRun ? '[dry-run] ' : ''}Published ${name}`)
          },
          {
            concurrency: 15,
          }
        )

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
            })
          )
        }

        // revert version changes after dry-run
        if (dryRun) {
          await run(`git checkout -- packages/*/package.json`, { silent: true })
          console.info('Reverted version changes\n')
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

        // sync on-zero OUT (after release)
        if (!skipOnZeroSync) {
          await syncOnZeroOut(nextVersion)
        }
      }

      console.info(`✅ Done\n`)
    } catch (err) {
      console.info('\nError:\n', err)
      process.exit(1)
    }
  })
