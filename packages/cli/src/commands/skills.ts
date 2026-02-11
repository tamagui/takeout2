/**
 * skills command group - manage claude code skills
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
import { fileURLToPath } from 'node:url'

import { defineCommand } from 'citty'
import pc from 'picocolors'

import {
  type ScriptMetadata,
  discoverScripts,
  getAllScriptMetadata,
  getLocalScriptsDir,
} from '../utils/script-utils'

// --- shared helpers ---

const BUILTIN_COMMANDS: Array<{ name: string; description: string }> = [
  { name: 'onboard', description: 'setup wizard for new projects' },
  { name: 'docs', description: 'view documentation' },
  { name: 'env:setup', description: 'setup environment variables' },
  { name: 'run', description: 'run scripts in parallel' },
  { name: 'script', description: 'manage and run scripts' },
  { name: 'sync', description: 'sync fork with upstream takeout' },
  { name: 'changed', description: 'show changes since last sync' },
  { name: 'skills', description: 'manage claude code skills' },
  { name: 'completion', description: 'shell completion setup' },
]

function findScriptsPackageRoot(): string | null {
  try {
    const resolved = import.meta.resolve('@take-out/scripts/package.json')
    const packageJsonPath = fileURLToPath(new URL(resolved))
    return join(packageJsonPath, '..', 'src')
  } catch {
    return null
  }
}

// --- summary skill generation ---

function buildSummaryDescription(
  localScripts: Map<string, string>,
  builtInScripts: Map<string, string>
): string {
  const categories = new Set<string>()
  const keywords = new Set<string>()

  for (const [name] of [...localScripts, ...builtInScripts]) {
    keywords.add(name)
    if (name.includes('/')) {
      categories.add(name.split('/')[0]!)
    }
  }

  for (const cmd of BUILTIN_COMMANDS) {
    keywords.add(cmd.name)
  }

  const categoryList = [...categories].sort().join(', ')

  return (
    `CLI scripts and commands reference for the tko (takeout) CLI. ` +
    `Use when the user asks to run scripts, manage the project, or needs to know what commands are available. ` +
    `tko, takeout, CLI, scripts, commands, bun tko, project tasks, automation, ` +
    `${categoryList}, ${[...keywords].sort().join(', ')}`
  ).slice(0, 2048)
}

function buildSummaryContent(
  localScripts: Map<string, string>,
  builtInScripts: Map<string, string>,
  metadata: Map<string, ScriptMetadata>
): string {
  const description = buildSummaryDescription(localScripts, builtInScripts)

  const lines: string[] = []
  lines.push('---')
  lines.push('name: tko-scripts')
  lines.push(`description: ${description}`)
  lines.push('---')
  lines.push('')
  lines.push('# tko CLI - scripts & commands')
  lines.push('')
  lines.push('run with `bun tko <command>` or `bun tko <script-name>`.')
  lines.push('')

  // built-in commands
  lines.push('## built-in commands')
  lines.push('')
  for (const cmd of BUILTIN_COMMANDS) {
    lines.push(`  ${cmd.name} - ${cmd.description}`)
  }
  lines.push('')

  // helper to group and format scripts
  const formatSection = (title: string, scripts: Map<string, string>) => {
    if (scripts.size === 0) return

    const categories = new Map<string, Array<string>>()
    const rootScripts: string[] = []

    for (const [name] of scripts) {
      if (name.includes('/')) {
        const category = name.split('/')[0]!
        if (!categories.has(category)) {
          categories.set(category, [])
        }
        categories.get(category)!.push(name)
      } else {
        rootScripts.push(name)
      }
    }

    lines.push(`## ${title}`)
    lines.push('')

    for (const name of rootScripts) {
      const meta = metadata.get(name)
      const desc = meta?.description ? ` - ${meta.description}` : ''
      const args = meta?.args?.length ? ` [${meta.args.join(', ')}]` : ''
      lines.push(`  ${name}${desc}${args}`)
    }

    for (const [category, categoryScripts] of categories) {
      lines.push('')
      lines.push(`  ${category}/`)
      for (const name of categoryScripts) {
        const shortName = name.substring(category.length + 1)
        const meta = metadata.get(name)
        const desc = meta?.description ? ` - ${meta.description}` : ''
        const args = meta?.args?.length ? ` [${meta.args.join(', ')}]` : ''
        lines.push(`    ${shortName}${desc}${args}`)
      }
    }

    lines.push('')
  }

  formatSection('local scripts', localScripts)
  formatSection('built-in scripts', builtInScripts)

  // usage
  lines.push('## usage')
  lines.push('')
  lines.push('```bash')
  lines.push('bun tko <command>           # run a built-in command')
  lines.push('bun tko <script-name>       # execute direct script')
  lines.push(
    'bun tko <group> <script>    # execute nested script (e.g. bun tko aws health)'
  )
  lines.push('bun tko run s1 s2 s3        # run multiple scripts in parallel')
  lines.push('bun tko script new <path>   # create a new script')
  lines.push('```')
  lines.push('')

  return lines.join('\n')
}

async function generateSummary(cwd: string): Promise<boolean> {
  const skillsDir = join(cwd, '.claude', 'skills')
  const skillName = 'tko-scripts'
  const skillDir = join(skillsDir, skillName)
  const skillFile = join(skillDir, 'SKILL.md')

  // discover all scripts
  const localScripts = discoverScripts(getLocalScriptsDir())
  const builtInDir = findScriptsPackageRoot()
  const builtInScripts = builtInDir ? discoverScripts(builtInDir) : new Map()

  const allScripts = new Map([...localScripts, ...builtInScripts])
  const metadata = await getAllScriptMetadata(allScripts)

  const totalScripts = localScripts.size + builtInScripts.size
  console.info(
    pc.dim(
      `found ${totalScripts} scripts (${localScripts.size} local, ${builtInScripts.size} built-in) + ${BUILTIN_COMMANDS.length} commands`
    )
  )

  const content = buildSummaryContent(localScripts, builtInScripts, metadata)

  // check if unchanged
  try {
    const existing = readFileSync(skillFile, 'utf-8')
    if (existing === content) {
      console.info(`  ${pc.dim('tko-scripts')} ${pc.dim('unchanged')}`)
      return false
    }
  } catch {
    // doesn't exist yet
  }

  if (!existsSync(skillDir)) {
    mkdirSync(skillDir, { recursive: true })
  }
  writeFileSync(skillFile, content)
  console.info(`  ${pc.green('✓')} tko-scripts`)
  return true
}

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

function extractDocMeta(content: string): { title: string; description: string } {
  const lines = content.split('\n')
  let title = ''
  let description = ''

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
    if (!title && trimmed.startsWith('# ')) {
      title = trimmed.slice(2).trim()
      continue
    }
    if (title && trimmed && !trimmed.startsWith('#')) {
      description = trimmed
      break
    }
  }

  return { title, description }
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
  cwd: string
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
  clean: boolean
): Promise<{ symlinked: number; generated: number; unchanged: number }> {
  const skillsDir = join(cwd, '.claude', 'skills')
  const docs = collectAllDocs(cwd)

  if (docs.length === 0) {
    console.info(pc.yellow('no documentation files found'))
    return { symlinked: 0, generated: 0, unchanged: 0 }
  }

  console.info(pc.dim(`found ${docs.length} documentation files`))

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
  const isDev = !!process.env.IS_TAMAGUI_DEV

  for (const doc of docs) {
    const content = readFileSync(doc.path, 'utf-8')
    if (isDevOnly(content) && !isDev) continue

    const hasFrontmatter = hasSkillFrontmatter(content)

    if (hasFrontmatter) {
      const nameMatch = content.match(/^---\s*\nname:\s*([^\n]+)/m)
      if (!nameMatch) continue

      const skillName = nameMatch[1]!.trim()
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
        `  ${pc.green('⟷')} ${skillName} ${sourceLabel} ${pc.dim('(symlink)')}`
      )
    } else {
      const baseName = toSkillName(doc.name)
      const skillName = `${SKILL_PREFIX}${baseName}`
      const skillDir = join(skillsDir, skillName)
      const skillFile = join(skillDir, 'SKILL.md')

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

      let shouldWrite = true
      try {
        const stat = lstatSync(skillFile)
        if (stat.isSymbolicLink()) {
          unlinkSync(skillFile)
        } else {
          const existing = readFileSync(skillFile, 'utf-8')
          if (existing === skillContent) {
            unchanged++
            shouldWrite = false
          }
        }
      } catch {
        // nothing exists
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

  return { symlinked, generated, unchanged }
}

// --- commands ---

const scriptsCommand = defineCommand({
  meta: {
    name: 'scripts',
    description: 'Generate a skill summarizing all tko scripts and commands',
  },
  async run() {
    const cwd = process.cwd()

    console.info()
    console.info(pc.bold(pc.cyan('Generate scripts skill')))
    console.info()

    await generateSummary(cwd)

    console.info()
  },
})

const generateCommand = defineCommand({
  meta: {
    name: 'generate',
    description: 'Generate all Claude Code skills (doc skills + summary)',
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

    // 1. doc skills (unless skipped)
    if (!args['skip-internal-docs']) {
      const docStats = await generateDocSkills(cwd, args.clean)
      symlinked = docStats.symlinked
      generated = docStats.generated
      unchanged = docStats.unchanged
      console.info()
    }

    // 2. scripts summary skill
    await generateSummary(cwd)

    // summary
    console.info()
    console.info(pc.bold('summary:'))
    if (symlinked > 0) console.info(`  ${pc.green(`${symlinked} symlinked`)}`)
    if (generated > 0)
      console.info(
        `  ${pc.yellow(`${generated} generated`)} ${pc.dim('(add frontmatter to enable symlink)')}`
      )
    if (unchanged > 0) console.info(`  ${pc.dim(`${unchanged} unchanged`)}`)
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
    scripts: scriptsCommand,
  },
})
