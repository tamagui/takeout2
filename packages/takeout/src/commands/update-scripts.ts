/**
 * Update scripts command - sync scripts from source repository
 */

import { defineCommand } from 'citty'
import { existsSync, readdirSync, statSync } from 'node:fs'
import { join, resolve, relative } from 'node:path'
import pc from 'picocolors'
import {
  type FileToSync,
  compareFiles,
  getFileSize,
  syncFileWithConfirmation,
} from '../utils/sync'

function getAllScriptFiles(dir: string, baseDir: string = dir): string[] {
  const files: string[] = []

  try {
    const entries = readdirSync(dir)

    for (const entry of entries) {
      const fullPath = join(dir, entry)
      const stat = statSync(fullPath)

      if (stat.isDirectory()) {
        // recursively get files from subdirectories
        files.push(...getAllScriptFiles(fullPath, baseDir))
      } else if (
        entry.endsWith('.ts') ||
        entry.endsWith('.js') ||
        entry.endsWith('.cjs')
      ) {
        // get relative path from base scripts directory
        files.push(relative(baseDir, fullPath))
      }
    }
  } catch (err) {
    console.error(pc.red(`Error reading directory ${dir}: ${err}`))
  }

  return files
}

export const updateScriptsCommand = defineCommand({
  meta: {
    name: 'update-scripts',
    description: 'Update scripts from source repository',
  },
  args: {
    source: {
      type: 'string',
      description: 'Source directory containing scripts to sync from',
      required: true,
    },
    yes: {
      type: 'boolean',
      description: 'Skip confirmations and sync all files',
      default: false,
    },
  },
  async run({ args }) {
    const cwd = process.cwd()
    const targetScriptsDir = join(cwd, 'scripts')
    const sourceBaseDir = resolve(args.source)
    const sourceScriptsDir = join(sourceBaseDir, 'scripts')

    console.info()
    console.info(pc.bold(pc.cyan('⚙️  Update Scripts')))
    console.info()
    console.info(pc.dim(`Source: ${sourceScriptsDir}`))
    console.info(pc.dim(`Target: ${targetScriptsDir}`))
    console.info()

    // check if source base directory exists
    if (!existsSync(sourceBaseDir)) {
      console.error(pc.red(`✗ Source directory not found: ${sourceBaseDir}`))
      process.exit(1)
    }

    // check if source scripts directory exists
    if (!existsSync(sourceScriptsDir)) {
      console.error(pc.red('✗ Source scripts directory not found'))
      console.error(pc.dim(`  Expected: ${sourceScriptsDir}`))
      process.exit(1)
    }

    // ensure target scripts directory exists
    if (!existsSync(targetScriptsDir)) {
      console.info(pc.yellow('⚠ Target scripts directory does not exist, will create it'))
    }

    // get all script files from source (including subdirectories)
    const sourceFiles = getAllScriptFiles(sourceScriptsDir)

    if (sourceFiles.length === 0) {
      console.info(pc.yellow('No script files found in source scripts directory'))
      return
    }

    // analyze all files
    const filesToSync: FileToSync[] = []
    const stats = {
      new: 0,
      modified: 0,
      identical: 0,
    }

    for (const file of sourceFiles) {
      const sourcePath = join(sourceScriptsDir, file)
      const targetPath = join(targetScriptsDir, file)
      const status = compareFiles(sourcePath, targetPath)

      stats[status]++

      filesToSync.push({
        name: file,
        sourcePath,
        targetPath,
        status,
        sourceSize: getFileSize(sourcePath),
        targetSize: getFileSize(targetPath),
      })
    }

    console.info(pc.bold('Summary:'))
    console.info(`  ${pc.green(`${stats.new} new`)}`)
    console.info(`  ${pc.yellow(`${stats.modified} modified`)}`)
    console.info(`  ${pc.dim(`${stats.identical} identical`)}`)
    console.info()

    if (stats.new === 0 && stats.modified === 0) {
      console.info(pc.green('✓ All scripts are already up to date!'))
      return
    }

    // sort files: new first, then modified, then identical
    const sortOrder = { new: 0, modified: 1, identical: 2 }
    filesToSync.sort((a, b) => sortOrder[a.status] - sortOrder[b.status])

    // sync files
    let syncedCount = 0

    for (const file of filesToSync) {
      const wasSynced = await syncFileWithConfirmation(file)
      if (wasSynced) {
        syncedCount++
      }
    }

    console.info()
    console.info(pc.bold(pc.green(`✓ Complete: ${syncedCount} file(s) synced`)))
    console.info()
  },
})
