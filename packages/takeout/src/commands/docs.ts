/**
 * Docs command - list and retrieve documentation files from the package
 */

import { defineCommand } from 'citty'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import pc from 'picocolors'

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

export const docsCommand = defineCommand({
  meta: {
    name: 'docs',
    description: 'List and retrieve Takeout documentation',
  },
  subCommands: {
    list: listCommand,
    get: getCommand,
    path: pathCommand,
  },
})
