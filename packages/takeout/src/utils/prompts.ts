/**
 * Reusable prompt helpers using @clack/prompts
 */

import * as p from '@clack/prompts'
import pc from 'picocolors'
import type { PortCheck, PrerequisiteCheck } from '../types'

export function displayWelcome(projectName = 'Takeout'): void {
  console.info()
  p.intro(pc.bgCyan(pc.black(` ${projectName} Starter Kit `)))
}

export function displayOutro(message: string): void {
  p.outro(pc.green(message))
}

export function displayPrerequisites(checks: PrerequisiteCheck[]): void {
  const items = checks.map((check) => {
    const icon = check.installed ? pc.green('✓') : pc.red('✗')
    const message = check.message || ''
    return `${icon} ${pc.bold(check.name)}: ${message}`
  })

  p.note(items.join('\n'), 'Prerequisites')
}

export function displayPortConflicts(conflicts: PortCheck[]): void {
  if (conflicts.length === 0) return

  const items = conflicts.map((conflict) => {
    const pid = conflict.pid ? ` (PID: ${conflict.pid})` : ''
    return `${pc.yellow('⚠')} Port ${conflict.port} (${conflict.name})${pid}`
  })

  p.note(items.join('\n'), pc.yellow('Port Conflicts Detected'))
}

export async function confirmContinue(
  message: string,
  defaultValue = true
): Promise<boolean> {
  const result = await p.confirm({
    message,
    initialValue: defaultValue,
  })

  if (p.isCancel(result)) {
    p.cancel('Operation cancelled.')
    process.exit(0)
  }

  return result
}

export async function promptText(
  message: string,
  defaultValue?: string,
  placeholder?: string
): Promise<string> {
  const result = await p.text({
    message,
    defaultValue,
    placeholder,
  })

  if (p.isCancel(result)) {
    p.cancel('Operation cancelled.')
    process.exit(0)
  }

  return result
}

export async function promptPassword(message: string): Promise<string> {
  const result = await p.password({
    message,
  })

  if (p.isCancel(result)) {
    p.cancel('Operation cancelled.')
    process.exit(0)
  }

  return result
}

export async function promptSelect<T extends string>(
  message: string,
  options: { value: T; label: string; hint?: string }[]
): Promise<T> {
  const result = await p.select<string>({
    message,
    options,
  })

  if (p.isCancel(result)) {
    p.cancel('Operation cancelled.')
    process.exit(0)
  }

  return result as T
}

export function showSpinner(message: string): ReturnType<typeof p.spinner> {
  const s = p.spinner()
  s.start(message)
  return s
}

export function showError(message: string): void {
  p.log.error(pc.red(message))
}

export function showWarning(message: string): void {
  p.log.warning(pc.yellow(message))
}

export function showSuccess(message: string): void {
  p.log.success(pc.green(message))
}

export function showInfo(message: string): void {
  p.log.info(pc.blue(message))
}

export function showStep(message: string): void {
  p.log.step(message)
}
