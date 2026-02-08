import fs from 'node:fs'
import { join } from 'node:path'

export function getZeroVersion() {
  const packageJsonPath = join(process.cwd(), 'package.json')
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'))
  return packageJson.dependencies?.['@rocicorp/zero']?.replace(/^[\^~]/, '')
}
