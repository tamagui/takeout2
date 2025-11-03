/**
 * Update docs command - sync documentation from source repository
 */

import { defineCommand } from 'citty'
import { existsSync, readdirSync } from 'node:fs'
import { join, resolve } from 'node:path'
import pc from 'picocolors'
import {
  type FileToSync,
  compareFiles,
  getFileSize,
  syncFileWithConfirmation,
} from '../utils/sync'

export const updateDocsCommand = defineCommand({
  meta: {
    name: 'update-docs',
    description: 'Update docs from source repository',
  },
  args: {
    source: {
      type: 'string',
      description: 'Source directory containing docs to sync from',
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
    const targetDocsDir = join(cwd, 'docs')
    const sourceBaseDir = resolve(args.source)
    const sourceDocsDir = join(sourceBaseDir, 'docs')

    console.info()
    console.info(pc.bold(pc.cyan('📚 Update Docs')))
    console.info()
    console.info(pc.dim(`Source: ${sourceDocsDir}`))
    console.info(pc.dim(`Target: ${targetDocsDir}`))
    console.info()

    // check if source base directory exists
    if (!existsSync(sourceBaseDir)) {
      console.error(pc.red(`✗ Source directory not found: ${sourceBaseDir}`))
      process.exit(1)
    }

    // check if source docs directory exists
    if (!existsSync(sourceDocsDir)) {
      console.error(pc.red('✗ Source docs directory not found'))
      console.error(pc.dim(`  Expected: ${sourceDocsDir}`))
      process.exit(1)
    }

    // ensure target docs directory exists
    if (!existsSync(targetDocsDir)) {
      console.info(pc.yellow('⚠ Target docs directory does not exist, will create it'))
    }

    // get all markdown files from source
    const sourceFiles = readdirSync(sourceDocsDir).filter((f) => f.endsWith('.md'))

    if (sourceFiles.length === 0) {
      console.info(pc.yellow('No markdown files found in source docs directory'))
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
      const sourcePath = join(sourceDocsDir, file)
      const targetPath = join(targetDocsDir, file)
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
      console.info(pc.green('✓ All docs are already up to date!'))
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
