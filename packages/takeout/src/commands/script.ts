/**
 * Script command - run scripts from the package
 */

import { defineCommand } from 'citty'
import {
  existsSync,
  readdirSync,
  statSync,
  readFileSync,
  writeFileSync,
  mkdirSync,
  copyFileSync,
} from 'node:fs'
import { join, relative, dirname, basename } from 'node:path'
import { spawn } from 'node:child_process'
import pc from 'picocolors'

// find scripts package root using import.meta.resolve
function findScriptsPackageRoot(): string {
  try {
    // resolve to package.json to get package root easily
    const resolved = import.meta.resolve('@vxrn/scripts/package.json')
    const packageJsonPath = new URL(resolved).pathname
    const packageRoot = join(packageJsonPath, '..')
    const srcPath = join(packageRoot, 'src')

    if (existsSync(srcPath)) {
      return srcPath
    }
  } catch (err) {
    // if import.meta.resolve fails, fall through to error
  }

  throw new Error('Could not find @vxrn/scripts package')
}

const SCRIPTS_DIR = findScriptsPackageRoot()

function getAllScripts(dir: string, baseDir: string = dir): string[] {
  const scripts: string[] = []

  try {
    const entries = readdirSync(dir)

    for (const entry of entries) {
      const fullPath = join(dir, entry)
      const stat = statSync(fullPath)

      if (stat.isDirectory()) {
        scripts.push(...getAllScripts(fullPath, baseDir))
      } else if (entry.endsWith('.ts') || entry.endsWith('.js')) {
        const relativePath = relative(baseDir, fullPath)
        scripts.push(relativePath)
      }
    }
  } catch (err) {
    console.error(pc.red(`Error reading directory ${dir}: ${err}`))
  }

  return scripts
}

const listCommand = defineCommand({
  meta: {
    name: 'list',
    description: 'List all available scripts',
  },
  async run() {
    if (!existsSync(SCRIPTS_DIR)) {
      console.error(pc.red('✗ Scripts directory not found'))
      process.exit(1)
    }

    const scripts = getAllScripts(SCRIPTS_DIR).sort()

    console.info()
    console.info(pc.bold(pc.cyan('⚙️  Available Scripts')))
    console.info()

    for (const script of scripts) {
      const name = script.replace(/\.(ts|js)$/, '')
      console.info(`  ${pc.green(name)}`)
    }

    console.info()
    console.info(pc.dim(`Use 'takeout script run <name> [args...]' to run a script`))
    console.info()
  },
})

const runCommand = defineCommand({
  meta: {
    name: 'run',
    description: 'Run a specific script',
  },
  args: {
    name: {
      type: 'positional',
      description: 'Name of the script to run (without extension)',
      required: true,
    },
    args: {
      type: 'positional',
      description: 'Arguments to pass to the script',
      required: false,
    },
  },
  async run({ args, rawArgs }) {
    const scriptName = args.name
    let scriptPath: string | null = null

    // try to find the script with various extensions
    for (const ext of ['.ts', '.js', '']) {
      const testPath = join(SCRIPTS_DIR, `${scriptName}${ext}`)
      if (existsSync(testPath)) {
        scriptPath = testPath
        break
      }
    }

    if (!scriptPath) {
      console.error(pc.red(`✗ Script not found: ${scriptName}`))
      console.info()
      console.info(pc.dim(`Use 'takeout script list' to see available scripts`))
      process.exit(1)
    }

    // extract args after the script name
    const scriptArgs = rawArgs.slice(rawArgs.indexOf(scriptName) + 1)

    console.info(pc.dim(`Running: ${relative(process.cwd(), scriptPath)}`))
    console.info()

    // run the script using bun
    const child = spawn('bun', [scriptPath, ...scriptArgs], {
      stdio: 'inherit',
      cwd: process.cwd(),
      env: process.env,
    })

    return new Promise<void>((resolve, reject) => {
      child.on('exit', (code) => {
        if (code !== 0) {
          process.exit(code || 1)
        }
        resolve()
      })

      child.on('error', (err) => {
        console.error(pc.red(`✗ Error running script: ${err}`))
        reject(err)
      })
    })
  },
})

const pathCommand = defineCommand({
  meta: {
    name: 'path',
    description: 'Get the absolute path to a script file',
  },
  args: {
    name: {
      type: 'positional',
      description: 'Name of the script (without extension)',
      required: false,
    },
  },
  async run({ args }) {
    if (!args.name) {
      // return scripts directory path
      console.info(SCRIPTS_DIR)
      return
    }

    let scriptPath: string | null = null

    // try to find the script with various extensions
    for (const ext of ['.ts', '.js', '']) {
      const testPath = join(SCRIPTS_DIR, `${args.name}${ext}`)
      if (existsSync(testPath)) {
        scriptPath = testPath
        break
      }
    }

    if (!scriptPath) {
      console.error(pc.red(`✗ Script not found: ${args.name}`))
      process.exit(1)
    }

    console.info(scriptPath)
  },
})

const sourceCommand = defineCommand({
  meta: {
    name: 'source',
    description: 'Display the source code of a script',
  },
  args: {
    name: {
      type: 'positional',
      description: 'Name of the script (without extension)',
      required: true,
    },
  },
  async run({ args }) {
    let scriptPath: string | null = null

    // try to find the script with various extensions
    for (const ext of ['.ts', '.js', '']) {
      const testPath = join(SCRIPTS_DIR, `${args.name}${ext}`)
      if (existsSync(testPath)) {
        scriptPath = testPath
        break
      }
    }

    if (!scriptPath) {
      console.error(pc.red(`✗ Script not found: ${args.name}`))
      console.info()
      console.info(pc.dim(`Use 'takeout script list' to see available scripts`))
      process.exit(1)
    }

    const source = readFileSync(scriptPath, 'utf-8')
    console.info(source)
  },
})

const ejectCommand = defineCommand({
  meta: {
    name: 'eject',
    description:
      'Eject a script to local scripts/ folder and update package.json references',
  },
  args: {
    name: {
      type: 'positional',
      description: 'Name of the script to eject (without extension)',
      required: true,
    },
  },
  async run({ args }) {
    const scriptName = args.name
    let scriptPath: string | null = null
    let scriptExt = ''

    // try to find the script with various extensions
    for (const ext of ['.ts', '.js']) {
      const testPath = join(SCRIPTS_DIR, `${scriptName}${ext}`)
      if (existsSync(testPath)) {
        scriptPath = testPath
        scriptExt = ext
        break
      }
    }

    if (!scriptPath) {
      console.error(pc.red(`✗ Script not found: ${scriptName}`))
      console.info()
      console.info(pc.dim(`Use 'takeout script list' to see available scripts`))
      process.exit(1)
    }

    const cwd = process.cwd()
    const localScriptsDir = join(cwd, 'scripts')

    // check if script has a subdirectory (e.g., aws/configure-aws-prod)
    const scriptRelativePath = relative(SCRIPTS_DIR, scriptPath)
    const scriptDir = dirname(scriptRelativePath)
    const scriptBasename = basename(scriptPath)

    // create scripts directory and subdirectories if needed
    const targetDir =
      scriptDir !== '.' ? join(localScriptsDir, scriptDir) : localScriptsDir
    if (!existsSync(targetDir)) {
      mkdirSync(targetDir, { recursive: true })
    }

    const targetPath = join(targetDir, scriptBasename)

    // check if file already exists
    if (existsSync(targetPath)) {
      console.error(pc.red(`✗ Script already exists at ${relative(cwd, targetPath)}`))
      process.exit(1)
    }

    // copy the script
    copyFileSync(scriptPath, targetPath)
    console.info(pc.green(`✓ Ejected script to ${relative(cwd, targetPath)}`))

    // update package.json if it exists
    const packageJsonPath = join(cwd, 'package.json')
    if (existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'))

      if (packageJson.scripts) {
        let updated = false
        const scriptNameWithoutExt = scriptName.replace(/\.(ts|js)$/, '')

        // look for any script that uses "takeout script run {name}"
        for (const [key, value] of Object.entries(packageJson.scripts)) {
          if (typeof value === 'string') {
            // match patterns like "takeout script run scriptname" or "takeout script run folder/scriptname"
            const pattern = new RegExp(
              `takeout script run ${scriptNameWithoutExt.replace(/\//g, '\\/')}(?!\\S)`,
              'g'
            )
            if (pattern.test(value)) {
              const newValue = value.replace(pattern, `./${relative(cwd, targetPath)}`)
              packageJson.scripts[key] = newValue
              updated = true
              console.info(pc.cyan(`  Updated script "${key}"`))
            }
          }
        }

        if (updated) {
          writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n')
          console.info(pc.green('✓ Updated package.json'))
        } else {
          console.info(pc.dim('  No package.json scripts reference this script'))
        }
      }
    }

    console.info()
    console.info(pc.dim(`You can now edit the script at ${relative(cwd, targetPath)}`))
  },
})

export const scriptCommand = defineCommand({
  meta: {
    name: 'script',
    description: 'List and run Takeout scripts',
  },
  subCommands: {
    list: listCommand,
    run: runCommand,
    path: pathCommand,
    source: sourceCommand,
    eject: ejectCommand,
  },
})
