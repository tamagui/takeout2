import { readdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

export type MigrationAddOptions = {
  migrationsDir: string
  name?: string
}

const commonWords = ['sapphire', 'emerald', 'ruby', 'amber', 'topaz', 'onyx', 'pearl']

export function addMigration(options: MigrationAddOptions): string {
  const { migrationsDir, name } = options

  // if no name is provided, pick a random one from common words
  const migrationName =
    name || commonWords[Math.floor(Math.random() * commonWords.length)]!

  // read all files in the migrations directory
  const files = readdirSync(migrationsDir)

  // find the highest migration number from both .ts and .sql files
  const migrationRegex = /^(\d+)[-_].*\.(ts|sql)$/
  let maxNumber = 0
  for (const file of files) {
    const match = file.match(migrationRegex)
    if (match?.[1]) {
      const num = Number.parseInt(match[1], 10)
      if (!Number.isNaN(num) && num > maxNumber) {
        maxNumber = num
      }
    }
  }

  // calculate the next migration number and pad to 4 digits
  const nextNumber = (maxNumber + 1).toString().padStart(4, '0')
  const newFilename = `${nextNumber}-${migrationName}.ts`
  const newFilePath = join(migrationsDir, newFilename)

  // create a template for custom TypeScript migrations
  const templateContent = `import type { PoolClient } from 'pg'

export async function up(client: PoolClient) {
  // implementation for applying this migration
}
`

  // write the template to the new file
  writeFileSync(newFilePath, templateContent)

  console.info(`Created custom migration: ${newFilePath}`)
  console.info(`For Drizzle schema migrations, run 'drizzle-kit generate' instead`)

  return newFilePath
}
