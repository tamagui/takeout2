#!/usr/bin/env bun
import { $ } from 'bun'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

async function createVersionBumpPR() {
  try {
    // read the current version from tauri.conf.json
    const tauriConfigPath = join(process.cwd(), 'src/tauri/tauri.conf.json')
    const tauriConfig = JSON.parse(await readFile(tauriConfigPath, 'utf-8'))
    const version = tauriConfig.version

    // check if we have any uncommitted changes
    const gitStatus = await $`git status --porcelain`.text()

    if (!gitStatus.trim()) {
      process.exit(0)
    }

    // create a new branch for the PR
    const branchName = `auto/version-bump-${version}`

    // configure git
    await $`git config user.name "github-actions[bot]"`
    await $`git config user.email "github-actions[bot]@users.noreply.github.com"`

    // check if remote branch exists
    const remoteBranches = await $`git ls-remote --heads origin ${branchName}`.text()

    if (remoteBranches.trim()) {
      process.exit(0)
    }

    // create and checkout new branch
    await $`git checkout -b ${branchName}`

    // add only the version-related files
    const filesToAdd = [
      'src/tauri/tauri.conf.json',
      'src/tauri/Cargo.toml',
      'src/tauri/Cargo.lock',
    ]

    for (const file of filesToAdd) {
      // check if file exists and has changes
      const fileStatus = await $`git status --porcelain ${file}`.text()
      if (fileStatus.trim()) {
        await $`git add ${file}`
      }
    }

    // create commit
    await $`git commit -m "chore: bump tauri version to ${version}"`

    // push branch
    await $`git push origin ${branchName}`

    // create PR using GitHub CLI
    const prBody = `## Automated Version Bump

This PR was automatically created by the CI pipeline after a successful Tauri build.

### Changes
- Bumped Tauri app version to \`${version}\`
- Updated \`tauri.conf.json\`
- Updated \`Cargo.toml\` and \`Cargo.lock\`

### Notes
- These changes were made during the Tauri build process
- The build artifacts have already been uploaded to the release storage
- This PR ensures the version changes are committed back to the repository

---
*This is an automated PR created by the Tauri CI workflow.*`

    const prUrl = await $`gh pr create \
      --title "chore: bump tauri version to ${version}" \
      --body "${prBody}" \
      --base main \
      --head ${branchName} \
      --label "automated" \
      --label "version-bump"`.text()
  } catch (error) {
    console.error('failed to create version bump PR:', error)
    // don't fail the CI if PR creation fails
    process.exit(0)
  }
}

createVersionBumpPR()
