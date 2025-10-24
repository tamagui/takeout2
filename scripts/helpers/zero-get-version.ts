import { readFileSync } from 'node:fs'
import { join } from 'node:path'

export function getZeroVersion() {
  const packageJsonPath = join(process.cwd(), 'package.json')
  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'))
  return packageJson.dependencies?.['@rocicorp/zero']?.replace(/^[\^~]/, '')
}
