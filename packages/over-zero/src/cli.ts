#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { basename, resolve } from 'node:path'

import { ModelToValibot } from '@sinclair/typebox-codegen/model'
import { TypeScriptToModel } from '@sinclair/typebox-codegen/typescript'
import { defineCommand, runMain } from 'citty'
import * as ts from 'typescript'

/**
 * Write file only if the content has changed.
 * This prevents unnecessary rebuilds from file watchers.
 */
function writeFileIfChanged(filePath: string, content: string): boolean {
  try {
    if (existsSync(filePath)) {
      const existingContent = readFileSync(filePath, 'utf-8')
      if (existingContent === content) {
        return false // no change
      }
    }
  } catch {
    // if we can't read the file, proceed with writing
  }

  writeFileSync(filePath, content, 'utf-8')
  return true // file was written
}

const generateQueries = defineCommand({
  meta: {
    name: 'generate-queries',
    description: 'Generate server-side query validators from TypeScript query functions',
  },
  args: {
    dir: {
      type: 'positional',
      description: 'Directory containing query files',
      required: false,
      default: '.',
    },
  },
  async run({ args }) {
    const dir = resolve(args.dir)

    const { readdirSync } = await import('node:fs')

    const files = readdirSync(dir).filter((f) => f.endsWith('.ts'))

    const allQueries: Array<{ name: string; params: string; valibotCode: string }> = []

    // process files in parallel
    const results = await Promise.all(
      files.map(async (file) => {
        const filePath = resolve(dir, file)
        const queries: typeof allQueries = []

        try {
          const content = readFileSync(filePath, 'utf-8')

          const sourceFile = ts.createSourceFile(
            filePath,
            content,
            ts.ScriptTarget.Latest,
            true
          )

          ts.forEachChild(sourceFile, (node) => {
            if (ts.isVariableStatement(node)) {
              const exportModifier = node.modifiers?.find(
                (m) => m.kind === ts.SyntaxKind.ExportKeyword
              )
              if (!exportModifier) return

              const declaration = node.declarationList.declarations[0]
              if (!declaration || !ts.isVariableDeclaration(declaration)) return

              const name = declaration.name.getText(sourceFile)

              if (
                declaration.initializer &&
                ts.isArrowFunction(declaration.initializer)
              ) {
                const params = declaration.initializer.parameters
                let paramType = 'void'

                if (params.length > 0) {
                  const param = params[0]!
                  paramType = param.type?.getText(sourceFile) || 'unknown'
                }

                try {
                  const typeString = `type QueryParams = ${paramType}`
                  const model = TypeScriptToModel.Generate(typeString)
                  const valibotCode = ModelToValibot.Generate(model)

                  queries.push({ name, params: paramType, valibotCode })
                } catch (err) {
                  console.error(`✗ ${name}: ${err}`)
                }
              }
            }
          })
        } catch (err) {
          console.error(`Error processing ${file}:`, err)
        }

        return queries
      })
    )

    allQueries.push(...results.flat())
    console.info(`✓ ${allQueries.length} query validators`)
  },
})

const generate = defineCommand({
  meta: {
    name: 'generate',
    description: 'Generate models, types, tables, and query validators',
  },
  args: {
    dir: {
      type: 'positional',
      description: 'Base directory (defaults to src/data)',
      required: false,
      default: 'src/data',
    },
    watch: {
      type: 'boolean',
      description: 'Watch for changes and regenerate',
      required: false,
      default: false,
    },
    after: {
      type: 'string',
      description: 'Command to run after generation completes',
      required: false,
    },
  },
  async run({ args }) {
    const baseDir = resolve(args.dir)
    const modelsDir = resolve(baseDir, 'models')
    const generatedDir = resolve(baseDir, 'generated')
    const queriesDir = resolve(baseDir, 'queries')

    const runGenerate = async (options?: { silent?: boolean }) => {
      const silent = options?.silent ?? false
      // ensure generated dir exists
      if (!existsSync(generatedDir)) {
        mkdirSync(generatedDir, { recursive: true })
      }

      // read all model files and check for schemas in parallel
      const allModelFiles = readdirSync(modelsDir)
        .filter((f) => f.endsWith('.ts'))
        .sort()

      const schemaChecks = await Promise.all(
        allModelFiles.map(async (f) => ({
          file: f,
          hasSchema: readFileSync(resolve(modelsDir, f), 'utf-8').includes(
            'export const schema = table('
          ),
        }))
      )

      const filesWithSchema = schemaChecks.filter((c) => c.hasSchema).map((c) => c.file)

      // generate all files in parallel
      const [modelsOutput, typesOutput, tablesOutput, readmeOutput] = await Promise.all([
        Promise.resolve(generateModelsFile(allModelFiles)),
        Promise.resolve(generateTypesFile(filesWithSchema)),
        Promise.resolve(generateTablesFile(filesWithSchema)),
        Promise.resolve(generateReadmeFile()),
      ])

      // write all generated files in parallel
      const writeResults = await Promise.all([
        Promise.resolve(
          writeFileIfChanged(resolve(generatedDir, 'models.ts'), modelsOutput)
        ),
        Promise.resolve(
          writeFileIfChanged(resolve(generatedDir, 'types.ts'), typesOutput)
        ),
        Promise.resolve(
          writeFileIfChanged(resolve(generatedDir, 'tables.ts'), tablesOutput)
        ),
        Promise.resolve(
          writeFileIfChanged(resolve(generatedDir, 'README.md'), readmeOutput)
        ),
      ])

      const filesChanged = writeResults.filter(Boolean).length
      if (filesChanged > 0 && !silent) {
        console.info(`  📝 Updated ${filesChanged} file(s)`)
      }

      // generate synced queries
      if (existsSync(queriesDir)) {
        const queryFiles = readdirSync(queriesDir).filter((f) => f.endsWith('.ts'))

        // process query files in parallel
        const queryResults = await Promise.all(
          queryFiles.map(async (file) => {
            const filePath = resolve(queriesDir, file)
            const fileBaseName = basename(file, '.ts')
            const queries: Array<{
              name: string
              params: string
              valibotCode: string
              sourceFile: string
            }> = []

            try {
              const content = readFileSync(filePath, 'utf-8')

              const sourceFile = ts.createSourceFile(
                filePath,
                content,
                ts.ScriptTarget.Latest,
                true
              )

              ts.forEachChild(sourceFile, (node) => {
                if (ts.isVariableStatement(node)) {
                  const exportModifier = node.modifiers?.find(
                    (m) => m.kind === ts.SyntaxKind.ExportKeyword
                  )
                  if (!exportModifier) return

                  const declaration = node.declarationList.declarations[0]
                  if (!declaration || !ts.isVariableDeclaration(declaration)) return

                  const name = declaration.name.getText(sourceFile)

                  // skip 'permission' exports
                  if (name === 'permission') return

                  if (
                    declaration.initializer &&
                    ts.isArrowFunction(declaration.initializer)
                  ) {
                    const params = declaration.initializer.parameters
                    let paramType = 'void'

                    if (params.length > 0) {
                      const param = params[0]!
                      paramType = param.type?.getText(sourceFile) || 'unknown'
                    }

                    try {
                      const typeString = `type QueryParams = ${paramType}`
                      const model = TypeScriptToModel.Generate(typeString)
                      const valibotCode = ModelToValibot.Generate(model)

                      queries.push({
                        name,
                        params: paramType,
                        valibotCode,
                        sourceFile: fileBaseName,
                      })
                    } catch (err) {
                      console.error(`✗ ${name}: ${err}`)
                    }
                  }
                }
              })
            } catch (err) {
              console.error(`Error processing ${file}:`, err)
            }

            return queries
          })
        )

        const allQueries = queryResults.flat()
        const groupedQueriesOutput = generateGroupedQueriesFile(allQueries)
        const syncedQueriesOutput = generateSyncedQueriesFile(allQueries)

        const groupedChanged = writeFileIfChanged(
          resolve(generatedDir, 'groupedQueries.ts'),
          groupedQueriesOutput
        )
        const syncedChanged = writeFileIfChanged(
          resolve(generatedDir, 'syncedQueries.ts'),
          syncedQueriesOutput
        )

        const queryFilesChanged = (groupedChanged ? 1 : 0) + (syncedChanged ? 1 : 0)
        const totalFilesChanged = filesChanged + queryFilesChanged

        if (totalFilesChanged > 0 && !silent) {
          if (groupedChanged) {
            console.info(`  📝 Updated groupedQueries.ts`)
          }
          if (syncedChanged) {
            console.info(`  📝 Updated syncedQueries.ts`)
          }
          console.info(
            `✓ ${allModelFiles.length} models (${filesWithSchema.length} schemas), ${allQueries.length} queries`
          )
        }

        // run after command only if files changed and not silent
        if (totalFilesChanged > 0 && !silent && args.after) {
          try {
            const { execSync } = await import('node:child_process')
            execSync(args.after, { stdio: 'inherit' })
          } catch (err) {
            console.error(`Error running after command: ${err}`)
          }
        }
      } else {
        if (filesChanged > 0 && !silent) {
          console.info(
            `✓ ${allModelFiles.length} models (${filesWithSchema.length} schemas)`
          )
        }

        // run after command only if files changed and not silent
        if (filesChanged > 0 && !silent && args.after) {
          try {
            const { execSync } = await import('node:child_process')
            execSync(args.after, { stdio: 'inherit' })
          } catch (err) {
            console.error(`Error running after command: ${err}`)
          }
        }
      }
    }

    // run once (silent in watch mode for clean startup)
    await runGenerate({ silent: args.watch })

    // watch mode
    if (args.watch) {
      console.info('👀 watching...\n')
      const chokidar = await import('chokidar')

      let debounceTimer: ReturnType<typeof setTimeout> | null = null

      const debouncedRegenerate = (path: string, event: string) => {
        if (debounceTimer) {
          clearTimeout(debounceTimer)
        }

        console.info(`\n${event} ${path}`)

        debounceTimer = setTimeout(() => {
          runGenerate()
        }, 1000)
      }

      const watcher = chokidar.watch([modelsDir, queriesDir], {
        persistent: true,
        ignoreInitial: true,
      })

      watcher.on('change', (path) => debouncedRegenerate(path, '📝'))
      watcher.on('add', (path) => debouncedRegenerate(path, '➕'))
      watcher.on('unlink', (path) => debouncedRegenerate(path, '🗑️ '))

      // keep process alive
      await new Promise(() => {})
    }
  },
})

function generateModelsFile(modelFiles: string[]) {
  const modelNames = modelFiles.map((f) => basename(f, '.ts')).sort()

  // special case: user.ts should be imported as userPublic
  const getImportName = (name: string) => (name === 'user' ? 'userPublic' : name)

  // generate imports (sorted)
  const imports = modelNames
    .map((name) => {
      const importName = getImportName(name)
      return `import * as ${importName} from '../models/${name}'`
    })
    .join('\n')

  // generate models object (sorted by import name)
  const sortedByImportName = [...modelNames].sort((a, b) =>
    getImportName(a).localeCompare(getImportName(b))
  )
  const modelsObj = `export const models = {\n${sortedByImportName.map((name) => `  ${getImportName(name)},`).join('\n')}\n}`

  return `// auto-generated by: over-zero generate\n${imports}\n\n${modelsObj}\n`
}

function generateTypesFile(modelFiles: string[]) {
  const modelNames = modelFiles.map((f) => basename(f, '.ts')).sort()

  // special case: user.ts should reference userPublic in schema
  const getSchemaName = (name: string) => (name === 'user' ? 'userPublic' : name)

  // generate type exports using TableInsertRow and TableUpdateRow (sorted)
  const typeExports = modelNames
    .map((name) => {
      const pascalName = name.charAt(0).toUpperCase() + name.slice(1)
      const schemaName = getSchemaName(name)
      return `export type ${pascalName} = TableInsertRow<typeof schema.${schemaName}>\nexport type ${pascalName}Update = TableUpdateRow<typeof schema.${schemaName}>`
    })
    .join('\n\n')

  return `import type { TableInsertRow, TableUpdateRow } from 'over-zero'\nimport type * as schema from './tables'\n\n${typeExports}\n`
}

function generateTablesFile(modelFiles: string[]) {
  const modelNames = modelFiles.map((f) => basename(f, '.ts')).sort()

  // special case: user.ts should be exported as userPublic
  const getExportName = (name: string) => (name === 'user' ? 'userPublic' : name)

  // generate schema exports (sorted)
  const exports = modelNames
    .map((name) => `export { schema as ${getExportName(name)} } from '../models/${name}'`)
    .join('\n')

  return `// auto-generated by: over-zero generate\n// this is separate from models as otherwise you end up with circular types :/\n\n${exports}\n`
}

function generateGroupedQueriesFile(
  queries: Array<{
    name: string
    params: string
    valibotCode: string
    sourceFile: string
  }>
) {
  // get unique source files sorted
  const sortedFiles = [...new Set(queries.map((q) => q.sourceFile))].sort()

  // generate re-exports
  const exports = sortedFiles
    .map((file) => `export * as ${file} from '../queries/${file}'`)
    .join('\n')

  return `/**
 * auto-generated by: over-zero generate
 *
 * grouped query re-exports for minification-safe query identity.
 * this file re-exports all query modules - while this breaks tree-shaking,
 * queries are typically small and few in number even in larger apps.
 */
${exports}
`
}

function generateSyncedQueriesFile(
  queries: Array<{
    name: string
    params: string
    valibotCode: string
    sourceFile: string
  }>
) {
  // group queries by source file
  const queryByFile = new Map<string, typeof queries>()
  for (const q of queries) {
    if (!queryByFile.has(q.sourceFile)) {
      queryByFile.set(q.sourceFile, [])
    }
    queryByFile.get(q.sourceFile)!.push(q)
  }

  // sort file names for consistent output
  const sortedFiles = Array.from(queryByFile.keys()).sort()

  const imports = `// auto-generated by: over-zero generate
// server-side query definitions with validators
import { defineQuery, defineQueries } from '@rocicorp/zero'
import * as v from 'valibot'
import * as Queries from './groupedQueries'
`

  // generate grouped definitions by namespace
  const namespaceDefs = sortedFiles
    .map((file) => {
      const fileQueries = queryByFile
        .get(file)!
        .sort((a, b) => a.name.localeCompare(b.name))

      const queryDefs = fileQueries
        .map((q) => {
          // extract validator schema
          const lines = q.valibotCode.split('\n').filter((l) => l.trim())
          const schemaLineIndex = lines.findIndex((l) =>
            l.startsWith('export const QueryParams')
          )

          let validatorDef = ''
          if (schemaLineIndex !== -1) {
            const schemaLines: string[] = []
            let openBraces = 0
            let started = false

            for (let i = schemaLineIndex; i < lines.length; i++) {
              const line = lines[i]!
              const cleaned = started
                ? line
                : line.replace('export const QueryParams = ', '')
              schemaLines.push(cleaned)
              started = true

              openBraces += (cleaned.match(/\{/g) || []).length
              openBraces -= (cleaned.match(/\}/g) || []).length
              openBraces += (cleaned.match(/\(/g) || []).length
              openBraces -= (cleaned.match(/\)/g) || []).length

              if (openBraces === 0 && schemaLines.length > 0) {
                break
              }
            }
            validatorDef = schemaLines.join('\n')
          }

          // for void queries, use the no-validator overload
          if (q.params === 'void' || !validatorDef) {
            return `  ${q.name}: defineQuery(() => Queries.${file}.${q.name}()),`
          }

          // indent the validator for proper formatting
          const indentedValidator = validatorDef
            .split('\n')
            .map((line, i) => (i === 0 ? line : `    ${line}`))
            .join('\n')

          // defineQuery with validator and args
          return `  ${q.name}: defineQuery(
    ${indentedValidator},
    ({ args }) => Queries.${file}.${q.name}(args)
  ),`
        })
        .join('\n')

      return `const ${file} = {\n${queryDefs}\n}`
    })
    .join('\n\n')

  // build the defineQueries call with all namespaces
  const queriesObject = sortedFiles.map((file) => `  ${file},`).join('\n')

  return `${imports}
${namespaceDefs}

export const queries = defineQueries({
${queriesObject}
})
`
}

function generateReadmeFile() {
  return `# generated

this folder is auto-generated by over-zero. do not edit files here directly.

## what's generated

- \`models.ts\` - exports all models from ../models
- \`types.ts\` - typescript types derived from table schemas
- \`tables.ts\` - exports table schemas for type inference
- \`groupedQueries.ts\` - namespaced query re-exports for client setup
- \`syncedQueries.ts\` - namespaced syncedQuery wrappers for server setup

## usage guidelines

**do not import generated files outside of the data folder.**

### queries

write your queries as plain functions in \`../queries/\` and import them directly:

\`\`\`ts
// ✅ good - import from queries
import { channelMessages } from '~/data/queries/message'
\`\`\`

the generated query files are only used internally by zero client/server setup.

### types

you can import types from this folder, but prefer re-exporting from \`../types.ts\`:

\`\`\`ts
// ❌ okay but not preferred
import type { Message } from '~/data/generated/types'

// ✅ better - re-export from types.ts
import type { Message } from '~/data/types'
\`\`\`

## regeneration

files are regenerated when you run:

\`\`\`bash
bun over-zero generate
\`\`\`

or in watch mode:

\`\`\`bash
bun over-zero generate --watch
\`\`\`

## more info

see the [over-zero readme](./node_modules/over-zero/README.md) for full documentation.
`
}

const main = defineCommand({
  meta: {
    name: 'over-zero',
    description: 'Over-zero CLI tools',
  },
  subCommands: {
    generate: generate,
    'generate-queries': generateQueries,
  },
})

runMain(main)
