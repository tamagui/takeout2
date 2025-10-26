#!/usr/bin/env bun

const FALLBACK_VERSION = '0.1.0'
const UPDATE_MANIFEST_URL = `${process.env.CLOUDFLARE_R2_PUBLIC_URL || 'https://storage.start.chat'}/onechatimages/releases/tauri-update.json`

async function getLatestVersion(): Promise<string | null> {
  try {
    console.info('Fetching latest version from update manifest...')
    const response = await fetch(UPDATE_MANIFEST_URL)

    if (!response.ok) {
      console.info('No update manifest found, using fallback version')
      return null
    }

    const manifest = await response.json()
    console.info(`Found latest version: ${manifest.version}`)
    return manifest.version
  } catch (error) {
    console.info('Failed to fetch update manifest, using fallback version')
    return null
  }
}

async function getNextVersion(): Promise<string> {
  const latestVersion = await getLatestVersion()

  if (!latestVersion) {
    console.info(`Using fallback version: ${FALLBACK_VERSION}`)
    return FALLBACK_VERSION
  }

  // Parse version and bump minor
  const versionParts = latestVersion.match(/^(\d+)\.(\d+)\.(\d+)(.*)$/)
  if (!versionParts) {
    console.error(`Invalid version format: ${latestVersion}, using fallback`)
    return FALLBACK_VERSION
  }

  const [, major, minor, patch, suffix = ''] = versionParts
  const newMinor = parseInt(minor!) + 1
  const newVersion = `${major}.${newMinor}.0${suffix}`

  console.info(`Next version: ${newVersion}`)
  return newVersion
}

// If run directly, output the next version
if (import.meta.main) {
  const nextVersion = await getNextVersion()
}

export { getNextVersion }
