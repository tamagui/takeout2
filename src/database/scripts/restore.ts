#!/usr/bin/env bun

import { GetObjectCommand, ListObjectsV2Command, S3Client } from '@aws-sdk/client-s3'
import { createWriteStream } from 'node:fs'
import { join } from 'node:path'
import { pipeline } from 'node:stream/promises'
import type { Readable } from 'node:stream'
import { parseArgs } from 'node:util'

const BUCKET_NAME = 'start-dot-chat-db-backups'
const REGION = 'us-west-1'

const { values } = parseArgs({
  args: process.argv.slice(2),
  options: {
    list: {
      type: 'boolean',
      default: false,
    },
    download: {
      type: 'string',
    },
    latest: {
      type: 'boolean',
      default: false,
    },
    output: {
      type: 'string',
    },
  },
})

async function main() {
  const s3Client = new S3Client({
    region: REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  })

  // list backups
  const listResponse = await s3Client.send(
    new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: 'db-backups/production/',
      MaxKeys: 20,
    })
  )

  if (!listResponse.Contents || listResponse.Contents.length === 0) {
    console.error('❌ No backups found in S3')
    process.exit(1)
  }

  // sort by last modified (newest first)
  const sortedBackups = listResponse.Contents.sort(
    (a, b) => (b.LastModified?.getTime() || 0) - (a.LastModified?.getTime() || 0)
  )

  if (values.list) {
    console.info(`📦 Found ${sortedBackups.length} backup(s):\n`)
    sortedBackups.forEach((obj, idx) => {
      const sizeMB = ((obj.Size || 0) / 1024 / 1024).toFixed(2)
      console.info(`${idx + 1}. ${obj.Key}`)
      console.info(`   Size: ${sizeMB} MB`)
      console.info(`   Modified: ${obj.LastModified?.toISOString()}`)
      console.info('')
    })
    return
  }

  let targetKey: string | undefined

  if (values.latest) {
    targetKey = sortedBackups[0]?.Key
    console.info(`📥 Downloading latest backup: ${targetKey}`)
  } else if (values.download) {
    // find backup by partial match
    const backup = sortedBackups.find((b) => b.Key?.includes(values.download!))
    if (!backup?.Key) {
      console.error(`❌ No backup found matching: ${values.download}`)
      console.info('\nAvailable backups:')
      sortedBackups.forEach((b) => console.info(`  - ${b.Key}`))
      process.exit(1)
    }
    targetKey = backup.Key
    console.info(`📥 Downloading backup: ${targetKey}`)
  } else {
    console.info('Usage:')
    console.info('  --list                    List all available backups')
    console.info('  --latest                  Download the latest backup')
    console.info('  --download <partial-name> Download a specific backup')
    console.info('  --output <path>           Output path (default: /tmp)')
    console.info('')
    console.info('Examples:')
    console.info('  bun ./src/database/scripts/restore.ts --list')
    console.info('  bun ./src/database/scripts/restore.ts --latest')
    console.info('  bun ./src/database/scripts/restore.ts --download 2025-08-21T15')
    console.info('  bun ./src/database/scripts/restore.ts --latest --output ./backups/')
    return
  }

  if (!targetKey) {
    console.error('❌ No backup selected')
    process.exit(1)
  }

  const outputDir = values.output || '/tmp'
  const outputPath = join(outputDir, targetKey.split('/').pop()!)

  console.info(`📍 Downloading to: ${outputPath}`)

  const getResponse = await s3Client.send(
    new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: targetKey,
    })
  )

  if (!getResponse.Body) {
    console.error('❌ Failed to download backup')
    process.exit(1)
  }

  // save to file
  const writeStream = createWriteStream(outputPath)
  await pipeline(getResponse.Body as Readable, writeStream)

  const downloadedFile = Bun.file(outputPath)
  const stats = await downloadedFile.stat()
  const downloadedSizeMB = (stats.size / 1024 / 1024).toFixed(2)

  console.info(`✅ Successfully downloaded backup`)
  console.info(`📍 Location: ${outputPath}`)
  console.info(`📏 Size: ${downloadedSizeMB} MB`)

  // verify it's a valid pg_dump file
  const header = await downloadedFile.slice(0, 5).text()
  if (header === 'PGDMP') {
    console.info('✅ Valid PostgreSQL custom format dump file')
    console.info('')
    console.info('To restore this backup to a database:')
    console.info(
      `  pg_restore --clean --if-exists --no-owner --no-privileges -d <database_url> ${outputPath}`
    )
  } else {
    console.warn('⚠️  File format may not be a valid PostgreSQL dump')
  }
}

main().catch((error) => {
  console.error('❌ Error:', error)
  process.exit(1)
})
