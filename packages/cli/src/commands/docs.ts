/**
 * docs command group - read the current repository's documentation
 */

import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

import { defineCommand } from 'citty'
import pc from 'picocolors'

function resolveDocsDir(cwd = process.cwd()): string {
  const skillsDir = join(cwd, 'skills')
  if (existsSync(skillsDir)) return skillsDir

  const docsDir = join(cwd, 'docs')
  if (existsSync(docsDir)) return docsDir

  throw new Error(`No docs or skills directory found in ${cwd}`)
}

const listCommand = defineCommand({
  meta: {
    name: 'list',
    description: 'List repository documentation files',
  },
  async run() {
    let docsDir: string
    try {
      docsDir = resolveDocsDir()
    } catch (error) {
      console.error(pc.red(`✗ ${error instanceof Error ? error.message : String(error)}`))
      process.exit(1)
    }

    const files = readdirSync(docsDir)
      .filter((file) => file.endsWith('.md'))
      .sort()

    console.info()
    console.info(pc.bold(pc.cyan('📚 Available Documentation')))
    console.info()

    for (const file of files) {
      const name = file.replace(/\.md$/, '')
      const content = readFileSync(join(docsDir, file), 'utf-8')
      const heading = content.match(/^#\s+(.+)$/m)?.[1]

      console.info(`  ${pc.green(name)}`)
      if (heading) console.info(`    ${pc.dim(heading)}`)
    }

    console.info()
    console.info(pc.dim(`Use 'takeout docs get <name>' to view a document`))
    console.info()
  },
})

const getCommand = defineCommand({
  meta: {
    name: 'get',
    description: 'Get the content of one or more repository documentation files',
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
    let docsDir: string
    try {
      docsDir = resolveDocsDir()
    } catch (error) {
      console.error(pc.red(`✗ ${error instanceof Error ? error.message : String(error)}`))
      process.exit(1)
    }

    const names = args._.length > 0 ? args._ : [args.name]
    const results: Array<{ name: string; content: string }> = []

    for (const name of names) {
      const fileName = name.endsWith('.md') ? name : `${name}.md`
      const filePath = join(docsDir, fileName)

      if (!existsSync(filePath)) {
        console.error(pc.red(`✗ Doc file not found: ${name}`))
        continue
      }

      results.push({ name, content: readFileSync(filePath, 'utf-8') })
    }

    if (results.length === 0) {
      console.info()
      console.info(pc.dim(`Use 'takeout docs list' to see available docs`))
      process.exit(1)
    }

    for (let index = 0; index < results.length; index++) {
      const result = results[index]!
      console.info(`# ${result.name}`)
      console.info()
      console.info(result.content)

      if (index < results.length - 1) {
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
    description: 'Get the absolute path to repository documentation',
  },
  args: {
    name: {
      type: 'positional',
      description: 'Name of the doc file (without .md extension)',
      required: false,
    },
  },
  async run({ args }) {
    let docsDir: string
    try {
      docsDir = resolveDocsDir()
    } catch (error) {
      console.error(pc.red(`✗ ${error instanceof Error ? error.message : String(error)}`))
      process.exit(1)
    }

    if (!args.name) {
      console.info(docsDir)
      return
    }

    const fileName = args.name.endsWith('.md') ? args.name : `${args.name}.md`
    const filePath = join(docsDir, fileName)

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
    description: 'List and retrieve repository documentation',
  },
  subCommands: {
    list: listCommand,
    get: getCommand,
    path: pathCommand,
  },
})
