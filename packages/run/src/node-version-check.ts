import fs from 'node:fs'
import semver from 'semver'

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
  const current = process.version
  const required = await getRequiredNodeVersion()

  if (!required) return

  if (semver.validRange(required) && semver.satisfies(current, required)) return

  throw new Error(
    `[33mWarning: Incorrect Node.js version. Expected ${required} but got ${current}[0m`,
  )
}
