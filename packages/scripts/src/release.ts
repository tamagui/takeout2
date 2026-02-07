import { homedir, tmpdir } from 'node:os'
import path, { join } from 'node:path'

// note! this is an helper script used by tamagui team for publishing the takeout packages
// you can delete this from your own app

import { run } from '@take-out/scripts/helpers/run'
import { $ } from 'bun'
import fs, { writeJSON } from 'fs-extra'
import pMap from 'p-map'

// avoid emitter error
process.setMaxListeners(50)
process.stderr.setMaxListeners(50)
process.stdout.setMaxListeners(50)

// on-zero sync paths
const onZeroGithub = join(homedir(), 'github', 'on-zero')
const onZeroTakeout = join(process.cwd(), 'packages', 'on-zero')

// for failed publishes that need to re-run
const reRun = process.argv.includes('--rerun')
const rePublish = reRun || process.argv.includes('--republish')
const finish = process.argv.includes('--finish')
const skipFinish = process.argv.includes('--skip-finish')

const canary = process.argv.includes('--canary')
const skipVersion = finish || rePublish || process.argv.includes('--skip-version')
const shouldMajor = process.argv.includes('--major')
const shouldMinor = process.argv.includes('--minor')
const shouldPatch = process.argv.includes('--patch')
const dirty = finish || process.argv.includes('--dirty')
const skipTest =
  finish ||
  rePublish ||
  process.argv.includes('--skip-test') ||
  process.argv.includes('--skip-tests')
const skipBuild = finish || rePublish || process.argv.includes('--skip-build')
const dryRun = process.argv.includes('--dry-run')
const tamaguiGitUser = process.argv.includes('--tamagui-git-user')
const syncOnZeroOnly = process.argv.includes('--sync-on-zero')
const skipOnZeroSync = process.argv.includes('--skip-on-zero-sync')

// handle --sync-on-zero standalone mode
if (syncOnZeroOnly) {
  syncOnZero().catch((err) => {
    console.error('sync failed:', err)
    process.exit(1)
  })
} else {
  mainRelease()
}

async function mainRelease() {
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
          const distDir = join(cwd, 'dist')
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

    if (!skipVersion && !finish) {
      await Promise.all(
        allPackageJsons.map(async ({ json, path }) => {
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

          await writeJSON(path, next, { spaces: 2 })
        })
      )
    }

    if (!finish && !rePublish) {
      await run(`git diff`)
    }

    if (!finish) {
      const packDir = join(tmpdir(), `takeout-release-${nextVersion}`)
      await fs.ensureDir(packDir)

      await pMap(
        packageJsons,
        async ({ name, cwd, json }) => {
          const publishOptions = [canary && `--tag canary`, dryRun && `--dry-run`]
            .filter(Boolean)
            .join(' ')
          const tgzPath = join(packDir, `${name.replace('/', '-')}.tgz`)

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
          allPackageJsons.map(async ({ json, path }) => {
            const current = await fs.readJSON(path)
            for (const field of [
              'dependencies',
              'devDependencies',
              'optionalDependencies',
              'peerDependencies',
            ]) {
              const origDeps = json[field]
              const currentDeps = current[field]
              if (!origDeps || !currentDeps) continue
              for (const depName in origDeps) {
                if (origDeps[depName].startsWith('workspace:') && currentDeps[depName]) {
                  currentDeps[depName] = origDeps[depName]
                }
              }
            }
            await writeJSON(path, current, { spaces: 2 })
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
}

// sync on-zero: copy src from github to takeout, then takeout to github after release
async function syncOnZero() {
  if (!(await fs.pathExists(onZeroGithub))) return
  const pkg = await fs.readJSON(join(onZeroTakeout, 'package.json'))
  await syncOnZeroIn()
  await syncOnZeroOut(pkg.version)
}

async function syncOnZeroIn() {
  if (!(await fs.pathExists(onZeroGithub))) return

  // check if there are commits after the last sync commit
  const log = (await $`git -C ${onZeroGithub} log --oneline --format=%s`.text()).trim()
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

  await fs.copy(join(onZeroGithub, 'src'), join(onZeroTakeout, 'src'), {
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
  await fs.copy(join(onZeroTakeout, 'src'), join(onZeroGithub, 'src'), {
    overwrite: true,
  })
  await fs.copy(join(onZeroTakeout, 'cli.cjs'), join(onZeroGithub, 'cli.cjs'))
  await fs.copy(join(onZeroTakeout, 'tsconfig.json'), join(onZeroGithub, 'tsconfig.json'))

  // update package.json preserving github-specific fields
  const takeoutPkg = await fs.readJSON(join(onZeroTakeout, 'package.json'))
  const githubPkg = await fs.readJSON(join(onZeroGithub, 'package.json'))
  const convertDeps = (deps: Record<string, string>) =>
    Object.fromEntries(
      Object.entries(deps || {}).map(([k, v]) => [
        k,
        v.startsWith('workspace:') ? `^${version}` : v,
      ])
    )
  await fs.writeJSON(
    join(onZeroGithub, 'package.json'),
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

async function getWorkspacePackages() {
  // read workspaces from root package.json
  const rootPackageJson = await fs.readJSON(join(process.cwd(), 'package.json'))
  const workspaceGlobs = rootPackageJson.workspaces || []

  // resolve workspace paths
  const packagePaths: { name: string; location: string }[] = []
  for (const glob of workspaceGlobs) {
    if (glob.includes('*')) {
      // handle glob patterns like "./packages/*"
      const baseDir = glob.replace('/*', '')
      const fullPath = join(process.cwd(), baseDir)
      if (await fs.pathExists(fullPath)) {
        const dirs = await fs.readdir(fullPath)
        for (const dir of dirs) {
          const pkgPath = join(fullPath, dir, 'package.json')
          if (await fs.pathExists(pkgPath)) {
            const pkg = await fs.readJSON(pkgPath)
            packagePaths.push({
              name: pkg.name,
              location: join(baseDir, dir),
            })
          }
        }
      }
    } else {
      // handle direct paths like "./src/start"
      const pkgPath = join(process.cwd(), glob, 'package.json')
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
