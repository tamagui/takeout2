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
  const version = getVersion('bun --version')

  if (!version) {
    throw new Error(`No bun version?`)
  }

  const requiredVersion = '1.0.0'

  return {
    name: 'Bun',
    required: true,
    installed: !!version,
    version,
    requiredVersion,
    message: version
      ? compareVersions(version, requiredVersion)
        ? `Bun ${version} installed`
        : `Bun ${version} installed (${requiredVersion}+ recommended)`
      : 'Bun not found',
    installUrl: 'https://bun.sh',
  }
}

export function checkNode(): PrerequisiteCheck {
  const version = getVersion('node --version')
  const requiredVersion = '20.0.0'

  if (!version) {
    throw new Error(`No node version?`)
  }

  return {
    name: 'Node.js',
    required: false,
    installed: !!version,
    version,
    requiredVersion,
    message: version
      ? compareVersions(version, requiredVersion)
        ? `Node.js ${version} installed`
        : `Node.js ${version} installed (${requiredVersion}+ recommended)`
      : 'Node.js not found (optional)',
    installUrl: 'https://nodejs.org',
  }
}

export function checkDocker(): PrerequisiteCheck {
  const version = getVersion('docker --version')
  const isRunning = !!execCommand('docker ps')

  if (!version) {
    throw new Error(`No docker version?`)
  }

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
  const version = getVersion('git --version')

  if (!version) {
    throw new Error(`No git version?`)
  }

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
