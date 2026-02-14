/**
 * Core utility functions for script discovery and metadata
 */

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

import { setInterceptCmd } from '@take-out/scripts/cmd'

export interface ScriptMetadata {
  description?: string
  args?: string[]
}

// get local scripts directory
export function getLocalScriptsDir(): string {
  return join(process.cwd(), 'scripts')
}

// batch extract metadata for all scripts via import interception
export async function getAllScriptMetadata(
  scripts: Map<string, string>
): Promise<Map<string, ScriptMetadata>> {
  const collected = new Map<string, { description: string; args?: string }>()
  let currentName = ''

  // interceptor stays set — never cleared so floating .run() promises always bail
  setInterceptCmd((info) => {
    collected.set(currentName, info)
  })

  for (const [name, path] of scripts) {
    // only import scripts that use cmd (safe to import)
    try {
      const head = readFileSync(path, 'utf-8').slice(0, 200)
      if (!head.includes('cmd')) continue
    } catch {
      continue
    }

    currentName = name
    try {
      await import(path)
    } catch {}
  }

  const results = new Map<string, ScriptMetadata>()
  for (const [name, info] of collected) {
    const metadata: ScriptMetadata = { description: info.description }
    if (info.args) {
      const flags = [...info.args.matchAll(/--?([a-z-]+)/gi)]
      if (flags.length > 0) {
        metadata.args = flags.map((m) => `--${m[1]}`)
      }
    }
    results.set(name, metadata)
  }

  return results
}

// discover scripts in a directory (no grandchildren)
export function discoverScripts(dir: string, baseDir: string = dir): Map<string, string> {
  const scripts = new Map<string, string>()

  if (!existsSync(dir)) {
    return scripts
  }

  try {
    const entries = readdirSync(dir)

    for (const entry of entries) {
      const fullPath = join(dir, entry)
      const stat = statSync(fullPath)

      if (stat.isDirectory()) {
        if (entry === 'helpers' || entry === 'internal') continue
        // one level deep only
        const subEntries = readdirSync(fullPath)
        for (const subEntry of subEntries) {
          const subPath = join(fullPath, subEntry)
          if (
            statSync(subPath).isFile() &&
            (subEntry.endsWith('.ts') || subEntry.endsWith('.js'))
          ) {
            const relativePath = relative(baseDir, subPath).split('\\').join('/')
            const scriptName = relativePath.replace(/\.(ts|js)$/, '')
            scripts.set(scriptName, subPath)
          }
        }
      } else if (entry.endsWith('.ts') || entry.endsWith('.js')) {
        const relativePath = relative(baseDir, fullPath).split('\\').join('/')
        const scriptName = relativePath.replace(/\.(ts|js)$/, '')
        scripts.set(scriptName, fullPath)
      }
    }
  } catch {
    // ignore directory read errors
  }

  return scripts
}
