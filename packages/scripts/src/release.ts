import { tmpdir } from 'node:os'
import path, { join } from 'node:path'

// note! this is an helper script used by tamagui team for publishing the takeout packages
// you can delete this from your own app

import { run } from '@take-out/scripts/helpers/run'
import fs, { writeJSON } from 'fs-extra'
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
    }

    console.info(`✅ Done\n`)
  } catch (err) {
    console.info('\nError:\n', err)
    process.exit(1)
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
