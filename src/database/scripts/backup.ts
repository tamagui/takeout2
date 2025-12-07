#!/usr/bin/env bun

import { spawn } from 'node:child_process'
import { unlink } from 'node:fs/promises'
import { join } from 'node:path'

import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { time, type Timer } from '@take-out/helpers'
import { ensureS3Bucket } from '@take-out/scripts/helpers/ensure-s3-bucket'
import { run } from '@take-out/scripts/helpers/run'
import { Resource } from 'sst'

import { pruneBackups } from './prune-backups'

const BUCKET_NAME = 'start-dot-chat-db-backups'
const REGION = 'us-west-1'
const BACKUP_TIMEOUT_MS = time.ms.minutes(5)

async function checkDatabaseConnection(): Promise<boolean> {
  console.info('🔍 Checking database connectivity...')

  const out = await run(
    `pg_isready -d ${Resource.Postgres2.database} -h ${Resource.Postgres2.host} -U ${Resource.Postgres2.username}`,
    {
      timeout: time.ms.seconds(5),
    }
  )

  return out.exitCode === 0
}

export async function backupDatabase() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const backupFileName = `db-backup-${timestamp}.sql.gz`
  const localBackupPath = join('/tmp', backupFileName)
  const s3Key = `db-backups/production/${backupFileName}`

  console.info('🔄 Database Backup')
  console.info(`Source: ${Resource.Postgres2.database} on ${Resource.Postgres2.host}`)
  console.info(`Target: s3://${BUCKET_NAME}/${s3Key}`)
  console.info(`Timestamp: ${timestamp}\n`)

  // check database connectivity first
  const isConnected = await checkDatabaseConnection()
  if (!isConnected) {
    console.error('❌ Cannot connect to database. Aborting backup.')
    throw new Error('Database connection check failed')
  }

  console.info('✅ Database connection verified')

  // ensure s3 bucket exists
  await ensureS3Bucket(BUCKET_NAME, {
    region: REGION,
    retentionDays: 30,
  })

  console.info('📥 Creating database backup (timeout: 5 minutes)...')

  // create pg_dump with timeout
  const dumpSuccess = await new Promise<boolean>((resolve) => {
    const dumpProcess = spawn(
      'pg_dump',
      [
        '--clean',
        '--if-exists',
        '--no-owner',
        '--no-privileges',
        '--verbose',
        '--format=custom',
        '--compress=9',
        '--file',
        localBackupPath,
      ],
      {
        env: {
          ...process.env,
          PGPASSWORD: Resource.Postgres2.password,
          PGUSER: Resource.Postgres2.username,
          PGHOST: Resource.Postgres2.host,
          PGDATABASE: Resource.Postgres2.database,
          PGCONNECT_TIMEOUT: '10',
        } as any,
        stdio: 'inherit',
      }
    )

    let timeoutId: Timer

    dumpProcess.on('error', (err) => {
      console.error('❌ pg_dump process error:', err)
      clearTimeout(timeoutId)
      resolve(false)
    })

    dumpProcess.on('exit', (code) => {
      clearTimeout(timeoutId)
      if (code === 0) {
        resolve(true)
      } else {
        console.error(`❌ pg_dump exited with code ${code}`)
        resolve(false)
      }
    })

    // set timeout
    timeoutId = setTimeout(() => {
      console.error('❌ Database backup timed out after 5 minutes')
      dumpProcess.kill('SIGTERM')
      setTimeout(() => {
        if (!dumpProcess.killed) {
          dumpProcess.kill('SIGKILL')
        }
      }, 5000)
      resolve(false)
    }, BACKUP_TIMEOUT_MS)
  })

  if (!dumpSuccess) {
    console.error('❌ Failed to create database backup')
    throw new Error('Database backup failed or timed out')
  }

  // get file size
  const fileStats = await Bun.file(localBackupPath).stat()
  const fileSizeMB = (fileStats.size / 1024 / 1024).toFixed(2)
  console.info(`✅ Backup created: ${fileSizeMB} MB`)

  // upload to s3
  console.info('\n📤 Uploading to S3...')
  const s3Client = new S3Client({
    region: REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  })

  const fileBuffer = await Bun.file(localBackupPath).arrayBuffer()

  await s3Client.send(
    new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: s3Key,
      Body: Buffer.from(fileBuffer),
      ContentType: 'application/octet-stream',
      Metadata: {
        database: Resource.Postgres2.database,
        timestamp: timestamp,
        'size-mb': fileSizeMB,
        'git-sha': process.env.GITHUB_SHA || 'unknown',
      },
      StorageClass: 'STANDARD_IA', // infrequent access for cost savings
    })
  )

  console.info(`✅ Uploaded to S3: s3://${BUCKET_NAME}/${s3Key}`)

  // cleanup local file
  await unlink(localBackupPath)
  console.info('🧹 Cleaned up local backup file')

  console.info('\n✨ Database backup completed successfully!')
  console.info(`📍 Location: s3://${BUCKET_NAME}/${s3Key}`)
  console.info(`📏 Size: ${fileSizeMB} MB`)
  console.info(`⏰ Timestamp: ${timestamp}`)

  // prune old backups
  console.info('\n')
  await pruneBackups(BUCKET_NAME, 'db-backups/production/', {
    region: REGION,
    dryRun: false,
  })

  return {
    bucket: BUCKET_NAME,
    key: s3Key,
    size: fileSizeMB,
    timestamp,
  }
}

// run directly if RUN env is set or if executed as script
if (process.env.RUN || import.meta.main) {
  backupDatabase()
}
