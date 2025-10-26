import { join } from 'node:path'
import { readdirSync, writeFileSync } from 'node:fs'

const migrationsDir = join(process.cwd(), 'src/database/migrations')

const args = process.argv.slice(2)
let migrationName = args[0]

// If no name is provided, pick a random one from common words
const commonWords = ['sapphire', 'emerald', 'ruby', 'amber', 'topaz', 'onyx', 'pearl']
if (!migrationName) {
  migrationName = commonWords[Math.floor(Math.random() * commonWords.length)]
}

// Read all files in the migrations directory
const files = readdirSync(migrationsDir)

// Find the highest migration number from both .ts and .sql files
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

// Calculate the next migration number and pad to 4 digits
const nextNumber = (maxNumber + 1).toString().padStart(4, '0')
const newFilename = `${nextNumber}-${migrationName}.ts`
const newFilePath = join(migrationsDir, newFilename)

// Create a template for custom TypeScript migrations
const templateContent = `import type { PoolClient } from 'pg'

export async function up(client: PoolClient) {
  // Implementation for applying this migration
}
`

// Write the template to the new file
writeFileSync(newFilePath, templateContent)

console.info(`Created custom migration: ${newFilePath}`)
console.info(
  `For Drizzle schema migrations, simply run 'bun migrate' after changing schema`
)
