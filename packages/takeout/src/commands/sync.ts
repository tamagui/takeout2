/**
 * Sync command - sync fork with upstream Takeout repository
 */

import { execSync, spawn, spawnSync } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, parse } from 'node:path'
import { fileURLToPath } from 'node:url'

import { defineCommand } from 'citty'
import pc from 'picocolors'

import {
  confirmContinue,
  promptSelect,
  showError,
  showInfo,
  showStep,
  showSuccess,
} from '../utils/prompts'

const UPSTREAM_REPO = 'tamagui/takeout3'
const UPSTREAM_REMOTE = 'takeout-upstream'
const TAKEOUT_FILE = '.takeout'

function getSyncPrompt(): string {
  try {
    // find package root by looking for package.json
    const currentDir = dirname(fileURLToPath(import.meta.url))
    let packageRoot = currentDir

    // go up directories until we find package.json with name @take-out/cli
    while (packageRoot !== parse(packageRoot).root) {
      const pkgPath = join(packageRoot, 'package.json')
      if (existsSync(pkgPath)) {
        const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'))
        if (pkg.name === '@take-out/cli') {
          break
        }
      }
      packageRoot = dirname(packageRoot)
    }

    const promptPath = join(packageRoot, 'docs', 'sync-prompt.md')
    return readFileSync(promptPath, 'utf-8')
  } catch (error) {
    throw new Error(
      `Could not load sync prompt: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

function checkToolAvailable(command: string): boolean {
  try {
    // use 'where' on windows, 'which' on unix
    const checkCmd = process.platform === 'win32' ? 'where' : 'which'
    const result = spawnSync(checkCmd, [command])
    return result.status === 0
  } catch {
    return false
  }
}

function ensureUpstreamRemote(): boolean {
  try {
    // check if remote exists
    const remotes = execSync('git remote', { encoding: 'utf-8' })
    if (!remotes.includes(UPSTREAM_REMOTE)) {
      execSync(`git remote add ${UPSTREAM_REMOTE} git@github.com:${UPSTREAM_REPO}.git`, {
        stdio: 'pipe',
      })
    }
    execSync(`git fetch ${UPSTREAM_REMOTE} --quiet`, { stdio: 'pipe' })
    return true
  } catch {
    return false
  }
}

function getUpstreamHeadSha(): string | null {
  try {
    const sha = execSync(`git rev-parse ${UPSTREAM_REMOTE}/main`, { encoding: 'utf-8' })
    return sha.trim()
  } catch {
    return null
  }
}

function writeTakeoutConfig(sha: string): void {
  const configPath = join(process.cwd(), TAKEOUT_FILE)
  const date = new Date().toISOString().split('T')[0]
  const content = `# takeout sync tracking file
# this file tracks the last synced commit from upstream takeout
sha=${sha}
date=${date}
`
  writeFileSync(configPath, content)
}

export const syncCommand = defineCommand({
  meta: {
    name: 'sync',
    description: 'Sync your fork with the latest Takeout repository',
  },
  async run() {
    showStep('Takeout Repository Sync')
    console.info()

    showInfo('Takeout sync uses AI to intelligently merge upstream changes')
    console.info()
    console.info(pc.gray('How it works:'))
    console.info(pc.gray('  • Analyzes commits from upstream Takeout repository'))
    console.info(pc.gray('  • Determines which changes are relevant to your fork'))
    console.info(pc.gray('  • Applies changes while preserving your customizations'))
    console.info(pc.gray('  • Handles package ejection automatically'))
    console.info(pc.gray('  • Asks for your input when decisions are needed'))
    console.info()

    // check what tools are available
    const hasClaudeCode = checkToolAvailable('claude')
    const hasCursor = checkToolAvailable('cursor-agent')
    const hasAider = checkToolAvailable('aider')

    const options: Array<{
      value: string
      label: string
      hint: string
    }> = []

    if (hasClaudeCode) {
      options.push({
        value: 'claude-code',
        label: 'Claude Code (recommended)',
        hint: 'Run sync automatically with Claude Code CLI',
      })
    }

    if (hasCursor) {
      options.push({
        value: 'cursor',
        label: 'Cursor Agent',
        hint: 'Run sync automatically with Cursor CLI',
      })
    }

    if (hasAider) {
      options.push({
        value: 'aider',
        label: 'Aider',
        hint: 'Run sync automatically with Aider CLI',
      })
    }

    options.push({
      value: 'show-prompt',
      label: 'Show prompt (copy & paste manually)',
      hint: 'Display the full prompt to use with any LLM',
    })

    const choice = await promptSelect<string>('How would you like to sync?', options)

    if (choice === 'cancel') {
      console.info()
      showInfo('Sync cancelled')
      return
    }

    console.info()

    // fetch upstream to get the target SHA before syncing
    console.info(pc.dim('Fetching upstream repository...'))
    if (!ensureUpstreamRemote()) {
      showError('Failed to fetch upstream repository')
      return
    }

    const upstreamSha = getUpstreamHeadSha()
    if (!upstreamSha) {
      showError('Failed to get upstream HEAD SHA')
      return
    }
    console.info(pc.dim(`Target SHA: ${upstreamSha.slice(0, 7)}`))
    console.info()

    try {
      const prompt = getSyncPrompt()

      if (choice === 'show-prompt') {
        console.info(pc.dim('='.repeat(80)))
        console.info(prompt)
        console.info(pc.dim('='.repeat(80)))
        console.info()
        showInfo('Copy the prompt above and paste it into your preferred LLM')
        console.info()
        console.info(pc.gray('Recommended LLMs:'))
        console.info(pc.gray('  • Claude Code (best for complex instructions)'))
        console.info(pc.gray('  • ChatGPT'))
        console.info(pc.gray('  • Cursor'))
        console.info(pc.gray('  • Aider'))
        console.info()
      } else if (choice === 'claude-code') {
        showInfo('Starting Claude Code with sync prompt...')
        console.info()
        console.info(
          pc.dim(
            'Note: Claude Code will run in headless mode and make changes automatically.'
          )
        )
        console.info(pc.dim('You will be asked to confirm important decisions.'))
        console.info()

        const shouldContinue = await confirmContinue('Continue with Claude Code?', true)
        if (!shouldContinue) {
          showInfo('Sync cancelled')
          return
        }

        // write prompt to temp file to avoid shell escaping issues
        const tempDir = mkdtempSync(join(tmpdir(), 'takeout-sync-'))
        const promptFile = join(tempDir, 'prompt.md')
        writeFileSync(promptFile, prompt)

        // run claude with prompt from stdin
        const claude = spawn('claude', ['-p', '-'], {
          stdio: ['pipe', 'inherit', 'inherit'],
        })

        claude.stdin?.write(prompt)
        claude.stdin?.end()

        claude.on('close', (code) => {
          console.info()
          if (code === 0) {
            writeTakeoutConfig(upstreamSha)
            showSuccess('Sync completed successfully!')
            console.info(pc.dim(`Updated .takeout to ${upstreamSha.slice(0, 7)}`))
          } else {
            showError(`Claude Code exited with code ${code}`)
          }
        })
      } else if (choice === 'cursor') {
        showInfo('Starting Cursor Agent with sync prompt...')
        console.info()

        const shouldContinue = await confirmContinue('Continue with Cursor?', true)
        if (!shouldContinue) {
          showInfo('Sync cancelled')
          return
        }

        // run cursor agent with prompt from stdin
        const cursor = spawn('cursor-agent', ['-p', '-'], {
          stdio: ['pipe', 'inherit', 'inherit'],
        })

        cursor.stdin?.write(prompt)
        cursor.stdin?.end()

        cursor.on('close', (code) => {
          console.info()
          if (code === 0) {
            writeTakeoutConfig(upstreamSha)
            showSuccess('Sync completed successfully!')
            console.info(pc.dim(`Updated .takeout to ${upstreamSha.slice(0, 7)}`))
          } else {
            showError(`Cursor Agent exited with code ${code}`)
          }
        })
      } else if (choice === 'aider') {
        showInfo('Starting Aider with sync prompt...')
        console.info()

        const shouldContinue = await confirmContinue('Continue with Aider?', true)
        if (!shouldContinue) {
          showInfo('Sync cancelled')
          return
        }

        // write prompt to temp file for aider
        const tempDir = mkdtempSync(join(tmpdir(), 'takeout-sync-'))
        const promptFile = join(tempDir, 'prompt.md')
        writeFileSync(promptFile, prompt)

        // run aider with message from file
        const aider = spawn('aider', ['--message-file', promptFile, '--no-stream'], {
          stdio: 'inherit',
        })

        aider.on('close', (code) => {
          console.info()
          if (code === 0) {
            writeTakeoutConfig(upstreamSha)
            showSuccess('Sync completed successfully!')
            console.info(pc.dim(`Updated .takeout to ${upstreamSha.slice(0, 7)}`))
          } else {
            showError(`Aider exited with code ${code}`)
          }
        })
      }
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Unknown error')
    }
  },
})
