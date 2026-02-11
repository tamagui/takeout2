/**
 * Utility functions for listing and discovering scripts
 */

import { existsSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

import pc from 'picocolors'

import {
  type ScriptMetadata,
  discoverScripts,
  getAllScriptMetadata,
  getLocalScriptsDir,
} from './script-utils'

// find scripts package root using import.meta.resolve
function findScriptsPackageRoot(): string | null {
  try {
    const resolved = import.meta.resolve('@take-out/scripts/package.json')
    const packageJsonPath = fileURLToPath(new URL(resolved))
    const packageRoot = join(packageJsonPath, '..')
    const srcPath = join(packageRoot, 'src')

    if (existsSync(srcPath)) {
      return srcPath
    }
  } catch {
    // scripts package not found
  }

  return null
}

// format script listing with pre-fetched metadata
function formatScriptList(
  title: string,
  scripts: Map<string, string>,
  metadata: Map<string, ScriptMetadata>
): void {
  if (scripts.size === 0) return

  console.info()
  console.info(pc.bold(pc.cyan(title)))
  console.info()

  const categories = new Map<string, Array<[string, string]>>()
  const rootScripts: Array<[string, string]> = []

  for (const [name, path] of scripts) {
    if (name.includes('/')) {
      const category = name.split('/')[0]!
      if (!categories.has(category)) {
        categories.set(category, [])
      }
      categories.get(category)!.push([name, path])
    } else {
      rootScripts.push([name, path])
    }
  }

  for (const [name] of rootScripts) {
    let line = `  ${pc.green(name)}`
    const meta = metadata.get(name)
    if (meta?.description) {
      line += pc.dim(` - ${meta.description}`)
    }
    console.info(line)
  }

  for (const [category, categoryScripts] of categories) {
    console.info()
    console.info(`  ${pc.yellow(category)}/`)

    for (const [name] of categoryScripts) {
      const shortName = name.substring(category.length + 1)
      let line = `    ${pc.green(shortName)}`
      const meta = metadata.get(name)
      if (meta?.description) {
        line += pc.dim(` - ${meta.description}`)
      }
      console.info(line)
    }
  }
}

// list all available scripts
export async function listAllScripts(includeCommands = true) {
  console.info()
  console.info(pc.bold(pc.cyan('Takeout CLI - Project Scripts & Commands')))
  console.info()
  console.info(pc.dim('  Manage scripts, run tasks, and configure your project'))
  console.info()

  if (includeCommands) {
    console.info(pc.bold(pc.cyan('Built-in Commands')))
    console.info()
    console.info(`  ${pc.green('onboard')} - Setup wizard for new projects`)
    console.info(`  ${pc.green('docs')} - View documentation`)
    console.info(`  ${pc.green('env:setup')} - Setup environment variables`)
    console.info(`  ${pc.green('run')} - Run scripts in parallel`)
    console.info(`  ${pc.green('script')} - Manage and run scripts`)
    console.info(`  ${pc.green('skills')} - Manage Claude Code skills`)
    console.info(`  ${pc.green('sync')} - Sync fork with upstream Takeout`)
    console.info(`  ${pc.green('changed')} - Show changes since last sync`)
    console.info(`  ${pc.green('completion')} - Shell completion setup`)
  }

  const localScripts = discoverScripts(getLocalScriptsDir())
  const builtInDir = findScriptsPackageRoot()
  const builtInScripts = builtInDir ? discoverScripts(builtInDir) : new Map()

  const allScripts = new Map([...localScripts, ...builtInScripts])
  const metadata = await getAllScriptMetadata(allScripts)

  if (localScripts.size > 0) {
    formatScriptList('Local Scripts', localScripts, metadata)
  }

  if (builtInScripts.size > 0) {
    formatScriptList('Built-in Scripts', builtInScripts, metadata)
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
    `  ${pc.cyan('tko <script-name>')}       ${pc.dim('Execute direct script')}`
  )
  console.info(
    `  ${pc.cyan('tko <group> <script>')}    ${pc.dim('Execute nested script')}`
  )
  console.info(`  ${pc.cyan('tko script new <path>')}   ${pc.dim('Create a new script')}`)
  console.info()
}

// check if a name is a category and list its scripts
export async function listCategoryScripts(categoryName: string): Promise<boolean> {
  const localDir = getLocalScriptsDir()
  const categoryPath = join(localDir, categoryName)

  if (existsSync(categoryPath) && statSync(categoryPath).isDirectory()) {
    const categoryScripts = discoverScripts(categoryPath)

    if (categoryScripts.size > 0) {
      const metadata = await getAllScriptMetadata(categoryScripts)

      console.info()
      console.info(pc.bold(pc.cyan(`${categoryName} Scripts`)))
      console.info()

      for (const [name] of categoryScripts) {
        const shortName = name.replace(`${categoryName}/`, '')
        const meta = metadata.get(name)
        let line = `  ${pc.green(shortName)}`

        if (meta?.description) {
          line += pc.dim(` - ${meta.description}`)
        }

        if (meta?.args && meta.args.length > 0) {
          line += pc.dim(` [${meta.args.join(', ')}]`)
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
