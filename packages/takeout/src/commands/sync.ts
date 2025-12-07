/**
 * Sync command - sync fork with upstream Takeout repository
 */

import { spawn, spawnSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
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

function getSyncPrompt(): string {
  try {
    // find package root by looking for package.json
    const currentDir = dirname(fileURLToPath(import.meta.url))
    let packageRoot = currentDir

    // go up directories until we find package.json with name @take-out/takeout
    while (packageRoot !== '/') {
      const pkgPath = join(packageRoot, 'package.json')
      if (existsSync(pkgPath)) {
        const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'))
        if (pkg.name === '@take-out/takeout') {
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
    const result = spawnSync('which', [command])
    return result.status === 0
  } catch {
    return false
  }
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

        // run claude in print mode with the prompt
        const claude = spawn('claude', ['-p', prompt], {
          stdio: 'inherit',
          shell: true,
        })

        claude.on('close', (code) => {
          console.info()
          if (code === 0) {
            showSuccess('Sync completed successfully!')
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

        // run cursor agent in print mode
        const cursor = spawn('cursor-agent', ['-p', prompt], {
          stdio: 'inherit',
          shell: true,
        })

        cursor.on('close', (code) => {
          console.info()
          if (code === 0) {
            showSuccess('Sync completed successfully!')
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

        // run aider with message flag
        const aider = spawn('aider', ['--message', prompt, '--no-stream'], {
          stdio: 'inherit',
          shell: true,
        })

        aider.on('close', (code) => {
          console.info()
          if (code === 0) {
            showSuccess('Sync completed successfully!')
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
