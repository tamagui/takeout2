#!/usr/bin/env bun

/**
 * This script scans for SQL files in migrations directory,
 * creates corresponding TypeScript migration files,
 * and imports the SQL with ?raw
 */

import { existsSync } from 'node:fs'
import { readdir, writeFile, stat, rename } from 'node:fs/promises'
import { join, basename, extname } from 'node:path'

export type DrizzleSyncOptions = {
  migrationsDir: string
}

/**
 * Extracts the numeric prefix from a migration filename
 */
function getMigrationNumber(filename: string): number | null {
  const match = filename.match(/^(\d+)/)
  return match && match[1] ? Number.parseInt(match[1], 10) : null
}

/**
 * Finds the highest migration number in the directory
 */
async function getHighestMigrationNumber(dir: string): Promise<number> {
  const files = await readdir(dir)
  let highest = -1

  for (const file of files) {
    const num = getMigrationNumber(file)
    if (num !== null && num > highest) {
      highest = num
    }
  }

  return highest
}

/**
 * Renames newly generated drizzle migrations to use correct sequential numbering
 */
async function renameNewDrizzleMigrations(
  migrationsPath: string,
  sqlFiles: string[]
): Promise<string[]> {
  const drizzlePattern = /^(\d{4})_[a-z]+_[a-z_]+\.sql$/
  const files = await readdir(migrationsPath)

  // get the highest existing migration number
  const highestNumber = await getHighestMigrationNumber(migrationsPath)

  // find new drizzle SQL files (without corresponding .ts files yet)
  const newDrizzleSqlFiles = sqlFiles.filter((file) => {
    if (!drizzlePattern.test(file)) return false
    const tsFile = file.replace('.sql', '.ts')
    return !files.includes(tsFile)
  })

  if (newDrizzleSqlFiles.length === 0) return sqlFiles

  // group by migration number
  const migrationGroups = new Map<string, string[]>()
  for (const file of newDrizzleSqlFiles) {
    const num = file.substring(0, 4)
    if (!migrationGroups.has(num)) {
      migrationGroups.set(num, [])
    }
    migrationGroups.get(num)!.push(file)
  }

  let nextNumber = highestNumber + 1
  const renamedFiles: string[] = []

  // process each group of new migrations
  for (const [originalNum, groupFiles] of migrationGroups) {
    const drizzleNum = Number.parseInt(originalNum, 10)

    // if drizzle's number is less than or equal to our highest, we need to renumber
    if (drizzleNum <= highestNumber) {
      const newNumStr = nextNumber.toString().padStart(4, '0')

      console.info(`Renumbering new drizzle migration ${originalNum} to ${newNumStr}`)

      for (const file of groupFiles) {
        const newName = file.replace(/^\d{4}/, newNumStr)
        const oldPath = join(migrationsPath, file)
        const newPath = join(migrationsPath, newName)

        await rename(oldPath, newPath)
        console.info(`  Renamed ${file} -> ${newName}`)
        renamedFiles.push(newName)
      }

      // also rename the meta snapshot if it exists
      const metaDir = join(migrationsPath, 'meta')
      if (existsSync(metaDir)) {
        const metaFiles = await readdir(metaDir)
        const snapshotFile = `${originalNum}_snapshot.json`
        if (metaFiles.includes(snapshotFile)) {
          const newSnapshotName = `${newNumStr}_snapshot.json`
          await rename(join(metaDir, snapshotFile), join(metaDir, newSnapshotName))
          console.info(`  Renamed meta/${snapshotFile} -> meta/${newSnapshotName}`)
        }
      }

      nextNumber++
    } else {
      // keep files that don't need renaming
      renamedFiles.push(...groupFiles)
    }
  }

  // return updated list of SQL files (with renamed files + unchanged files)
  return sqlFiles.map((file) => {
    const idx = newDrizzleSqlFiles.indexOf(file)
    if (idx !== -1) {
      // find what this file was renamed to
      for (const renamed of renamedFiles) {
        if (renamed.includes(file.substring(5))) {
          // match by the descriptive part after the number
          return renamed
        }
      }
    }
    return file
  })
}

export async function syncDrizzleMigrations(options: DrizzleSyncOptions) {
  const { migrationsDir } = options

  // get all sql files in the migrations directory
  const files = await readdir(migrationsDir)
  let sqlFiles = files.filter((file) => extname(file) === '.sql')

  console.info(`Found ${sqlFiles.length} SQL files to convert to migrations.`)

  // rename any new drizzle migrations to continue from the highest number
  sqlFiles = await renameNewDrizzleMigrations(migrationsDir, sqlFiles)

  // for each sql file, create a typescript migration
  for (const sqlFile of sqlFiles) {
    const baseName = basename(sqlFile, '.sql')
    const tsFileName = `${baseName}.ts`
    const tsFilePath = join(migrationsDir, tsFileName)

    // skip if typescript file already exists
    if (existsSync(tsFilePath)) {
      const sqlStat = await stat(join(migrationsDir, sqlFile))
      const tsStat = await stat(tsFilePath)

      if (tsStat.mtimeMs > sqlStat.mtimeMs) {
        continue
      }

      console.info(`Updating ${tsFileName} as SQL file has been modified.`)
    } else {
      console.info(`Creating ${tsFileName}`)
    }

    // generate the migration content
    const migrationContent = `import type { PoolClient } from 'pg'
import sql from './${sqlFile}?raw'

export async function up(client: PoolClient) {
  await client.query(sql)
}
`

    // write the typescript file
    await writeFile(tsFilePath, migrationContent)
    console.info(`Successfully created ${tsFileName}`)
  }

  console.info('Migration sync completed.')
}
