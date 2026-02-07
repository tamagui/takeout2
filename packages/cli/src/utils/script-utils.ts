/**
 * Core utility functions for script discovery and metadata
 */

import {
  existsSync,
  readdirSync,
  statSync,
  readFileSync,
  writeFileSync,
  mkdirSync,
} from 'node:fs'
import { homedir } from 'node:os'
import { join, relative } from 'node:path'

// cache configuration
const CACHE_DIR = join(homedir(), '.takeout')
const CACHE_FILE = join(CACHE_DIR, 'script-cache.json')

interface ScriptMetadata {
  description?: string
  args?: string[]
  mtime?: number
}

interface ScriptCache {
  [path: string]: ScriptMetadata
}

// get local scripts directory
export function getLocalScriptsDir(): string {
  return join(process.cwd(), 'scripts')
}

// extract metadata from script file
function extractMetadata(filePath: string): ScriptMetadata {
  try {
    const content = readFileSync(filePath, 'utf-8')
    const lines = content.split('\n').slice(0, 20) // check first 20 lines

    const metadata: ScriptMetadata = {}

    for (const line of lines) {
      // look for @description comment
      const descMatch = line.match(/@description\s+(.+)/)
      if (descMatch && descMatch[1]) {
        metadata.description = descMatch[1].trim()
      }

      // look for @args comment
      const argsMatch = line.match(/@args\s+(.+)/)
      if (argsMatch && argsMatch[1]) {
        metadata.args = argsMatch[1].split(',').map((a) => a.trim())
      }
    }

    // also parse cmd() style metadata
    const joined = lines.join('\n')
    if (!metadata.description) {
      const cmdMatch = joined.match(/cmd\(\s*[`'"](.+?)[`'"]\s*\)/)
      if (cmdMatch?.[1]) {
        metadata.description = cmdMatch[1]
      }
    }
    if (!metadata.args) {
      const cmdArgsMatch = joined.match(/\.args\(\s*[`'"](.+?)[`'"]\s*\)/)
      if (cmdArgsMatch?.[1]) {
        const flags = [...cmdArgsMatch[1].matchAll(/--?([a-z-]+)/gi)]
        if (flags.length > 0) {
          metadata.args = flags.map((m) => `--${m[1]}`)
        }
      }
    }

    // add file modification time
    const stat = statSync(filePath)
    metadata.mtime = stat.mtimeMs

    return metadata
  } catch (err) {
    return {}
  }
}

// load or create cache
function loadCache(): ScriptCache {
  try {
    if (existsSync(CACHE_FILE)) {
      return JSON.parse(readFileSync(CACHE_FILE, 'utf-8'))
    }
  } catch (err) {
    // ignore cache errors
  }
  return {}
}

// save cache
function saveCache(cache: ScriptCache) {
  try {
    if (!existsSync(CACHE_DIR)) {
      mkdirSync(CACHE_DIR, { recursive: true })
    }
    writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2))
  } catch (err) {
    // ignore cache write errors
  }
}

// get metadata for a script (with caching)
export function getScriptMetadata(filePath: string): ScriptMetadata {
  const cache = loadCache()
  const stat = statSync(filePath)

  // check if cache is valid
  if (cache[filePath] && cache[filePath].mtime === stat.mtimeMs) {
    return cache[filePath]
  }

  // extract fresh metadata
  const metadata = extractMetadata(filePath)

  // update cache
  cache[filePath] = metadata
  saveCache(cache)

  return metadata
}

// discover scripts in a directory
export function discoverScripts(
  dir: string,
  baseDir: string = dir,
  depth: number = 0,
  maxDepth: number = 1
): Map<string, string> {
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
        // skip helpers/internal directories and limit depth to maxDepth
        if (entry === 'helpers' || entry === 'internal' || depth >= maxDepth) {
          continue
        }
        // recursively discover in subdirectories
        const subScripts = discoverScripts(fullPath, baseDir, depth + 1, maxDepth)
        for (const [name, path] of subScripts) {
          scripts.set(name, path)
        }
      } else if (entry.endsWith('.ts') || entry.endsWith('.js')) {
        // create script name relative to base, normalize to forward slashes
        const relativePath = relative(baseDir, fullPath).split('\\').join('/')
        const scriptName = relativePath.replace(/\.(ts|js)$/, '')
        scripts.set(scriptName, fullPath)
      }
    }
  } catch (err) {
    // ignore directory read errors
  }

  return scripts
}
