#!/usr/bin/env bun
/**
 * Build Tauri app in CI environment
 * Handles version management and artifact uploads
 */

import { execSync } from 'node:child_process'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import crypto from 'node:crypto'

const CLOUDFLARE_R2_BUCKET = 'onechatimages'
const RELEASES_PATH = 'releases'

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

async function uploadToR2(localPath: string, remotePath: string) {
  const command = `aws s3 cp ${localPath} s3://${CLOUDFLARE_R2_BUCKET}/${remotePath} --endpoint-url ${process.env.CLOUDFLARE_R2_ENDPOINT}`

  console.info(`Uploading ${localPath} to ${remotePath}...`)
  execSync(command, { stdio: 'inherit' })
}

async function generateHash(filePath: string): Promise<string> {
  const content = readFileSync(filePath)
  return crypto.createHash('sha256').update(content).digest('hex')
}

async function buildTauri() {
  console.info('Building Tauri app...')

  // ensure tauri.conf.json exists
  const tauriConfigPath = join(process.cwd(), 'tauri.conf.json')
  if (!existsSync(tauriConfigPath)) {
    console.error('tauri.conf.json not found!')
    process.exit(1)
  }

  // read current version from tauri.conf.json
  const config: TauriConfig = JSON.parse(readFileSync(tauriConfigPath, 'utf-8'))
  const version = config.package.version

  console.info(`Building version ${version}`)

  // build for production
  execSync('bun tauri build', {
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_ENV: 'production',
    },
  })

  // find built artifacts
  const platform = process.platform
  let artifactPath = ''
  let hashPath = ''

  if (platform === 'darwin') {
    artifactPath = `src-tauri/target/release/bundle/dmg/takeout_${version}_x64.dmg`
    hashPath = `${artifactPath}.sha256`
  } else if (platform === 'linux') {
    artifactPath = `src-tauri/target/release/bundle/appimage/takeout_${version}_amd64.AppImage`
    hashPath = `${artifactPath}.sha256`
  } else if (platform === 'win32') {
    artifactPath = `src-tauri/target/release/bundle/msi/takeout_${version}_x64.msi`
    hashPath = `${artifactPath}.sha256`
  }

  if (!existsSync(artifactPath)) {
    console.error(`Built artifact not found at ${artifactPath}`)
    process.exit(1)
  }

  // generate hash
  const hash = await generateHash(artifactPath)
  writeFileSync(hashPath, hash)

  // upload to R2
  const remoteArtifactPath = `${RELEASES_PATH}/${platform}/${version}/${artifactPath.split('/').pop()}`
  const remoteHashPath = `${remoteArtifactPath}.sha256`

  await uploadToR2(artifactPath, remoteArtifactPath)
  await uploadToR2(hashPath, remoteHashPath)

  // create/update update manifest
  const manifestPath = 'tauri-update.json'
  const manifest = {
    version,
    platforms: {
      [platform]: {
        url: `${process.env.CLOUDFLARE_R2_PUBLIC_URL}/${CLOUDFLARE_R2_BUCKET}/${remoteArtifactPath}`,
        sha256: hash,
      },
    },
  }

  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2))
  await uploadToR2(manifestPath, `${RELEASES_PATH}/tauri-update.json`)

  // save build hash for change detection
  execSync('bun ./src/tauri/scripts/check-tauri-changed.ts')

  console.info('Tauri build and upload complete!')
}

async function main() {
  // check required env vars
  const required = [
    'CLOUDFLARE_R2_ENDPOINT',
    'CLOUDFLARE_R2_PUBLIC_URL',
    'AWS_ACCESS_KEY_ID',
    'AWS_SECRET_ACCESS_KEY',
  ]

  for (const key of required) {
    if (!process.env[key]) {
      console.error(`Missing required environment variable: ${key}`)
      process.exit(1)
    }
  }

  await buildTauri()
}

if (import.meta.main) {
  main().catch((error) => {
    console.error('Build failed:', error)
    process.exit(1)
  })
}
