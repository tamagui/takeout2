#!/usr/bin/env bun

import fs from 'node:fs'

import { cmd } from './cmd'

await cmd`update changelog with recent git commits`.run(async ({ path }) => {
  const { execSync } = await import('node:child_process')

  const CHANGELOG_PATH = path.join(process.cwd(), 'src/features/site/docs/changelog.mdx')

  function getLastSha(): string | null {
    if (!fs.existsSync(CHANGELOG_PATH)) return null

    try {
      const content = fs.readFileSync(CHANGELOG_PATH, 'utf-8')
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
- no emoji, plain text only
- group small fixes/chores into "Bug fixes and chores (N)"
- for tamagui/one upgrades, check ~/tamagui or ~/one repos or github for what actually changed
- write useful descriptions - explain WHY and WHAT improved, not just "fixed X"
- stop when you reach commits already in the changelog

Archiving old entries:
- keep only 10 weeks in changelog.mdx
- when over 10 weeks, move the oldest entries into an archive file named
  changelog-YYYY.mdx, where YYYY is the year the archived WEEK is from
  (not the current year). e.g. a "Week of January 27, 2026" entry belongs
  in changelog-2026.mdx, not changelog-2025.mdx — even if 2025 already
  exists as an archive. never mix years in the same archive file.
- if the target archive file doesn't exist yet, create it with frontmatter:
    ---
    title: Changelog Archive — YYYY
    description: Archived Takeout updates from YYYY
    ---
  and end the file with a link chain to the previous year's archive if
  one exists, e.g. "See [2025 changes](/docs/changelog-2025) for earlier updates."
- if the archive already exists, prepend the new weeks to the top
  (after frontmatter), so it stays in reverse-chronological order
- at the bottom of changelog.mdx, list links to every archive file that
  exists, newest first, e.g.
  "See [early 2026 changes](/docs/changelog-2026) and [2025 changes](/docs/changelog-2025) for previous updates."
  (use absolute paths, update the list whenever a new archive file is created)
`)
})
