/**
 * Docs command - list and retrieve documentation files from the package
 */

import { defineCommand } from 'citty'
import { existsSync, readdirSync, readFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import pc from 'picocolors'
import { confirm } from '@clack/prompts'
import {
  type FileToSync,
  compareFiles,
  getFileSize,
  syncFileWithConfirmation,
} from '../utils/sync'

// Find package root by looking for package.json
function findPackageRoot(startDir: string): string {
  let dir = startDir
  while (dir !== '/') {
    if (existsSync(join(dir, 'package.json'))) {
      const pkg = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf-8'))
      if (pkg.name === '@vxrn/takeout') {
        return dir
      }
    }
    dir = join(dir, '..')
  }
  throw new Error('Could not find @vxrn/takeout package root')
}

const PACKAGE_ROOT = findPackageRoot(import.meta.dirname)
const DOCS_DIR = join(PACKAGE_ROOT, 'docs')

const listCommand = defineCommand({
  meta: {
    name: 'list',
    description: 'List all available documentation files',
  },
  async run() {
    if (!existsSync(DOCS_DIR)) {
      console.error(pc.red('✗ Docs directory not found'))
      process.exit(1)
    }

    const files = readdirSync(DOCS_DIR)
      .filter((f) => f.endsWith('.md'))
      .sort()

    console.info()
    console.info(pc.bold(pc.cyan('📚 Available Documentation')))
    console.info()

    for (const file of files) {
      const name = file.replace(/\.md$/, '')
      const path = join(DOCS_DIR, file)

      // try to extract first heading as description
      let description = ''
      try {
        const content = readFileSync(path, 'utf-8')
        const match = content.match(/^#\s+(.+)$/m)
        if (match?.[1]) {
          description = match[1]
        }
      } catch {
        // ignore read errors
      }

      if (description) {
        console.info(`  ${pc.green(name)}`)
        console.info(`    ${pc.dim(description)}`)
      } else {
        console.info(`  ${pc.green(name)}`)
      }
    }

    console.info()
    console.info(pc.dim(`Use 'takeout docs get <name>' to view a document`))
    console.info()
  },
})

const getCommand = defineCommand({
  meta: {
    name: 'get',
    description: 'Get the content of a specific documentation file',
  },
  args: {
    name: {
      type: 'positional',
      description: 'Name of the doc file (without .md extension)',
      required: true,
    },
  },
  async run({ args }) {
    const fileName = args.name.endsWith('.md') ? args.name : `${args.name}.md`
    const filePath = join(DOCS_DIR, fileName)

    if (!existsSync(filePath)) {
      console.error(pc.red(`✗ Doc file not found: ${args.name}`))
      console.info()
      console.info(pc.dim(`Use 'takeout docs list' to see available docs`))
      process.exit(1)
    }

    try {
      const content = readFileSync(filePath, 'utf-8')
      console.info(content)
    } catch (err) {
      console.error(pc.red(`✗ Error reading file: ${err}`))
      process.exit(1)
    }
  },
})

const pathCommand = defineCommand({
  meta: {
    name: 'path',
    description: 'Get the absolute path to a documentation file',
  },
  args: {
    name: {
      type: 'positional',
      description: 'Name of the doc file (without .md extension)',
      required: false,
    },
  },
  async run({ args }) {
    if (!args.name) {
      // return docs directory path
      console.info(DOCS_DIR)
      return
    }

    const fileName = args.name.endsWith('.md') ? args.name : `${args.name}.md`
    const filePath = join(DOCS_DIR, fileName)

    if (!existsSync(filePath)) {
      console.error(pc.red(`✗ Doc file not found: ${args.name}`))
      process.exit(1)
    }

    console.info(filePath)
  },
})

const ejectCommand = defineCommand({
  meta: {
    name: 'eject',
    description: 'Eject Takeout documentation files into your project',
  },
  args: {
    yes: {
      type: 'boolean',
      description: 'Skip confirmations and eject all files',
      default: false,
    },
  },
  async run({ args }) {
    const cwd = process.cwd()
    const targetDocsDir = join(cwd, 'docs')
    const sourceDocsDir = DOCS_DIR

    console.info()
    console.info(pc.bold(pc.cyan('📚 Eject Docs')))
    console.info()
    console.info(pc.dim(`Source: ${sourceDocsDir}`))
    console.info(pc.dim(`Target: ${targetDocsDir}`))
    console.info()

    if (!existsSync(sourceDocsDir)) {
      console.error(pc.red('✗ Source docs directory not found in Takeout package'))
      process.exit(1)
    }

    // ensure target docs directory exists
    if (!existsSync(targetDocsDir)) {
      console.info(pc.yellow('⚠ Target docs directory does not exist, will create it'))
      mkdirSync(targetDocsDir, { recursive: true })
    }

    // get all markdown files from source
    const sourceFiles = readdirSync(sourceDocsDir).filter((f) => f.endsWith('.md'))

    if (sourceFiles.length === 0) {
      console.info(pc.yellow('No markdown files found in Takeout docs'))
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
      if (args.yes && file.status !== 'identical') {
        // auto-sync without confirmation
        const targetDir = join(targetDocsDir)
        if (!existsSync(targetDir)) {
          mkdirSync(targetDir, { recursive: true })
        }
        const content = readFileSync(file.sourcePath)
        writeFileSync(file.targetPath, content)
        console.info(pc.green(`  ✓ ${file.name}`))
        syncedCount++
      } else {
        const wasSynced = await syncFileWithConfirmation(file)
        if (wasSynced) {
          syncedCount++
        }
      }
    }

    console.info()
    console.info(pc.bold(pc.green(`✓ Complete: ${syncedCount} file(s) ejected`)))
    console.info()
  },
})

export const docsCommand = defineCommand({
  meta: {
    name: 'docs',
    description: 'List and retrieve Takeout documentation',
  },
  subCommands: {
    list: listCommand,
    get: getCommand,
    path: pathCommand,
    eject: ejectCommand,
  },
})
