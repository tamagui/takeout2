/**
 * skills command group - manage repository agent skills
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
} from 'node:fs'
import { join, relative, resolve } from 'node:path'

import { defineCommand } from 'citty'
import pc from 'picocolors'

// --- doc skills generation ---

const SKILL_PREFIX = 'takeout-'

function getSkillsDirs(cwd: string): string[] {
  return [join(cwd, '.claude', 'skills'), join(cwd, '.agents', 'skills')]
}

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

// prefer a project's ./skills dir if it exists, else fall back to ./docs. lets
// consumers cleanly separate agent skills (frontmatter md) from plain docs.
function resolveLocalDocsDir(cwd: string): string {
  const skillsDir = join(cwd, 'skills')
  if (existsSync(skillsDir)) return skillsDir
  return join(cwd, 'docs')
}

function collectAllDocs(cwd: string): Array<{ name: string; path: string }> {
  const docs: Array<{ name: string; path: string }> = []

  const localDocsDir = resolveLocalDocsDir(cwd)
  if (existsSync(localDocsDir)) {
    const files = readdirSync(localDocsDir).filter((f) => f.endsWith('.md'))
    for (const file of files) {
      const name = file.replace(/\.md$/, '')
      docs.push({ name, path: join(localDocsDir, file) })
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
  const skillsDirs = getSkillsDirs(cwd)
  const docs = collectAllDocs(cwd)
  const localDocsDir = resolveLocalDocsDir(cwd)
  const expectedSkillNames = new Set<string>()

  if (docs.length === 0) {
    console.info(pc.yellow('no documentation files found'))
  } else {
    console.info(pc.dim(`found ${docs.length} documentation files`))
  }

  for (const skillsDir of skillsDirs) {
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

      for (const skillsDir of skillsDirs) {
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

        console.info(
          `  ${pc.green('⟷')} ${skillName} ${pc.dim(`(${relative(cwd, skillsDir)})`)}`,
        )
      }
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

  for (const skillsDir of skillsDirs) {
    for (const dir of readdirSync(skillsDir)) {
      if (expectedSkillNames.has(dir)) continue

      const skillDir = join(skillsDir, dir)
      const skillFile = join(skillDir, 'SKILL.md')

      if (dir.startsWith(SKILL_PREFIX)) {
        rmSync(skillDir, { recursive: true, force: true })
        removed++
        console.info(
          `  ${pc.red('✕')} ${dir} ${pc.dim('(removed stale generated skill)')}`,
        )
        continue
      }

      let shouldUnlink = false

      try {
        const stat = lstatSync(skillFile)
        if (stat.isSymbolicLink()) {
          const linkTarget = readlinkSync(skillFile)
          const resolvedTarget = resolve(skillDir, linkTarget)
          shouldUnlink = resolvedTarget.startsWith(`${localDocsDir}/`)
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
  }

  return { symlinked, generated, unchanged, removed, skipped }
}

// --- commands ---

const generateCommand = defineCommand({
  meta: {
    name: 'generate',
    description: 'Generate Claude Code and Codex skills from documentation',
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
    const skillsDirs = getSkillsDirs(cwd)

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
    for (const skillsDir of skillsDirs) {
      console.info(pc.dim(`  skills in ${skillsDir}`))
    }
    console.info()
  },
})

export const skillsCommand = defineCommand({
  meta: {
    name: 'skills',
    description: 'Manage repository agent skills',
  },
  subCommands: {
    generate: generateCommand,
  },
})
