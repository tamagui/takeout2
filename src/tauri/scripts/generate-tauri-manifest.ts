#!/usr/bin/env bun

import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { s3Client } from '~/features/upload/s3client'
import { defaultBucket, uploadToS3 } from '~/features/upload/upload'

async function generateAndUploadUpdateManifest() {
  console.info('Generating Tauri update manifest...')

  // Read version and productName from tauri.conf.json (source of truth for Tauri version)
  const tauriConfigPath = join(process.cwd(), 'src/tauri/tauri.conf.json')
  const tauriConfig = JSON.parse(readFileSync(tauriConfigPath, 'utf-8'))
  const version = tauriConfig.version
  const productName = tauriConfig.productName
  const publicKey = tauriConfig.plugins?.updater?.pubkey || 'NOT_FOUND'

  // The signature is for the .tar.gz file, not the DMG
  const tarGzPath = join(
    process.cwd(),
    `src/tauri/target/release/bundle/macos/${productName}.app.tar.gz`
  )

  // Read the signature file created by tauri build
  const sigPath = `${tarGzPath}.sig`
  const signature = readFileSync(sigPath, 'utf-8').trim()
  console.info('Found signature for updater')

  // Calculate file hash for verification
  const tarGzContent = readFileSync(tarGzPath)
  const sha256Hash = createHash('sha256').update(tarGzContent).digest('hex')
  const fileSize = tarGzContent.length

  // Decode signature to get timestamp
  const sigDecoded = Buffer.from(signature, 'base64').toString('utf-8')
  const timestampMatch = sigDecoded.match(/timestamp:(\d+)/)
  const signatureTimestamp = timestampMatch?.[1] ? parseInt(timestampMatch[1], 10) : null

  // Create update manifest
  const manifest = {
    version: version,
    pub_date: new Date().toISOString(),
    platforms: {
      'darwin-aarch64': {
        signature: signature,
        url: 'https://storage.start.chat/onechatimages/releases/macos/latest.tar.gz',
      },
    },
  }

  // Create metadata for debugging
  const metadata = {
    version: version,
    build_date: new Date().toISOString(),
    build_timestamp: Math.floor(Date.now() / 1000),
    signature_timestamp: signatureTimestamp,
    signature_timestamp_human: signatureTimestamp
      ? new Date(signatureTimestamp * 1000).toISOString()
      : null,
    file_info: {
      sha256: sha256Hash,
      size_bytes: fileSize,
      size_mb: (fileSize / 1024 / 1024).toFixed(2),
    },
    public_key_first_20: publicKey.substring(0, 20),
    public_key_last_20: publicKey.substring(publicKey.length - 20),
    signature_first_50: signature.substring(0, 50),
    signature_last_50: signature.substring(signature.length - 50),
    ci_info: {
      github_sha: process.env.GITHUB_SHA || 'local',
      github_ref: process.env.GITHUB_REF || 'local',
      github_run_id: process.env.GITHUB_RUN_ID || 'local',
      github_run_number: process.env.GITHUB_RUN_NUMBER || 'local',
    },
  }

  // Upload manifest to R2
  const manifestPath = '/tmp/tauri-update.json'
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2))

  console.info('Uploading manifest to R2...')
  const result = await uploadToS3(s3Client, {
    bucket: defaultBucket,
    key: 'releases/tauri-update.json',
    body: readFileSync(manifestPath),
    contentType: 'application/json',
  })

  console.info('Manifest uploaded:', result.url)

  // Upload metadata for debugging
  const metadataPath = '/tmp/tauri-release-metadata.json'
  writeFileSync(metadataPath, JSON.stringify(metadata, null, 2))

  console.info('Uploading release metadata...')
  const metadataResult = await uploadToS3(s3Client, {
    bucket: defaultBucket,
    key: 'releases/tauri-release-metadata.json',
    body: readFileSync(metadataPath),
    contentType: 'application/json',
  })

  console.info('Metadata uploaded:', metadataResult.url)

  // Also save version-specific metadata for history
  const versionMetadataResult = await uploadToS3(s3Client, {
    bucket: defaultBucket,
    key: `releases/metadata/v${version}-metadata.json`,
    body: readFileSync(metadataPath),
    contentType: 'application/json',
  })

  console.info('Version metadata uploaded:', versionMetadataResult.url)

  // Clean up
  const { $ } = await import('bun')
  await $`rm -f ${manifestPath} ${metadataPath}`
}

generateAndUploadUpdateManifest().catch((error) => {
  console.error('Failed to generate manifest:', error)
  process.exit(1)
})
