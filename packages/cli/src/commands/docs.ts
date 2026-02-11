/**
 * Docs command - list and retrieve documentation files from the package
 */

import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'

import { defineCommand } from 'citty'
import pc from 'picocolors'

import {
  type FileToSync,
  compareFiles,
  getFileSize,
  syncFileWithConfirmation,
} from '../utils/sync'

// resolve docs directory from @take-out/docs package
const require = createRequire(import.meta.url)
const DOCS_DIR = dirname(require.resolve('@take-out/docs/package.json'))

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
    description: 'Get the content of one or more documentation files',
  },
  args: {
    name: {
      type: 'positional',
      description: 'Name(s) of the doc files (without .md extension)',
      required: true,
      valueHint: 'name...',
    },
  },
  async run({ args }) {
    // args._ contains all positional arguments
    // if multiple names are provided, they'll be in args._
    // if only one is provided, it will be in both args.name and args._[0]
    const names = args._.length > 0 ? args._ : [args.name]

    const results: Array<{ name: string; content: string }> = []
    const errors: Array<{ name: string; error: string }> = []

    // check local ./docs folder first
    const cwd = process.cwd()
    const localDocsDir = join(cwd, 'docs')

    // collect all docs
    for (const name of names) {
      const fileName = name.endsWith('.md') ? name : `${name}.md`

      // try local docs first
      const localFilePath = join(localDocsDir, fileName)
      const packageFilePath = join(DOCS_DIR, fileName)

      let filePath: string | null = null

      if (existsSync(localFilePath)) {
        filePath = localFilePath
      } else if (existsSync(packageFilePath)) {
        filePath = packageFilePath
      }

      if (!filePath) {
        errors.push({ name, error: 'File not found' })
        continue
      }

      try {
        const content = readFileSync(filePath, 'utf-8')
        results.push({ name, content })
      } catch (err) {
        errors.push({ name, error: String(err) })
      }
    }

    // print errors if any
    if (errors.length > 0) {
      for (const { name } of errors) {
        console.error(pc.red(`✗ Doc file not found: ${name}`))
      }
      console.info()
      console.info(pc.dim(`Use 'takeout docs list' to see available docs`))

      // if no successful results, exit
      if (results.length === 0) {
        process.exit(1)
      }
      console.info()
    }

    // print results
    for (let i = 0; i < results.length; i++) {
      const result = results[i]
      if (!result) continue

      // print title
      console.info(`# ${result.name}`)
      console.info()

      // print content
      console.info(result.content)

      // print separator if not last item
      if (i < results.length - 1) {
        console.info()
        console.info('---')
        console.info()
      }
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
