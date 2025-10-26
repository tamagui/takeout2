#!/usr/bin/env bun
/**
 * Create a PR to bump the version in tauri.conf.json
 * Used for automated version management
 */

import { execSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

interface TauriConfig {
  package: {
    version: string
  }
  tauri: {
    updater?: {
      endpoints: string[]
    }
  }
}

function getCurrentVersion(): string {
  const tauriConfigPath = join(process.cwd(), 'tauri.conf.json')
  const config: TauriConfig = JSON.parse(readFileSync(tauriConfigPath, 'utf-8'))
  return config.package.version
}

function bumpVersion(version: string, type: 'major' | 'minor' | 'patch'): string {
  const parts = version.split('.').map(Number)
  const major = parts[0] || 0
  const minor = parts[1] || 0
  const patch = parts[2] || 0

  switch (type) {
    case 'major':
      return `${major + 1}.0.0`
    case 'minor':
      return `${major}.${minor + 1}.0`
    case 'patch':
      return `${major}.${minor}.${patch + 1}`
  }
}

function updateVersion(newVersion: string) {
  // update tauri.conf.json
  const tauriConfigPath = join(process.cwd(), 'tauri.conf.json')
  const config: TauriConfig = JSON.parse(readFileSync(tauriConfigPath, 'utf-8'))
  config.package.version = newVersion
  writeFileSync(tauriConfigPath, JSON.stringify(config, null, 2) + '\n')

  // update app.config.ts
  const appConfigPath = join(process.cwd(), 'app.config.ts')
  let appConfig = readFileSync(appConfigPath, 'utf-8')
  appConfig = appConfig.replace(
    /const version = ['"][\d.]+['"]/,
    `const version = '${newVersion}'`
  )
  writeFileSync(appConfigPath, appConfig)

  // update package.json
  const packagePath = join(process.cwd(), 'package.json')
  const packageJson = JSON.parse(readFileSync(packagePath, 'utf-8'))
  packageJson.version = newVersion
  writeFileSync(packagePath, JSON.stringify(packageJson, null, 2) + '\n')
}

async function createPR(version: string, newVersion: string) {
  const branchName = `bump-tauri-version-${newVersion}`

  // create new branch
  execSync(`git checkout -b ${branchName}`)

  // commit changes
  execSync('git add -A')
  execSync(`git commit -m "chore: bump Tauri version to ${newVersion}"`)

  // push branch
  execSync(`git push origin ${branchName}`)

  // create PR using gh cli
  const prBody = `
## Version Bump: ${version} → ${newVersion}

This PR automatically bumps the Tauri desktop app version.

### Changes:
- Updated \`tauri.conf.json\` version
- Updated \`app.config.ts\` version constant
- Updated \`package.json\` version

### Next Steps:
1. Review the changes
2. Merge this PR to trigger a new Tauri build
3. The CI will automatically build and upload the new version
  `.trim()

  execSync(
    `gh pr create --title "chore: bump Tauri version to ${newVersion}" --body "${prBody}" --base main`
  )
}

async function main() {
  const args = process.argv.slice(2)
  const bumpType = (args[0] as 'major' | 'minor' | 'patch') || 'patch'

  if (!['major', 'minor', 'patch'].includes(bumpType)) {
    console.error('Invalid bump type. Use: major, minor, or patch')
    process.exit(1)
  }

  // ensure we're on main branch with no uncommitted changes
  const currentBranch = execSync('git branch --show-current', {
    encoding: 'utf-8',
  }).trim()
  if (currentBranch !== 'main') {
    console.error('Must be on main branch to create version bump PR')
    process.exit(1)
  }

  const status = execSync('git status --porcelain', { encoding: 'utf-8' }).trim()
  if (status) {
    console.error('Working directory has uncommitted changes')
    process.exit(1)
  }

  // get current version and bump it
  const currentVersion = getCurrentVersion()
  const newVersion = bumpVersion(currentVersion, bumpType)

  console.info(`Bumping version: ${currentVersion} → ${newVersion}`)

  // update version in files
  updateVersion(newVersion)

  // create PR
  await createPR(currentVersion, newVersion)

  console.info(`PR created for version ${newVersion}`)

  // switch back to main
  execSync('git checkout main')
}

if (import.meta.main) {
  main().catch((error) => {
    console.error('Failed to create version bump PR:', error)
    process.exit(1)
  })
}
