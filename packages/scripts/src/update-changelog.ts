#!/usr/bin/env bun

/**
 * @description Update changelog.mdx with recent git commits using Claude Code
 *
 * outputs a prompt for claude code to investigate commits and update changelog
 * run: bun tko update-changelog
 */

import { execSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const CHANGELOG_PATH = join(process.cwd(), 'src/features/site/docs/changelog.mdx')

function getLastSha(): string | null {
  if (!existsSync(CHANGELOG_PATH)) return null

  try {
    const content = readFileSync(CHANGELOG_PATH, 'utf-8')
    const match = content.match(/\{\/\* last updated: ([a-f0-9]+) \*\/\}/)
    return match?.[1] || null
  } catch {
    return null
  }
}

function getLatestSha(): string {
  return execSync('git rev-parse --short HEAD', { encoding: 'utf-8' }).trim()
}

function getCommitCount(fromSha: string, toSha: string): number {
  try {
    const result = execSync(`git rev-list --count ${fromSha}..${toSha} --no-merges`, {
      encoding: 'utf-8',
    })
    return parseInt(result.trim(), 10)
  } catch {
    return 0
  }
}

const lastSha = getLastSha()
const latestSha = getLatestSha()

if (!lastSha) {
  console.info(`no last sha found in changelog, defaulting to 4 weeks ago`)
}

const fromRef = lastSha || '$(git log --since="4 weeks ago" --format="%H" | tail -1)'
const commitCount = lastSha ? getCommitCount(lastSha, latestSha) : '~30'

if (commitCount === 0) {
  console.info('no new commits since last update')
  process.exit(0)
}

console.info(`
Update the changelog at: ${CHANGELOG_PATH}

Commit range: ${fromRef}..${latestSha} (${commitCount} commits)

Instructions:
- investigate commits with git log, git show, git diff as needed
- for vague commits like "cleanups" or "fix Component.tsx", look at the actual diff to understand what changed
- update the "last updated" comment to: ${latestSha}
- create new week sections if needed (weeks start monday)
- format: "## Week of January 20, 2026" with sha in backticks below
- use ✚ symbol only for new features, no other emoji
- group small fixes/chores into "Bug fixes and chores (N)"
- for tamagui/one upgrades, check ~/tamagui or ~/one repos or github for what actually changed
- write useful descriptions - explain WHY and WHAT improved, not just "fixed X"
- stop when you reach commits already in the changelog
`)
