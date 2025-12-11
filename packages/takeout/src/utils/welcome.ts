/**
 * Welcome message for post-install when not onboarded
 */

import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import pc from 'picocolors'

import { WELCOME_BANNER } from '../constants/ascii'

export function showWelcomeMessage(): void {
  console.info()
  console.info(pc.white(WELCOME_BANNER))
  console.info()
  console.info()
  console.info(pc.bold(pc.white('  welcome to takeout! 🥡')))
  console.info()
  console.info(
    pc.dim('  run ') + pc.green('bun onboard') + pc.dim(' to get things set up')
  )
  console.info()
}

export function checkAndShowWelcome(cwd: string = process.cwd()): void {
  try {
    const packagePath = join(cwd, 'package.json')
    const pkg = JSON.parse(readFileSync(packagePath, 'utf-8'))

    if (pkg.takeout?.onboarded === false) {
      showWelcomeMessage()
    }
  } catch {
    // silently fail if package.json doesn't exist or is malformed
  }
}
