/**
 * Check command - run code quality checks by discovering scripts in scripts/check/
 */

import { defineCommand } from 'citty'
import { spawn } from 'node:child_process'
import { existsSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import pc from 'picocolors'
import * as p from '@clack/prompts'

// colors for parallel output
const colors = [pc.cyan, pc.magenta, pc.yellow, pc.green, pc.blue, pc.red]

function discoverCheckScripts(): Map<string, string> {
  const checksDir = join(process.cwd(), 'scripts', 'check')
  const scripts = new Map<string, string>()

  if (!existsSync(checksDir)) {
    return scripts
  }

  const entries = readdirSync(checksDir)
  for (const entry of entries) {
    if (entry.endsWith('.ts') || entry.endsWith('.js')) {
      const name = entry.replace(/\.(ts|js)$/, '')
      const path = join(checksDir, entry)
      scripts.set(name, path)
    }
  }

  return scripts
}

function getScriptMetadata(scriptPath: string): { description?: string } {
  try {
    const { readFileSync } = require('node:fs')
    const content = readFileSync(scriptPath, 'utf8')
    const descMatch = content.match(/@description\s+(.+)/)
    return {
      description: descMatch ? descMatch[1] : undefined,
    }
  } catch {
    return {}
  }
}

function runCheckScript(
  name: string,
  scriptPath: string,
  colorFn?: (str: string) => string
): Promise<number> {
  return new Promise((resolve) => {
    const prefix = colorFn ? colorFn(`[${name}]`) : `[${name}]`

    const child = spawn('bun', [scriptPath], {
      shell: false,
      stdio: 'pipe',
    })

    child.stdout?.on('data', (data: Buffer) => {
      const lines = data.toString().split('\n').filter(Boolean)
      lines.forEach((line: string) => {
        console.info(`${prefix} ${line}`)
      })
    })

    child.stderr?.on('data', (data: Buffer) => {
      const lines = data.toString().split('\n').filter(Boolean)
      lines.forEach((line: string) => {
        console.error(`${prefix} ${line}`)
      })
    })

    child.on('exit', (code) => {
      resolve(code || 0)
    })
  })
}

async function runAllChecks(): Promise<void> {
  const scripts = discoverCheckScripts()

  if (scripts.size === 0) {
    console.error(pc.yellow('No check scripts found in scripts/check/'))
    process.exit(1)
  }

  console.info()
  p.intro(pc.bgCyan(pc.black(' Running All Checks ')))
  console.info()

  const results: { name: string; code: number }[] = []

  // run all checks in parallel
  const promises = Array.from(scripts.entries()).map(([name, path], index) => {
    const colorFn = colors[index % colors.length]
    const metadata = getScriptMetadata(path)
    const description = metadata.description || `Run ${name} check`

    console.info(`${colorFn ? colorFn('→') : '→'} Starting ${description}...`)

    return runCheckScript(name, path, colorFn).then((code) => {
      results.push({ name, code })
      return code
    })
  })

  await Promise.all(promises)

  // display results
  console.info()
  console.info(pc.bold('Results:'))
  console.info()

  let hasFailures = false
  for (const result of results) {
    const icon = result.code === 0 ? pc.green('✓') : pc.red('✗')
    const status = result.code === 0 ? pc.green('passed') : pc.red('failed')
    console.info(`  ${icon} ${result.name} ${status}`)

    if (result.code !== 0) {
      hasFailures = true
    }
  }

  console.info()
  if (hasFailures) {
    p.outro(pc.red('Some checks failed!'))
    process.exit(1)
  } else {
    p.outro(pc.green('All checks passed!'))
  }
}

function listChecks(): void {
  const scripts = discoverCheckScripts()

  console.info()
  console.info(pc.bold(pc.cyan('📁 check Scripts')))
  console.info()

  if (scripts.size === 0) {
    console.info(pc.yellow('No check scripts found in scripts/check/'))
  } else {
    for (const [name, path] of scripts) {
      const metadata = getScriptMetadata(path)
      let line = `  ${pc.green(name)}`

      if (metadata.description) {
        line += pc.dim(` - ${metadata.description}`)
      }

      console.info(line)
    }
  }

  console.info()
  console.info(pc.dim('Run: tko check <name> [args...]'))
  console.info(pc.dim('Or:  tko run check/<name> [args...] to execute'))
  console.info(pc.dim('Or:  tko check --all to run all checks in parallel'))
  console.info()
}

export const doctorCommand = defineCommand({
  meta: {
    name: 'check',
    description: 'Run code quality checks',
  },
  args: {
    check: {
      type: 'positional',
      description: 'Specific check to run',
      required: false,
    },
    all: {
      type: 'boolean',
      description: 'Run all checks',
      default: false,
    },
  },
  async run({ args }) {
    // if --all flag is set, run all checks
    if (args.all) {
      await runAllChecks()
      return
    }

    // if specific check is requested
    if (args.check) {
      const scripts = discoverCheckScripts()
      const scriptPath = scripts.get(args.check)

      if (!scriptPath) {
        console.error(pc.red(`Unknown check: ${args.check}`))
        listChecks()
        process.exit(1)
      }

      const metadata = getScriptMetadata(scriptPath)
      const description = metadata.description || `Run ${args.check} check`

      console.info(pc.dim(`Running: ${description}`))
      console.info()

      const code = await runCheckScript(args.check, scriptPath)

      if (code !== 0) {
        console.info()
        console.error(pc.red(`${args.check} check failed!`))
        process.exit(code)
      } else {
        console.info()
        console.info(pc.green(`${args.check} check passed!`))
      }

      return
    }

    // no specific check requested, list available checks
    listChecks()
  },
})
