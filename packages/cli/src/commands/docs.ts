/**
 * Docs command - list and retrieve documentation files from the package
 */

import {
  existsSync,
  lstatSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  symlinkSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join, relative } from 'node:path'

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

// check if content has yaml frontmatter with required skill fields
function hasSkillFrontmatter(content: string): boolean {
  if (!content.startsWith('---')) return false
  const endIndex = content.indexOf('---', 3)
  if (endIndex === -1) return false

  const frontmatter = content.slice(3, endIndex)
  return frontmatter.includes('name:') && frontmatter.includes('description:')
}

// extract title and description from markdown content (for docs without frontmatter)
function extractDocMeta(content: string): { title: string; description: string } {
  const lines = content.split('\n')
  let title = ''
  let description = ''

  // skip frontmatter if present
  let startLine = 0
  if (lines[0]?.trim() === '---') {
    for (let i = 1; i < lines.length; i++) {
      if (lines[i]?.trim() === '---') {
        startLine = i + 1
        break
      }
    }
  }

  for (let i = startLine; i < lines.length; i++) {
    const trimmed = lines[i]?.trim() || ''
    // first h1 heading is the title
    if (!title && trimmed.startsWith('# ')) {
      title = trimmed.slice(2).trim()
      continue
    }
    // first non-empty, non-heading line after title is description
    if (title && trimmed && !trimmed.startsWith('#')) {
      description = trimmed
      break
    }
  }

  return { title, description }
}

// convert doc name to skill-friendly name (lowercase, hyphens)
function toSkillName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 64)
}

// collect all docs from both package and local directories
function collectAllDocs(
  cwd: string
): Array<{ name: string; path: string; source: 'package' | 'local' }> {
  const docs: Array<{ name: string; path: string; source: 'package' | 'local' }> = []
  const seen = new Set<string>()

  // local docs override package docs
  const localDocsDir = join(cwd, 'docs')
  if (existsSync(localDocsDir)) {
    const files = readdirSync(localDocsDir).filter((f) => f.endsWith('.md'))
    for (const file of files) {
      const name = file.replace(/\.md$/, '')
      docs.push({ name, path: join(localDocsDir, file), source: 'local' })
      seen.add(name)
    }
  }

  // package docs (only if not overridden by local)
  if (existsSync(DOCS_DIR)) {
    const files = readdirSync(DOCS_DIR).filter((f) => f.endsWith('.md'))
    for (const file of files) {
      const name = file.replace(/\.md$/, '')
      if (!seen.has(name)) {
        docs.push({ name, path: join(DOCS_DIR, file), source: 'package' })
      }
    }
  }

  return docs
}

const SKILL_PREFIX = 'takeout-'

const skillsCommand = defineCommand({
  meta: {
    name: 'skills',
    description: 'Generate Claude Code skills from documentation',
  },
  args: {
    clean: {
      type: 'boolean',
      description: 'Remove existing skills before generating',
      default: false,
    },
  },
  async run({ args }) {
    const cwd = process.cwd()
    const skillsDir = join(cwd, '.claude', 'skills')

    console.info()
    console.info(pc.bold(pc.cyan('🧠 Generate Claude Code Skills')))
    console.info()

    // collect all docs
    const docs = collectAllDocs(cwd)

    if (docs.length === 0) {
      console.info(pc.yellow('No documentation files found'))
      return
    }

    console.info(pc.dim(`Found ${docs.length} documentation files`))
    console.info()

    // clean existing takeout skills if requested
    if (args.clean && existsSync(skillsDir)) {
      console.info(pc.yellow('Cleaning existing takeout skills...'))
      const existing = readdirSync(skillsDir)
      for (const dir of existing) {
        if (dir.startsWith(SKILL_PREFIX)) {
          rmSync(join(skillsDir, dir), { recursive: true })
        }
      }
    }

    // ensure skills directory exists
    if (!existsSync(skillsDir)) {
      mkdirSync(skillsDir, { recursive: true })
    }

    let symlinked = 0
    let generated = 0
    let unchanged = 0

    for (const doc of docs) {
      // read doc content
      const content = readFileSync(doc.path, 'utf-8')
      const hasFrontmatter = hasSkillFrontmatter(content)

      if (hasFrontmatter) {
        // extract skill name from frontmatter
        const nameMatch = content.match(/^---\s*\nname:\s*([^\n]+)/m)
        if (!nameMatch) continue

        const skillName = nameMatch[1]!.trim()
        const skillDir = join(skillsDir, skillName)
        const skillFile = join(skillDir, 'SKILL.md')

        // ensure skill directory exists
        if (!existsSync(skillDir)) {
          mkdirSync(skillDir, { recursive: true })
        }

        // symlink it directly
        const relativePath = relative(skillDir, doc.path)

        // check if something exists at the skill path (including broken symlinks)
        let shouldCreate = true
        try {
          const stat = lstatSync(skillFile)
          if (stat.isSymbolicLink() && existsSync(skillFile)) {
            // valid symlink - check if content matches
            const existingContent = readFileSync(skillFile, 'utf-8')
            if (existingContent === content) {
              unchanged++
              shouldCreate = false
            }
          }
          if (shouldCreate) {
            // remove existing file/symlink to recreate
            unlinkSync(skillFile)
          }
        } catch {
          // nothing exists at the path
        }

        if (!shouldCreate) continue

        symlinkSync(relativePath, skillFile)
        symlinked++

        const sourceLabel = doc.source === 'local' ? pc.blue('local') : pc.dim('package')
        console.info(
          `  ${pc.green('⟷')} ${skillName} ${sourceLabel} ${pc.dim('(symlink)')}`
        )
      } else {
        // doc lacks frontmatter - generate skill file with frontmatter
        const baseName = toSkillName(doc.name)
        const skillName = `${SKILL_PREFIX}${baseName}`
        const skillDir = join(skillsDir, skillName)
        const skillFile = join(skillDir, 'SKILL.md')

        // ensure skill directory exists
        if (!existsSync(skillDir)) {
          mkdirSync(skillDir, { recursive: true })
        }

        const { title, description } = extractDocMeta(content)
        const skillDescription = description
          ? `${title}. ${description}`.slice(0, 1024)
          : title.slice(0, 1024)

        const skillContent = `---
name: ${skillName}
description: ${skillDescription}
---

${content}
`

        // check if skill already exists and is identical
        let shouldWrite = true
        try {
          const stat = lstatSync(skillFile)
          if (stat.isSymbolicLink()) {
            // remove symlink to replace with generated file
            unlinkSync(skillFile)
          } else {
            const existing = readFileSync(skillFile, 'utf-8')
            if (existing === skillContent) {
              unchanged++
              shouldWrite = false
            }
          }
        } catch {
          // nothing exists at the path
        }

        if (!shouldWrite) continue

        writeFileSync(skillFile, skillContent)
        generated++

        const sourceLabel = doc.source === 'local' ? pc.blue('local') : pc.dim('package')
        console.info(
          `  ${pc.green('✓')} ${skillName} ${sourceLabel} ${pc.dim('(generated)')}`
        )
      }
    }

    console.info()
    console.info(pc.bold('Summary:'))
    if (symlinked > 0) console.info(`  ${pc.green(`${symlinked} symlinked`)}`)
    if (generated > 0)
      console.info(
        `  ${pc.yellow(`${generated} generated`)} ${pc.dim('(add frontmatter to source to enable symlink)')}`
      )
    if (unchanged > 0) console.info(`  ${pc.dim(`${unchanged} unchanged`)}`)
    console.info()
    console.info(pc.dim(`Skills in ${skillsDir}`))
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
    skills: skillsCommand,
  },
})
