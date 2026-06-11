import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import semver from 'semver'

function getCurrentNodeVersion() {
  // under bun, process.version is bun's bundled node-COMPAT string (a fixed
  // value like v24.3.0), not the project's actual node toolchain — comparing
  // it against engines.node rejects any pin newer than bun's compat level.
  // the check exists to guard native-addon ABI for the real `node` binary
  // child processes will run, so resolve that binary's version from PATH.
  if (process.versions.bun) {
    try {
      return execFileSync('node', ['--version'], { encoding: 'utf-8' }).trim()
    } catch {
      // no node on PATH — nothing for the version pin to guard
      return null
    }
  }
  return process.version
}

async function getRequiredNodeVersion() {
  const path = await import('node:path')

  try {
    const nodeVersionContent = await fs.promises.readFile(
      path.join(process.cwd(), '.node-version'),
      'utf-8',
    )
    return nodeVersionContent.trim()
  } catch {}

  try {
    const packageJson = JSON.parse(
      await fs.promises.readFile(path.join(process.cwd(), 'package.json'), 'utf-8'),
    )
    return packageJson?.engines?.node ?? null
  } catch {
    return null
  }
}

export async function checkNodeVersion() {
  const current = getCurrentNodeVersion()
  const required = await getRequiredNodeVersion()

  if (!required || !current) return

  if (semver.validRange(required) && semver.satisfies(current, required)) return

  throw new Error(
    `[33mWarning: Incorrect Node.js version. Expected ${required} but got ${current}[0m`,
  )
}
