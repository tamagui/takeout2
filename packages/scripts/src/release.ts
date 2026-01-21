import path, { join } from 'node:path'

// note! this is an helper script used by tamagui team for publishing the takeout packages
// you can delete this from your own app

import { run } from '@take-out/scripts/helpers/run'
import fs, { ensureDir, writeJSON } from 'fs-extra'
import pMap from 'p-map'

// avoid emitter error
process.setMaxListeners(50)
process.stderr.setMaxListeners(50)
process.stdout.setMaxListeners(50)

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

async function main() {
  try {
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
        await run(`bun check`)
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
              // only update non-workspace internal dependencies
              if (!nextDeps[depName].startsWith('workspace:')) {
                if (allPackageJsons.some((p) => p.name === depName)) {
                  nextDeps[depName] = nextVersion
                }
              }
            }
          }

          await writeJSON(path, next, { spaces: 2 })
        })
      )
    }

    if (!finish && dryRun) {
      console.info(`Dry run, exiting before publish`)
      return
    }

    if (!finish && !rePublish) {
      await run(`git diff`)
    }

    if (!finish) {
      const tmpDir = `/tmp/one-publish`
      await ensureDir(tmpDir)

      await pMap(
        packageJsons,
        async ({ name, cwd }) => {
          const publishOptions = [canary && `--tag canary`].filter(Boolean).join(' ')

          // pack with workspace:* converted to versions
          const tmpPackageDir = join(tmpDir, name.replace('/', '_'))
          await fs.copy(cwd, tmpPackageDir, {
            filter: (src) => {
              // exclude node_modules to avoid symlink issues
              return !src.includes('node_modules')
            },
          })

          // replace workspace:* with version
          const pkgJsonPath = join(tmpPackageDir, 'package.json')
          const pkgJson = await fs.readJSON(pkgJsonPath)
          for (const field of [
            'dependencies',
            'devDependencies',
            'optionalDependencies',
            'peerDependencies',
          ]) {
            if (!pkgJson[field]) continue
            for (const depName in pkgJson[field]) {
              if (pkgJson[field][depName].startsWith('workspace:')) {
                pkgJson[field][depName] = nextVersion
              }
            }
          }
          await writeJSON(pkgJsonPath, pkgJson, { spaces: 2 })

          const filename = `${name.replace('/', '_')}-package.tmp.tgz`
          const absolutePath = `${tmpDir}/${filename}`
          await run(`npm pack --pack-destination ${tmpDir}`, {
            cwd: tmpPackageDir,
            silent: true,
          })

          // rename npm's output to our expected filename
          const npmFilename = `${name.replace('@', '').replace('/', '-')}-${nextVersion}.tgz`
          await fs.rename(join(tmpDir, npmFilename), absolutePath)

          const publishCommand = ['npm publish', absolutePath, publishOptions]
            .filter(Boolean)
            .join(' ')

          console.info(`Publishing ${name}: ${publishCommand}`)

          await run(publishCommand, {
            cwd: tmpDir,
          }).catch((err) => console.error(err))
        },
        {
          concurrency: 15,
        }
      )

      console.info(`✅ Published\n`)
    }

    if (!skipFinish) {
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

    // update downstream repos if they exist
    if (!canary) {
      await updateDownstreamRepos()
    }
  } catch (err) {
    console.info('\nError:\n', err)
    process.exit(1)
  }
}

async function updateDownstreamRepos() {
  const homeDir = process.env.HOME || process.env.USERPROFILE || ''
  const downstreamRepos = [join(homeDir, 'takeout-free'), join(homeDir, 'takeout-static')]

  for (const repoPath of downstreamRepos) {
    if (!(await fs.pathExists(repoPath))) {
      continue
    }

    console.info(`\n📦 Found downstream repo: ${repoPath}`)

    try {
      // check for uncommitted changes
      const statusOut = await run(`git status --porcelain`, {
        cwd: repoPath,
        silent: true,
      })
      if (statusOut.stdout.trim()) {
        console.warn(`  ⚠️  Skipping ${repoPath}: has uncommitted changes`)
        continue
      }

      // pull latest
      console.info(`  Pulling latest...`)
      try {
        await run(`git pull --rebase origin HEAD`, { cwd: repoPath, silent: true })
      } catch (err) {
        console.warn(`  ⚠️  Skipping ${repoPath}: failed to pull from origin`)
        continue
      }

      // run upgrade
      console.info(`  Running upgrade/takeout...`)
      await run(`bun tko upgrade/takeout`, { cwd: repoPath })

      // run check:all
      console.info(`  Running check:all...`)
      try {
        await run(`bun check:all`, { cwd: repoPath })
        console.info(`  ✅ ${repoPath} upgraded successfully`)
      } catch (err) {
        console.warn(
          `  ⚠️  ${repoPath}: check:all failed after upgrade, please review manually`
        )
        // reset the changes since check failed
        await run(`git checkout .`, { cwd: repoPath, silent: true })
      }
    } catch (err) {
      console.warn(`  ⚠️  Error updating ${repoPath}:`, err)
    }
  }
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

main()
