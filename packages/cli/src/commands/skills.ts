/**
 * skills command group - manage claude code skills
 */

import {
  existsSync,
  lstatSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  readlinkSync,
  rmSync,
  rmdirSync,
  symlinkSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join, relative, resolve } from 'node:path'

import { defineCommand } from 'citty'
import pc from 'picocolors'

// --- doc skills generation ---

const require = createRequire(import.meta.url)
let DOCS_DIR: string
try {
  DOCS_DIR = dirname(require.resolve('@take-out/docs/package.json'))
} catch {
  DOCS_DIR = ''
}

const SKILL_PREFIX = 'takeout-'

function hasSkillFrontmatter(content: string): boolean {
  if (!content.startsWith('---')) return false
  const endIndex = content.indexOf('---', 3)
  if (endIndex === -1) return false
  const frontmatter = content.slice(3, endIndex)
  return frontmatter.includes('name:') && frontmatter.includes('description:')
}

function isDevOnly(content: string): boolean {
  if (!content.startsWith('---')) return false
  const endIndex = content.indexOf('---', 3)
  if (endIndex === -1) return false
  const frontmatter = content.slice(3, endIndex)
  return /\bdev:\s*true\b/.test(frontmatter)
}

function toSkillName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 64)
}

function collectAllDocs(
  cwd: string,
): Array<{ name: string; path: string; source: 'package' | 'local' }> {
  const docs: Array<{ name: string; path: string; source: 'package' | 'local' }> = []
  const seen = new Set<string>()

  const localDocsDir = join(cwd, 'docs')
  if (existsSync(localDocsDir)) {
    const files = readdirSync(localDocsDir).filter((f) => f.endsWith('.md'))
    for (const file of files) {
      const name = file.replace(/\.md$/, '')
      docs.push({ name, path: join(localDocsDir, file), source: 'local' })
      seen.add(name)
    }
  }

  if (DOCS_DIR && existsSync(DOCS_DIR)) {
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

async function generateDocSkills(
  cwd: string,
  clean: boolean,
): Promise<{
  symlinked: number
  generated: number
  unchanged: number
  removed: number
  skipped: number
}> {
  const skillsDir = join(cwd, '.claude', 'skills')
  const docs = collectAllDocs(cwd)
  const localDocsDir = join(cwd, 'docs')
  const expectedSkillNames = new Set<string>()

  if (docs.length === 0) {
    console.info(pc.yellow('no documentation files found'))
  } else {
    console.info(pc.dim(`found ${docs.length} documentation files`))
  }

  if (clean && existsSync(skillsDir)) {
    const existing = readdirSync(skillsDir)
    for (const dir of existing) {
      if (dir.startsWith(SKILL_PREFIX)) {
        rmSync(join(skillsDir, dir), { recursive: true })
      }
    }
  }

  if (!existsSync(skillsDir)) {
    mkdirSync(skillsDir, { recursive: true })
  }

  let symlinked = 0
  let generated = 0
  let unchanged = 0
  let removed = 0
  let skipped = 0
  const isDev = !!process.env.IS_TAMAGUI_DEV

  for (const doc of docs) {
    const content = readFileSync(doc.path, 'utf-8')
    if (isDevOnly(content) && !isDev) continue

    const hasFrontmatter = hasSkillFrontmatter(content)

    if (hasFrontmatter) {
      const nameMatch = content.match(/^---\s*\nname:\s*([^\n]+)/m)
      if (!nameMatch) continue

      const skillName = nameMatch[1]!.trim()
      expectedSkillNames.add(skillName)
      const skillDir = join(skillsDir, skillName)
      const skillFile = join(skillDir, 'SKILL.md')

      if (!existsSync(skillDir)) {
        mkdirSync(skillDir, { recursive: true })
      }

      const relativePath = relative(skillDir, doc.path)

      let shouldCreate = true
      try {
        const stat = lstatSync(skillFile)
        if (stat.isSymbolicLink() && existsSync(skillFile)) {
          const existingContent = readFileSync(skillFile, 'utf-8')
          if (existingContent === content) {
            unchanged++
            shouldCreate = false
          }
        }
        if (shouldCreate) {
          unlinkSync(skillFile)
        }
      } catch {
        // nothing exists
      }

      if (!shouldCreate) continue

      symlinkSync(relativePath, skillFile)
      symlinked++

      const sourceLabel = doc.source === 'local' ? pc.blue('local') : pc.dim('package')
      console.info(
        `  ${pc.green('⟷')} ${skillName} ${sourceLabel} ${pc.dim('(symlink)')}`,
      )
    } else {
      if (!hasFrontmatter) {
        skipped++
        console.info(
          `  ${pc.yellow('!')} skipped ${pc.dim(doc.name)} ${pc.dim('(missing skill frontmatter)')}`,
        )
        continue
      }
    }
  }

  for (const dir of readdirSync(skillsDir)) {
    if (expectedSkillNames.has(dir)) continue

    const skillDir = join(skillsDir, dir)
    const skillFile = join(skillDir, 'SKILL.md')

    if (dir.startsWith(SKILL_PREFIX)) {
      rmSync(skillDir, { recursive: true, force: true })
      removed++
      console.info(`  ${pc.red('✕')} ${dir} ${pc.dim('(removed stale generated skill)')}`)
      continue
    }

    let shouldUnlink = false

    try {
      const stat = lstatSync(skillFile)
      if (stat.isSymbolicLink()) {
        const linkTarget = readlinkSync(skillFile)
        const resolvedTarget = resolve(skillDir, linkTarget)
        shouldUnlink =
          resolvedTarget.startsWith(`${localDocsDir}/`) ||
          (!!DOCS_DIR && resolvedTarget.startsWith(`${DOCS_DIR}/`))
      }
    } catch {
      // ignore unrelated skill directories
    }

    if (!shouldUnlink) continue

    unlinkSync(skillFile)
    if (readdirSync(skillDir).length === 0) {
      rmdirSync(skillDir)
    }
    removed++
    console.info(`  ${pc.red('✕')} ${dir} ${pc.dim('(removed stale symlink)')}`)
  }

  return { symlinked, generated, unchanged, removed, skipped }
}

// --- commands ---

const generateCommand = defineCommand({
  meta: {
    name: 'generate',
    description: 'Generate Claude Code skills from documentation',
  },
  args: {
    clean: {
      type: 'boolean',
      description: 'Remove existing takeout-* skills before generating',
      default: false,
    },
    'skip-internal-docs': {
      type: 'boolean',
      description: 'Skip generating skills from internal documentation files',
      default: false,
    },
  },
  async run({ args }) {
    const cwd = process.cwd()
    const skillsDir = join(cwd, '.claude', 'skills')

    console.info()
    console.info(pc.bold(pc.cyan('Generate all skills')))
    console.info()

    let symlinked = 0
    let generated = 0
    let unchanged = 0
    let removed = 0
    let skipped = 0

    // 1. doc skills (unless skipped)
    if (!args['skip-internal-docs']) {
      const docStats = await generateDocSkills(cwd, args.clean)
      symlinked = docStats.symlinked
      generated = docStats.generated
      unchanged = docStats.unchanged
      removed = docStats.removed
      skipped = docStats.skipped
      console.info()
    }

    // summary
    console.info()
    console.info(pc.bold('summary:'))
    if (symlinked > 0) console.info(`  ${pc.green(`${symlinked} symlinked`)}`)
    if (generated > 0)
      console.info(
        `  ${pc.yellow(`${generated} generated`)} ${pc.dim('(add frontmatter to enable symlink)')}`,
      )
    if (skipped > 0)
      console.info(
        `  ${pc.yellow(`${skipped} skipped`)} ${pc.dim('(missing skill frontmatter)')}`,
      )
    if (unchanged > 0) console.info(`  ${pc.dim(`${unchanged} unchanged`)}`)
    if (removed > 0) console.info(`  ${pc.red(`${removed} removed`)}`)
    console.info(pc.dim(`  skills in ${skillsDir}`))
    console.info()
  },
})

export const skillsCommand = defineCommand({
  meta: {
    name: 'skills',
    description: 'Manage Claude Code skills',
  },
  subCommands: {
    generate: generateCommand,
  },
})
