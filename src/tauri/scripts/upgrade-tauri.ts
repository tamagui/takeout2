#!/usr/bin/env bun

import { $ } from 'bun'
import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const projectRoot = resolve(import.meta.dir, '../../..')
const cargoTomlPath = resolve(projectRoot, 'src/tauri/Cargo.toml')
const packageJsonPath = resolve(projectRoot, 'package.json')

interface TauriVersions {
  npm: Map<string, string>
  cargo: Map<string, string>
}

async function getTauriVersions(): Promise<TauriVersions> {
  // get npm versions
  const npmVersionsOutput = await $`bun pm ls | grep "@tauri-apps/"`.text()
  const npmVersions = new Map<string, string>()

  for (const line of npmVersionsOutput.split('\n')) {
    if (!line.trim()) continue
    const match = line.match(/@tauri-apps\/([^@]+)@([\d.]+)/)
    if (match) {
      const [, pkg, version] = match
      if (pkg && version) {
        npmVersions.set(pkg, version)
      }
    }
  }

  // get cargo versions from Cargo.toml
  const cargoToml = await readFile(cargoTomlPath, 'utf-8')
  const cargoVersions = new Map<string, string>()

  // extract tauri crate versions
  const tauriCrates = [
    'tauri',
    'tauri-build',
    'tauri-plugin-shell',
    'tauri-plugin-deep-link',
    'tauri-plugin-dialog',
    'tauri-plugin-fs',
    'tauri-plugin-notification',
    'tauri-plugin-process',
    'tauri-plugin-single-instance',
    'tauri-plugin-updater',
    'tauri-plugin-window-state',
  ]

  for (const crate of tauriCrates) {
    const regex = new RegExp(
      `${crate}\\s*=\\s*(?:{[^}]*version\\s*=\\s*"([^"]+)"|"([^"]+)")`
    )
    const match = cargoToml.match(regex)
    if (match) {
      const version = match[1] || match[2]
      if (version) {
        cargoVersions.set(crate, version)
      }
    }
  }

  return { npm: npmVersions, cargo: cargoVersions }
}

function compareVersions(npmVersion: string, cargoVersion: string): boolean {
  // handle version strings like "2" or "2.0" or "2.0.0"
  const npmParts = npmVersion.split('.')
  const cargoParts = cargoVersion.split('.')

  // compare major and minor versions
  const npmMajor = parseInt(npmParts[0] || '0')
  const npmMinor = parseInt(npmParts[1] || '0')

  const cargoMajor = parseInt(cargoParts[0] || '0')
  const cargoMinor = parseInt(cargoParts[1] || '0')

  return npmMajor === cargoMajor && npmMinor === cargoMinor
}

function mapNpmToCargo(npmPkg: string): string | null {
  const mappings: Record<string, string> = {
    api: 'tauri',
    cli: 'tauri-build',
    'plugin-shell': 'tauri-plugin-shell',
    'plugin-deep-link': 'tauri-plugin-deep-link',
    'plugin-dialog': 'tauri-plugin-dialog',
    'plugin-fs': 'tauri-plugin-fs',
    'plugin-notification': 'tauri-plugin-notification',
    'plugin-process': 'tauri-plugin-process',
    'plugin-updater': 'tauri-plugin-updater',
    'plugin-window-state': 'tauri-plugin-window-state',
  }

  return mappings[npmPkg] || null
}

async function findLatestCompatibleVersion(targetMajorMinor: string): Promise<string> {
  // get latest version that matches the major.minor
  const output = await $`npm view @tauri-apps/api versions --json`.json()
  const versions = output as string[]

  const [targetMajor, targetMinor] = targetMajorMinor.split('.').map(Number)

  // find all versions matching major.minor
  const compatibleVersions = versions.filter((v) => {
    const [major, minor] = v.split('.').map(Number)
    return major === targetMajor && minor === targetMinor
  })

  // return the latest one
  return compatibleVersions[compatibleVersions.length - 1] || targetMajorMinor
}

// get actual latest crate versions from crates.io
async function getLatestCrateVersions(): Promise<Map<string, string>> {
  const crates = [
    'tauri',
    'tauri-build',
    'tauri-plugin-shell',
    'tauri-plugin-deep-link',
    'tauri-plugin-dialog',
    'tauri-plugin-fs',
    'tauri-plugin-notification',
    'tauri-plugin-process',
    'tauri-plugin-single-instance',
    'tauri-plugin-updater',
    'tauri-plugin-window-state',
  ]

  const crateVersions = new Map<string, string>()

  console.info('🔍 fetching latest crate versions from crates.io...')

  for (const crate of crates) {
    try {
      const output = await $`cargo search ${crate} --limit 1`.text()
      const match = output.match(new RegExp(`${crate}\\s*=\\s*"([^"]+)"`))
      if (match && match[1]) {
        crateVersions.set(crate, match[1])
      }
    } catch (error) {
      console.info(`⚠️  could not fetch version for ${crate}`)
    }
  }

  return crateVersions
}

async function getLatestStableNpmVersions(): Promise<Map<string, string>> {
  const packages = [
    'api',
    'cli',
    'plugin-deep-link',
    'plugin-dialog',
    'plugin-fs',
    'plugin-notification',
    'plugin-process',
    'plugin-shell',
    'plugin-updater',
    'plugin-window-state',
  ]

  const latestVersions = new Map<string, string>()

  for (const pkg of packages) {
    try {
      const output = await $`npm view @tauri-apps/${pkg} version`.text()
      latestVersions.set(pkg, output.trim())
    } catch (error) {
      console.info(`⚠️  could not fetch version for @tauri-apps/${pkg}`)
    }
  }

  return latestVersions
}

async function upgradeTauri(targetVersion?: string) {
  console.info('🔍 checking tauri package versions...')

  const versions = await getTauriVersions()
  const mismatches: Array<{
    npm: string
    cargo: string
    npmVersion: string
    cargoVersion: string
  }> = []

  // check for version mismatches
  for (const [npmPkg, npmVersion] of versions.npm) {
    const cargoCrate = mapNpmToCargo(npmPkg)
    if (!cargoCrate) continue

    const cargoVersion = versions.cargo.get(cargoCrate)
    if (cargoVersion && !compareVersions(npmVersion, cargoVersion)) {
      mismatches.push({
        npm: npmPkg,
        cargo: cargoCrate,
        npmVersion,
        cargoVersion,
      })
    }
  }

  if (mismatches.length > 0) {
    console.info('⚠️  found version mismatches:')
    for (const mismatch of mismatches) {
      console.info(
        `   @tauri-apps/${mismatch.npm}@${mismatch.npmVersion} ↔ ${mismatch.cargo}="${mismatch.cargoVersion}"`
      )
    }
  }

  // determine target version
  let upgradeVersion = targetVersion

  if (!upgradeVersion) {
    // get the latest stable versions from npm
    const latestStableVersions = await getLatestStableNpmVersions()

    // find the most common major.minor version from latest stable
    const versionCounts = new Map<string, number>()

    for (const [, version] of latestStableVersions) {
      const [major, minor] = version.split('.')
      const majorMinor = `${major}.${minor}`
      versionCounts.set(majorMinor, (versionCounts.get(majorMinor) || 0) + 1)
    }

    // get the most common version
    let maxCount = 0
    for (const [version, count] of versionCounts) {
      if (count > maxCount) {
        maxCount = count
        upgradeVersion = version
      }
    }
  }

  if (!upgradeVersion) {
    console.info('✅ all tauri packages are already aligned')
    return
  }

  // find the latest patch version for the target major.minor
  const latestVersion = await findLatestCompatibleVersion(upgradeVersion)
  console.info(`\n📦 upgrading all tauri packages to latest stable versions...`)
  console.info(`   base version: v${latestVersion}`)

  // upgrade npm packages
  console.info('\n🔄 upgrading npm packages...')
  await $`bun up @tauri-apps/api @tauri-apps/cli @tauri-apps/plugin-deep-link @tauri-apps/plugin-dialog @tauri-apps/plugin-fs @tauri-apps/plugin-notification @tauri-apps/plugin-process @tauri-apps/plugin-shell @tauri-apps/plugin-updater @tauri-apps/plugin-window-state`

  // get the latest crate versions
  const latestCrateVersions = await getLatestCrateVersions()

  // update cargo.toml
  console.info('\n🔄 updating cargo.toml...')
  let cargoToml = await readFile(cargoTomlPath, 'utf-8')

  // update each crate to its latest version
  for (const [crate, version] of latestCrateVersions) {
    console.info(`   ${crate} -> ${version}`)

    // match table format: { version = "x", ... }
    cargoToml = cargoToml.replace(
      new RegExp(`(${crate}\\s*=\\s*{[^}]*version\\s*=\\s*)"[^"]+"`),
      `$1"${version}"`
    )

    // match inline format: "x"
    cargoToml = cargoToml.replace(
      new RegExp(`(${crate}\\s*=\\s*)"[^"]+"`),
      `$1"${version}"`
    )
  }

  await writeFile(cargoTomlPath, cargoToml)

  // run cargo update to ensure lock file is updated
  console.info('\n🔄 updating cargo dependencies...')
  await $`cd ${resolve(projectRoot, 'src/tauri')} && cargo update`

  console.info('\n✅ tauri upgrade complete!')
  console.info(`   all packages aligned to v${latestVersion}`)

  // check if everything is aligned now
  const finalVersions = await getTauriVersions()
  const stillMismatched: string[] = []

  for (const [npmPkg, npmVersion] of finalVersions.npm) {
    const cargoCrate = mapNpmToCargo(npmPkg)
    if (!cargoCrate) continue

    const cargoVersion = finalVersions.cargo.get(cargoCrate)
    if (cargoVersion && !compareVersions(npmVersion, cargoVersion)) {
      stillMismatched.push(
        `@tauri-apps/${npmPkg}@${npmVersion} ↔ ${cargoCrate}="${cargoVersion}"`
      )
    }
  }

  if (stillMismatched.length > 0) {
    console.info('\n⚠️  some packages may still need manual adjustment:')
    for (const mismatch of stillMismatched) {
      console.info(`   ${mismatch}`)
    }
  }
}

// parse command line arguments
const args = process.argv.slice(2)
const targetVersion = args[0]

if (args.includes('--help') || args.includes('-h')) {
  console.info(`
Usage: bun upgrade:tauri [version]

Synchronizes Tauri package versions between NPM and Cargo.

Options:
  [version]  Target major.minor version (e.g., "2.8")
             If not specified, uses the most common version
  --help     Show this help message

Examples:
  bun upgrade:tauri        # auto-detect and align versions
  bun upgrade:tauri 2.8    # upgrade all to v2.8.x
`)
  process.exit(0)
}

await upgradeTauri(targetVersion)
