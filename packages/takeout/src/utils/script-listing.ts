/**
 * Utility functions for listing and discovering scripts
 */

import { existsSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import pc from 'picocolors'

// re-export needed functions from script command
import {
  discoverScripts,
  getLocalScriptsDir,
  getScriptMetadata,
} from '../commands/script'

// find scripts package root using import.meta.resolve
function findScriptsPackageRoot(): string | null {
  try {
    const resolved = import.meta.resolve('@take-out/scripts/package.json')
    const packageJsonPath = new URL(resolved).pathname
    const packageRoot = join(packageJsonPath, '..')
    const srcPath = join(packageRoot, 'src')

    if (existsSync(srcPath)) {
      return srcPath
    }
  } catch (err) {
    // scripts package not found, that's ok for hybrid mode
  }

  return null
}

// format script listing
export function formatScriptList(
  title: string,
  scripts: Map<string, string>,
  showDescriptions: boolean = false
): void {
  if (scripts.size === 0) return

  console.info()
  console.info(pc.bold(pc.cyan(title)))
  console.info()

  // group by category
  const categories = new Map<string, Array<[string, string]>>()
  const rootScripts: Array<[string, string]> = []

  for (const [name, path] of scripts) {
    if (name.includes('/')) {
      const parts = name.split('/')
      if (parts.length > 0 && parts[0]) {
        const category = parts[0]
        if (!categories.has(category)) {
          categories.set(category, [])
        }
        categories.get(category)!.push([name, path])
      }
    } else {
      rootScripts.push([name, path])
    }
  }

  // display root scripts
  for (const [name, path] of rootScripts) {
    let line = `  ${pc.green(name)}`

    if (showDescriptions) {
      const metadata = getScriptMetadata(path)
      if (metadata.description) {
        line += pc.dim(` - ${metadata.description}`)
      }
    }

    console.info(line)
  }

  // display categorized scripts
  for (const [category, categoryScripts] of categories) {
    console.info()
    console.info(`  ${pc.yellow(category)}/`)

    for (const [name, path] of categoryScripts) {
      const shortName = name.startsWith(`${category}/`)
        ? name.substring(category.length + 1)
        : name
      let line = `    ${pc.green(shortName)}`

      if (showDescriptions) {
        const metadata = getScriptMetadata(path)
        if (metadata.description) {
          line += pc.dim(` - ${metadata.description}`)
        }
      }

      console.info(line)
    }
  }
}

// list all available scripts (local and built-in)
export function listAllScripts(includeCommands = true): void {
  // show header with description
  console.info()
  console.info(pc.bold(pc.cyan('Takeout CLI - Project Scripts & Commands')))
  console.info()
  console.info(pc.dim('  Manage scripts, run tasks, and configure your project'))
  console.info()

  if (includeCommands) {
    // Show built-in CLI commands
    console.info(pc.bold(pc.cyan('🛠️  Built-in Commands')))
    console.info()
    console.info(`  ${pc.green('onboard')} - Setup wizard for new projects`)
    console.info(`  ${pc.green('docs')} - View documentation`)
    console.info(`  ${pc.green('env:setup')} - Setup environment variables`)
    console.info(`  ${pc.green('run')} - Run scripts in parallel`)
    console.info(`  ${pc.green('script')} - Manage and run scripts`)
    console.info(`  ${pc.green('completion')} - Shell completion setup`)
  }

  const localScripts = discoverScripts(getLocalScriptsDir())
  const builtInDir = findScriptsPackageRoot()
  const builtInScripts = builtInDir ? discoverScripts(builtInDir) : new Map()

  if (localScripts.size > 0) {
    formatScriptList('📁 Local Scripts', localScripts, true)
  }

  if (builtInScripts.size > 0) {
    formatScriptList('📦 Built-in Scripts', builtInScripts, true)
  }

  if (localScripts.size === 0 && builtInScripts.size === 0) {
    console.info()
    console.info(pc.yellow('No scripts found'))
    console.info()
    console.info(
      pc.dim(`Create scripts in ${relative(process.cwd(), getLocalScriptsDir())}/`)
    )
    console.info(pc.dim(`Or install @take-out/scripts package for built-in scripts`))
  }

  console.info()
  console.info(pc.bold('Usage:'))
  console.info(
    `  ${pc.cyan('tko <command>')}           ${pc.dim('Run a built-in command')}`
  )
  console.info(
    `  ${pc.cyan('tko <script-name>')}       ${pc.dim('Execute a script (use / for nested, e.g., tko web/build)')}`
  )
  console.info(`  ${pc.cyan('tko script new <path>')}   ${pc.dim('Create a new script')}`)
  console.info()
  console.info(pc.bold('Examples:'))
  console.info(
    `  ${pc.cyan('tko upgrade/tamagui')}     ${pc.dim('Upgrade Tamagui packages')}`
  )
  console.info(`  ${pc.cyan('tko web/build')}           ${pc.dim('Build web platform')}`)
  console.info(
    `  ${pc.cyan('tko check/types')}         ${pc.dim('Run TypeScript type checking')}`
  )
  console.info()
}

// check if a name is a category and list its scripts
export function listCategoryScripts(categoryName: string): boolean {
  const localDir = getLocalScriptsDir()
  const categoryPath = join(localDir, categoryName)

  if (existsSync(categoryPath) && statSync(categoryPath).isDirectory()) {
    // list scripts in this category
    const categoryScripts = discoverScripts(categoryPath)

    if (categoryScripts.size > 0) {
      console.info()
      console.info(pc.bold(pc.cyan(`📁 ${categoryName} Scripts`)))
      console.info()

      for (const [name, path] of categoryScripts) {
        const shortName = name.replace(`${categoryName}/`, '')
        const metadata = getScriptMetadata(path)
        let line = `  ${pc.green(shortName)}`

        if (metadata.description) {
          line += pc.dim(` - ${metadata.description}`)
        }

        if (metadata.args && metadata.args.length > 0) {
          line += pc.dim(` [${metadata.args.join(', ')}]`)
        }

        console.info(line)
      }

      console.info()
      console.info(pc.dim(`Run: tko ${categoryName}/<name> [args...] to execute`))
      console.info()
    } else {
      console.info()
      console.info(pc.yellow(`No scripts found in ${categoryName}/`))
      console.info()
    }

    return true
  }

  return false
}
