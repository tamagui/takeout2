import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

import { defineCommand, runMain } from 'citty'
import prompts from 'prompts'
import createSpinner from 'yocto-spinner'

const REPO_URL = 'https://github.com/tamagui/takeout-free.git'
const REPO_SSH = 'git@github.com:tamagui/takeout-free.git'

// ansi codes
const bold = (s: string) => `\x1b[1m${s}\x1b[22m`
const dim = (s: string) => `\x1b[2m${s}\x1b[22m`
const green = (s: string) => `\x1b[32m${s}\x1b[39m`
const cyan = (s: string) => `\x1b[36m${s}\x1b[39m`
const yellow = (s: string) => `\x1b[33m${s}\x1b[39m`
const red = (s: string) => `\x1b[31m${s}\x1b[39m`
const orange = (s: string) => `\x1b[38;2;247;104;8m${s}\x1b[39m`
const goldBold = (s: string) => `\x1b[1m\x1b[38;2;245;217;10m${s}\x1b[39m\x1b[22m`
const blueUnderline = (s: string) => `\x1b[4m\x1b[38;2;0;145;255m${s}\x1b[39m\x1b[24m`

const takeoutArt = `
    ┌─────────────────────────┐
    │  ╭─────────────────╮    │
    │  │ 🥡  ${bold(yellow('TAKEOUT'))}  🥡 │    │
    │  ╰─────────────────╯    │
    │    ╲             ╱      │
    │     ╲           ╱       │
    │      ╲         ╱        │
    │       ╲       ╱         │
    │        ╲     ╱          │
    │         ╲   ╱           │
    │          ╲ ╱            │
    └───────────┴─────────────┘
`

const banner = `
${orange(takeoutArt)}
  ${bold('Universal React + React Native Starter')}
  ${dim('Powered by Tamagui, One, Expo & More')}
`

const proMessage = `
${goldBold('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')}

  ${bold('🚀 Want the full experience?')}

  Takeout Pro includes:
  ${green('✓')} SST / AWS deploy
  ${green('✓')} Website with home, docs policy/terms
  ${green('✓')} Errors and analytics
  ${green('✓')} Emailing
  ${green('✓')} A lot more UI
  ${green('✓')} A bunch of screens, settings, profile...
  ${green('✓')} Faster updates, chat support
  ${green('✓')} And much more...

  ${blueUnderline('https://tamagui.dev/takeout')}

${goldBold('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')}
`

async function getProjectName(initialName?: string): Promise<string> {
  if (initialName) {
    return initialName
  }

  const response = await prompts({
    type: 'text',
    name: 'name',
    message: 'Project name:',
    initial: 'my-app',
  })

  if (!response.name) {
    console.info(dim('\nCancelled.'))
    process.exit(0)
  }

  return response.name
}

async function cloneRepo(projectPath: string): Promise<void> {
  const spinner = createSpinner({ text: 'Cloning takeout-free...' }).start()

  try {
    execSync(`git clone --depth 1 ${REPO_URL} "${projectPath}"`, {
      stdio: 'pipe',
    })
  } catch {
    try {
      execSync(`git clone --depth 1 ${REPO_SSH} "${projectPath}"`, {
        stdio: 'pipe',
      })
    } catch (err) {
      spinner.error('Failed to clone repository')
      throw err
    }
  }

  // remove .git folder so user starts fresh
  fs.rmSync(path.join(projectPath, '.git'), { recursive: true, force: true })

  spinner.success('Cloned takeout-free')
}

function updatePackageJson(projectPath: string, projectName: string) {
  const pkgPath = path.join(projectPath, 'package.json')
  if (fs.existsSync(pkgPath)) {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'))
    pkg.name = projectName
    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2))
  }
}

async function installDependencies(projectPath: string) {
  const spinner = createSpinner({ text: 'Installing dependencies with bun...' }).start()

  try {
    execSync('bun install', {
      cwd: projectPath,
      stdio: 'pipe',
    })
    spinner.success('Dependencies installed')
  } catch (err) {
    spinner.error('Failed to install dependencies')
    throw err
  }
}

const main = defineCommand({
  meta: {
    name: 'create-takeout',
    version: '0.0.45',
    description: 'Create a new Takeout app',
  },
  args: {
    directory: {
      type: 'positional',
      description: 'Project directory name',
      required: false,
    },
    info: {
      type: 'boolean',
      description: 'Show Pro information without creating a project',
    },
  },
  async run({ args }) {
    console.info(banner)

    if (args.info) {
      console.info(proMessage)
      return
    }

    const projectName = await getProjectName(args.directory)
    const projectPath = path.resolve(projectName)

    if (fs.existsSync(projectPath)) {
      const files = fs.readdirSync(projectPath)
      if (files.length > 0) {
        console.error(red(`\nDirectory "${projectName}" is not empty.`))
        process.exit(1)
      }
    }

    console.info('')

    await cloneRepo(projectPath)
    updatePackageJson(projectPath, projectName)
    await installDependencies(projectPath)

    console.info(`
${green(bold('✓ Success!'))} Created ${cyan(projectName)}

${bold('Next steps:')}
  ${cyan('cd')} ${projectName}
  ${cyan('bun dev')}
`)

    console.info(proMessage)
  },
})

runMain(main)
