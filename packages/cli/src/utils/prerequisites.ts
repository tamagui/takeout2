/**
 * Check for required prerequisites (Bun, Node, Docker, Git)
 */

import { execSync } from 'node:child_process'

import type { PrerequisiteCheck } from '../types'

function execCommand(command: string): string | null {
  try {
    return execSync(command, {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'ignore'],
    }).trim()
  } catch {
    return null
  }
}

function getVersion(command: string): string | null {
  const output = execCommand(command)
  if (!output) return null

  // Extract version number (e.g., "v1.2.3" or "1.2.3")
  const match = output.match(/\d+\.\d+\.\d+/)
  return match ? match[0] : output
}

function compareVersions(current: string, required: string): boolean {
  const parseCurrent = current.replace(/^v/, '').split('.').map(Number)
  const parseRequired = required.replace(/^v/, '').split('.').map(Number)

  for (let i = 0; i < 3; i++) {
    const curr = parseCurrent[i] || 0
    const req = parseRequired[i] || 0
    if (curr > req) return true
    if (curr < req) return false
  }
  return true
}

export function checkBun(): PrerequisiteCheck {
  const version = getVersion('bun --version') ?? undefined
  const requiredVersion = '1.0.0'
  const hasBunv = !!execCommand('bunv --version')

  let message = version
    ? compareVersions(version, requiredVersion)
      ? `Bun ${version} installed`
      : `Bun ${version} installed (${requiredVersion}+ recommended)`
    : 'Bun not found'

  if (version && !hasBunv) {
    message += ' (consider installing bunv for auto version switching)'
  }

  return {
    name: 'Bun',
    required: true,
    installed: !!version,
    version,
    requiredVersion,
    message,
    installUrl: 'https://bun.sh',
    recommendation: !hasBunv
      ? 'Install bunv to automatically switch bun versions: https://github.com/aklinker1/bunv'
      : undefined,
  }
}

export function checkNode(): PrerequisiteCheck {
  const version = getVersion('node --version') ?? undefined
  const requiredVersion = '20.0.0'
  const hasFnm = !!execCommand('fnm --version')

  let message = version
    ? compareVersions(version, requiredVersion)
      ? `Node.js ${version} installed`
      : `Node.js ${version} installed (${requiredVersion}+ recommended)`
    : 'Node.js not found (optional)'

  if (version && !hasFnm) {
    message += ' (consider installing fnm for auto version switching)'
  }

  return {
    name: 'Node.js',
    required: false,
    installed: !!version,
    version,
    requiredVersion,
    message,
    installUrl: 'https://nodejs.org',
    recommendation: !hasFnm
      ? 'Install fnm to automatically switch node versions: https://github.com/Schniz/fnm'
      : undefined,
  }
}

export function checkDocker(): PrerequisiteCheck {
  const version = getVersion('docker --version') ?? undefined
  const isRunning = !!execCommand('docker ps')

  return {
    name: 'Docker',
    required: true,
    installed: !!version,
    version,
    message: !version
      ? 'Docker not found'
      : !isRunning
        ? 'Docker installed but not running'
        : `Docker ${version} running`,
    installUrl: 'https://docs.docker.com/get-docker/',
  }
}

export function checkGit(): PrerequisiteCheck {
  const version = getVersion('git --version') ?? undefined

  return {
    name: 'Git',
    required: true,
    installed: !!version,
    version,
    message: version ? `Git ${version} installed` : 'Git not found',
    installUrl: 'https://git-scm.com',
  }
}

export function checkAllPrerequisites(): PrerequisiteCheck[] {
  return [checkBun(), checkNode(), checkDocker(), checkGit()]
}

export function hasRequiredPrerequisites(checks: PrerequisiteCheck[]): boolean {
  return checks.filter((c) => c.required).every((c) => c.installed)
}
