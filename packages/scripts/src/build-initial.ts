#!/usr/bin/env bun

import { cmd } from './cmd'

await cmd`bootstrap project workspace and build initial packages`.run(
  async ({ $, fs, path }) => {
    // use our own file because we know its takeout-like packages if it exists
    const hasPackages = fs.existsSync(`./packages/scripts/src/build-initial.ts`)

    // only run once
    if (!fs.existsSync(`./node_modules/.bin/tko`)) {
      if (hasPackages) {
        symlinkBins()
      }
    }

    // check if critical packages are built
    if (hasPackages) {
      const needsBuild =
        !fs.existsSync(`./packages/helpers/dist`) ||
        !fs.existsSync(`./packages/cli/dist/esm`)

      if (needsBuild) {
        // build helpers first as other packages depend on it
        await $`cd packages/helpers && bun run build`

        // then build all other packages in parallel
        await $`bun ./packages/scripts/src/run.ts build --no-root`
      }
    }

    // show welcome message if not onboarded
    checkAndShowWelcome()

    function checkAndShowWelcome(cwd: string = process.cwd()): void {
      try {
        const packagePath = path.join(cwd, 'package.json')
        const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf-8'))

        if (pkg.takeout?.onboarded === false) {
          console.info()
          console.info(`
████████╗ █████╗ ██╗  ██╗███████╗ ██████╗ ██╗   ██╗████████╗
╚══██╔══╝██╔══██╗██║ ██╔╝██╔════╝██╔═══██╗██║   ██║╚══██╔══╝
   ██║   ███████║█████╔╝ █████╗  ██║   ██║██║   ██║   ██║
   ██║   ██╔══██║██╔═██╗ ██╔══╝  ██║   ██║██║   ██║   ██║
   ██║   ██║  ██║██║  ██╗███████╗╚██████╔╝╚██████╔╝   ██║
   ╚═╝   ╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝ ╚═════╝  ╚═════╝    ╚═╝
                        麵 碼 飯
`)
          console.info()
          console.info('  welcome to takeout! 🥡')
          console.info()
          console.info('  run \x1b[32mbun onboard\x1b[0m to get things set up')
          console.info()
        }
      } catch {
        // silently fail if package.json doesn't exist or is malformed
      }
    }

    function symlinkBins() {
      // workaround for https://github.com/oven-sh/bun/issues/19782
      const packagesWithCLI = [
        { name: 'cli', cliFile: 'cli.mjs', alias: 'tko' },
        { name: 'postgres', cliFile: 'cli.cjs' },
      ]

      const binDir = path.join(process.cwd(), 'node_modules', '.bin')

      if (!fs.existsSync(binDir)) {
        fs.mkdirSync(binDir, { recursive: true })
      }

      for (const pkg of packagesWithCLI) {
        const binPath = path.join(binDir, pkg.name)
        const sourcePath = path.join(process.cwd(), 'packages', pkg.name, pkg.cliFile)
        symlinkTo(sourcePath, binPath)

        if (pkg.alias) {
          const aliasPath = path.join(binDir, pkg.alias)
          symlinkTo(sourcePath, aliasPath)
        }
      }

      function symlinkTo(source: string, target: string): void {
        if (fs.existsSync(target)) {
          console.info(`✓ Symlink already exists: ${target}`)
          return
        }

        fs.symlinkSync(source, target)
        console.info(`→ Created symlink: ${source} ⇢ ${target}`)
      }
    }
  }
)
