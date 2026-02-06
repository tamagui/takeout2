/**
 * Changed command - show what's changed in upstream Takeout since last sync
 */

import { execSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

import { defineCommand } from 'citty'
import pc from 'picocolors'

const UPSTREAM_REPO = 'tamagui/takeout2'
const UPSTREAM_REMOTE = 'takeout-upstream'
const TAKEOUT_FILE = '.takeout'

const COMMIT_TYPE_ORDER = [
  'feat',
  'fix',
  'perf',
  'refactor',
  'docs',
  'chore',
  'test',
  'ci',
]

interface CommitInfo {
  hash: string
  type: string
  scope?: string
  message: string
  breaking: boolean
  date: string
}

interface TakeoutConfig {
  sha?: string
  date?: string
}

function readTakeoutConfig(): TakeoutConfig | null {
  const configPath = join(process.cwd(), TAKEOUT_FILE)

  if (!existsSync(configPath)) {
    return null
  }

  try {
    const content = readFileSync(configPath, 'utf-8')
    const config: TakeoutConfig = {}

    for (const line of content.split('\n')) {
      const trimmed = line.trim()
      if (trimmed.startsWith('#') || !trimmed) continue

      const [key, ...valueParts] = trimmed.split('=')
      const value = valueParts.join('=').trim()

      if (key === 'sha') config.sha = value
      if (key === 'date') config.date = value
    }

    return config
  } catch {
    return null
  }
}

function parseConventionalCommit(
  message: string
): { type: string; scope?: string; message: string; breaking: boolean } | null {
  // match conventional commit format: type(scope)!: message or type!: message
  const match = message.match(/^(\w+)(?:\(([^)]+)\))?(!)?: (.+)$/)
  if (!match) return null

  const [, type, scope, breaking, msg] = match

  // include all commit types for takeout
  const validTypes = [
    'feat',
    'fix',
    'perf',
    'refactor',
    'docs',
    'chore',
    'test',
    'ci',
    'build',
    'style',
  ]
  if (!type || !validTypes.includes(type)) return null

  return {
    type,
    scope,
    message: msg || message,
    breaking: !!breaking || message.toLowerCase().includes('breaking'),
  }
}

function ensureUpstreamRemote(): boolean {
  try {
    // check if remote exists
    const remotes = execSync('git remote', { encoding: 'utf-8' })
    if (!remotes.includes(UPSTREAM_REMOTE)) {
      console.info(pc.dim(`  adding ${UPSTREAM_REMOTE} remote...`))
      execSync(`git remote add ${UPSTREAM_REMOTE} git@github.com:${UPSTREAM_REPO}.git`, {
        stdio: 'pipe',
      })
    }

    // fetch latest
    console.info(pc.dim(`  fetching from ${UPSTREAM_REMOTE}...`))
    execSync(`git fetch ${UPSTREAM_REMOTE} --quiet`, { stdio: 'pipe' })
    return true
  } catch (err) {
    console.error(pc.red(`failed to setup upstream remote: ${err}`))
    return false
  }
}

function getCommitsBetween(fromSha: string, toRef: string): CommitInfo[] {
  const commits: CommitInfo[] = []

  try {
    // format: hash|date|message
    const result = execSync(
      `git log ${fromSha}..${toRef} --pretty=format:"%H|%ad|%s" --date=short 2>/dev/null`,
      { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 }
    )

    const lines = result.trim().split('\n').filter(Boolean)

    for (const line of lines) {
      const [hash = '', date = '', ...messageParts] = line.split('|')
      const message = messageParts.join('|')

      const parsed = parseConventionalCommit(message)

      // include non-conventional commits too, just categorize them as "other"
      commits.push({
        hash: hash.slice(0, 7),
        type: parsed?.type || 'other',
        scope: parsed?.scope,
        message: parsed?.message || message,
        breaking: parsed?.breaking || false,
        date,
      })
    }
  } catch {
    // no commits or error
  }

  return commits
}

function formatChangelog(commits: CommitInfo[]): void {
  if (commits.length === 0) {
    console.info(pc.dim('  no changes found'))
    return
  }

  // group by type
  const grouped = new Map<string, CommitInfo[]>()
  for (const commit of commits) {
    const existing = grouped.get(commit.type) || []
    existing.push(commit)
    grouped.set(commit.type, existing)
  }

  // sort by type order
  const sortedTypes = Array.from(grouped.keys()).sort((a, b) => {
    const aIdx = COMMIT_TYPE_ORDER.indexOf(a)
    const bIdx = COMMIT_TYPE_ORDER.indexOf(b)
    return (aIdx === -1 ? 999 : aIdx) - (bIdx === -1 ? 999 : bIdx)
  })

  // show breaking changes first
  const breakingChanges = commits.filter((c) => c.breaking)
  if (breakingChanges.length > 0) {
    console.info()
    console.info(pc.red(pc.bold('  BREAKING CHANGES')))
    for (const commit of breakingChanges) {
      const scope = commit.scope ? pc.cyan(`(${commit.scope})`) : ''
      console.info(
        `    ${pc.red('!')} ${scope} ${commit.message} ${pc.dim(`(${commit.hash})`)}`
      )
    }
  }

  const typeLabels: Record<string, string> = {
    feat: 'Features',
    fix: 'Bug Fixes',
    perf: 'Performance',
    refactor: 'Refactoring',
    docs: 'Documentation',
    chore: 'Maintenance',
    test: 'Tests',
    ci: 'CI',
    build: 'Build',
    style: 'Style',
    other: 'Other',
  }

  const typeColors: Record<string, (s: string) => string> = {
    feat: pc.green,
    fix: pc.yellow,
    perf: pc.magenta,
    refactor: pc.blue,
    docs: pc.dim,
    chore: pc.dim,
    test: pc.dim,
    ci: pc.dim,
    build: pc.dim,
    style: pc.dim,
    other: pc.white,
  }

  for (const type of sortedTypes) {
    const typeCommits = grouped.get(type)!.filter((c) => !c.breaking)
    if (typeCommits.length === 0) continue

    const label = typeLabels[type] || type
    const color = typeColors[type] || pc.white

    console.info()
    console.info(color(pc.bold(`  ${label}`)))

    for (const commit of typeCommits) {
      const scope = commit.scope ? pc.cyan(`(${commit.scope}) `) : ''
      console.info(
        `    ${pc.dim('-')} ${scope}${commit.message} ${pc.dim(`(${commit.hash})`)}`
      )
    }
  }
}

export const changedCommand = defineCommand({
  meta: {
    name: 'changed',
    description: 'Show changes in upstream Takeout since last sync',
  },
  args: {
    from: {
      type: 'string',
      description: 'Starting commit SHA (defaults to .takeout file)',
    },
    to: {
      type: 'string',
      description: 'Ending commit ref (defaults to upstream main)',
    },
  },
  async run({ args }) {
    console.info()
    console.info(pc.bold(pc.cyan('Takeout Changes')))
    console.info()

    // determine from SHA
    let fromSha = args.from
    const config = readTakeoutConfig()

    if (!fromSha) {
      if (!config?.sha) {
        console.info(pc.yellow('No .takeout file found with last sync SHA.'))
        console.info()
        console.info(pc.dim('Either:'))
        console.info(pc.dim('  1. Create a .takeout file with: sha=<commit-sha>'))
        console.info(pc.dim('  2. Run with --from <sha> to specify starting point'))
        console.info(pc.dim('  3. Run `tko sync` to sync and create the file'))
        console.info()
        return
      }
      fromSha = config.sha
    }

    // setup upstream remote and fetch
    if (!ensureUpstreamRemote()) {
      return
    }

    const toRef = args.to || `${UPSTREAM_REMOTE}/main`

    console.info(pc.dim(`  from: ${fromSha.slice(0, 7)}`))
    console.info(pc.dim(`  to:   ${toRef}`))

    if (config?.date) {
      console.info(pc.dim(`  last sync: ${config.date}`))
    }

    // get commits
    const commits = getCommitsBetween(fromSha, toRef)

    if (commits.length === 0) {
      console.info()
      console.info(pc.green('✓ Already up to date with upstream!'))
      console.info()
      return
    }

    console.info()
    console.info(
      pc.bold(
        `${commits.length} commit${commits.length === 1 ? '' : 's'} since last sync:`
      )
    )

    formatChangelog(commits)

    console.info()
    console.info(pc.dim('Run `tko sync` to sync these changes into your fork.'))
    console.info()
  },
})
