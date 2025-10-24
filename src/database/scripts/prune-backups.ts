import { DeleteObjectsCommand, ListObjectsV2Command, S3Client } from '@aws-sdk/client-s3'

interface BackupInfo {
  key: string
  date: Date
  size: number
}

export async function pruneBackups(
  bucketName: string,
  prefix: string,
  options?: {
    region?: string
    dryRun?: boolean
  }
): Promise<{ kept: string[]; deleted: string[] }> {
  const region = options?.region ?? 'us-west-1'
  const dryRun = options?.dryRun ?? false

  const s3Client = new S3Client({
    region,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  })

  console.info('🧹 Pruning old backups...')

  // list all backups
  const allBackups: BackupInfo[] = []
  let continuationToken: string | undefined

  do {
    const response = await s3Client.send(
      new ListObjectsV2Command({
        Bucket: bucketName,
        Prefix: prefix,
        ContinuationToken: continuationToken,
      })
    )

    if (response.Contents) {
      for (const obj of response.Contents) {
        if (obj.Key && obj.LastModified && obj.Size) {
          // extract date from filename (format: db-backup-2025-08-21T15-50-48-103Z.sql)
          const match = obj.Key.match(/(\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z)/)
          if (match) {
            const dateStr = match[1]!.replace(/-(\d{2})-(\d{2})-(\d{3}Z)/, ':$1:$2.$3')
            allBackups.push({
              key: obj.Key,
              date: new Date(dateStr),
              size: obj.Size,
            })
          }
        }
      }
    }

    continuationToken = response.NextContinuationToken
  } while (continuationToken)

  if (allBackups.length === 0) {
    console.info('No backups found to prune')
    return { kept: [], deleted: [] }
  }

  // sort by date (newest first)
  allBackups.sort((a, b) => b.date.getTime() - a.date.getTime())

  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  const toKeep = new Set<string>()
  const toDelete: string[] = []

  // group backups by day and month
  const dailyBackups = new Map<string, BackupInfo[]>()
  const monthlyBackups = new Map<string, BackupInfo[]>()

  for (const backup of allBackups) {
    const dayKey = backup.date.toISOString().split('T')[0]! // YYYY-MM-DD
    const monthKey = dayKey.substring(0, 7) // YYYY-MM

    if (!dailyBackups.has(dayKey)) {
      dailyBackups.set(dayKey, [])
    }
    const dayBackupsList = dailyBackups.get(dayKey)
    if (dayBackupsList) {
      dayBackupsList.push(backup)
    }

    if (!monthlyBackups.has(monthKey)) {
      monthlyBackups.set(monthKey, [])
    }
    const monthBackupsList = monthlyBackups.get(monthKey)
    if (monthBackupsList) {
      monthBackupsList.push(backup)
    }
  }

  // keep daily backups for last 30 days
  for (const [dayKey, backups] of dailyBackups) {
    const dayDate = new Date(dayKey)
    if (dayDate >= thirtyDaysAgo) {
      // keep the most recent backup for each day
      const latestBackup = backups[0]
      if (latestBackup) {
        toKeep.add(latestBackup.key)
      }
    }
  }

  // keep monthly backups for older than 30 days
  for (const [monthKey, backups] of monthlyBackups) {
    const monthDate = new Date(monthKey + '-01')
    if (monthDate < thirtyDaysAgo) {
      // keep the most recent backup for each month
      const latestBackup = backups[0]
      if (latestBackup) {
        toKeep.add(latestBackup.key)
      }
    }
  }

  // always keep the very latest backup regardless of rules
  if (allBackups.length > 0) {
    const latestBackup = allBackups[0]
    if (latestBackup) {
      toKeep.add(latestBackup.key)
    }
  }

  // determine which backups to delete
  for (const backup of allBackups) {
    if (!toKeep.has(backup.key)) {
      toDelete.push(backup.key)
    }
  }

  console.info(`📊 Backup retention summary:`)
  console.info(`   Total backups: ${allBackups.length}`)
  console.info(`   Keeping: ${toKeep.size}`)
  console.info(`   Deleting: ${toDelete.length}`)

  if (toDelete.length > 0) {
    if (dryRun) {
      console.info('\n🔍 DRY RUN - Would delete:')
      for (const key of toDelete.slice(0, 10)) {
        console.info(`   - ${key}`)
      }
      if (toDelete.length > 10) {
        console.info(`   ... and ${toDelete.length - 10} more`)
      }
    } else {
      console.info('\n🗑️  Deleting old backups...')

      // delete in batches of 1000 (S3 limit)
      for (let i = 0; i < toDelete.length; i += 1000) {
        const batch = toDelete.slice(i, i + 1000)

        await s3Client.send(
          new DeleteObjectsCommand({
            Bucket: bucketName,
            Delete: {
              Objects: batch.map((key) => ({ Key: key })),
              Quiet: true,
            },
          })
        )

        console.info(
          `   Deleted batch ${Math.floor(i / 1000) + 1}/${Math.ceil(toDelete.length / 1000)}`
        )
      }

      console.info(`✅ Successfully deleted ${toDelete.length} old backup(s)`)
    }
  } else {
    console.info('✅ No backups need to be deleted')
  }

  // log retention details
  console.info('\n📅 Retention details:')
  const keptList = Array.from(toKeep).sort()
  const recentBackups = keptList.filter((key) => {
    const match = key.match(/(\d{4}-\d{2}-\d{2})/)
    if (match && match[1]) {
      const date = new Date(match[1])
      return date >= thirtyDaysAgo
    }
    return false
  })

  const oldBackups = keptList.filter((key) => {
    const match = key.match(/(\d{4}-\d{2}-\d{2})/)
    if (match && match[1]) {
      const date = new Date(match[1])
      return date < thirtyDaysAgo
    }
    return false
  })

  console.info(`   Daily backups (last 30 days): ${recentBackups.length}`)
  console.info(`   Monthly backups (older): ${oldBackups.length}`)

  return {
    kept: Array.from(toKeep),
    deleted: toDelete,
  }
}
