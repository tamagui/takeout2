import fs from 'node:fs'

function getCurrentNodeVersion() {
  return process.version
}

async function getRequiredNodeVersion() {
  const path = await import('node:path')

  try {
    const nodeVersionContent = await fs.promises.readFile(
      path.join(process.cwd(), '.node-version'),
      'utf-8'
    )
    return `v${nodeVersionContent.trim()}`
  } catch {}

  try {
    const packageJson = JSON.parse(
      await fs.promises.readFile(path.join(process.cwd(), 'package.json'), 'utf-8')
    )
    return packageJson?.engines?.node ? `v${packageJson.engines.node}` : null
  } catch {
    return null
  }
}

export async function checkNodeVersion() {
  const currentNodeVersion = getCurrentNodeVersion()
  const requiredNodeVersion = await getRequiredNodeVersion()

  if (requiredNodeVersion) {
    if (currentNodeVersion !== requiredNodeVersion) {
      throw new Error(
        `\u001b[33mWarning: Incorrect Node.js version. Expected ${requiredNodeVersion} but got ${currentNodeVersion}\u001b[0m`
      )
    }
  }
}
