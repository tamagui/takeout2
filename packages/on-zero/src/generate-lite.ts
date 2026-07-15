// browser-safe entry point for the on-zero generator.
//
// unlike `./generate.ts`, this module:
//   - does not import `typescript`, `node:fs`, `node:path`, or any node builtin
//   - does not read or write files (returns a map of filename → content)
//   - is parser-agnostic: callers supply a `parse` function that extracts the
//     small amount of ast info on-zero needs (a "lite" ast). callers typically
//     back that parse function with acorn + acorn-typescript, oxc, swc, or any
//     other ts-aware parser they already bundle.
//   - falls back to `v.unknown()` for any parameter whose type annotation text
//     can't be parsed by on-zero's existing string-based `parseTypeString`
//     helper. there is no cross-file type resolution.
//
// this makes the generator runnable inside web workers and other browser
// contexts without pulling in ~10mb of typescript.

import {
  generateGroupedQueriesFile,
  generateModelsFile,
  generateReadmeFile,
  generateSyncedMutationsFile,
  generateSyncedQueriesFile,
  generateTablesFile,
  generateTypesFile,
  parseColumnType,
  parseTypeString,
} from './generate-helpers'
import type { ModelMutations, SchemaColumn } from './generate-helpers'

// public types

// minimal ast info about a single mutation handler file (e.g. `models/post.ts`)
export type LiteMutationExport = {
  // the first arg to `mutations('NAME', ...)` — string literal from the source.
  // not currently emitted anywhere in the output; the model file basename is
  // used for the top-level key in syncedMutations instead. kept for parity with
  // what callers naturally extract, and to leave room for future use.
  modelName: string
  // handlers = keys of the last object literal arg to `mutations(...)`
  handlers: Array<{
    // handler property name, e.g. 'toggleActive'
    name: string
    // text of the second parameter's type annotation, if present.
    // e.g. '{ id: string; isActive: boolean }' or 'ToggleArgs' or null.
    // for inline type literals parseable by `parseTypeString`, on-zero emits
    // real v.object(...) validators. for references/generics/null, it falls
    // back to `v.unknown()`.
    paramTypeText: string | null
  }>
  // for models that declare `export const schema = table(...).columns(...)`,
  // the caller extracts the table name + column builder text. null if the
  // model doesn't declare a schema inline (most templates use drizzle-zero,
  // so null is common).
  schema: LiteSchemaInfo | null
}

export type LiteSchemaInfo = {
  tableName: string
  primaryKeys: string[]
  // per-column: name + the column builder chain as source text, e.g.
  // `"string().optional()"`. `parseColumnType` turns these into SchemaColumn.
  columns: Array<{ name: string; builderText: string }>
}

export type LiteQueryExport = {
  // exported variable name, e.g. 'flightById'
  name: string
  // text of the first parameter's type annotation, if present.
  // e.g. 'string' | '{ id: string }' | null. null means the query takes no
  // args and is treated as a void query in the generated output.
  paramTypeText: string | null
}

// what the caller returns for each source file.
export type LiteParsedFile = {
  // a model file exports at most one `mutate = mutations(...)`, but an array
  // keeps the shape uniform and leaves room for future multi-export support.
  mutations: LiteMutationExport[]
  queries: LiteQueryExport[]
}

// the parser function signature the caller provides. pure: given source text
// and a path (for error messages), return the lite ast.
export type LiteParseFn = (sourceCode: string, filePath: string) => LiteParsedFile

export type LiteGenerateOptions = {
  // file path → source content. paths are treated as opaque keys; generate-lite
  // matches them by prefix against `{dir}/{modelsDir}/` and `{dir}/queries/`
  // using forward-slash string comparison. pass whatever path shape you have
  // (absolute, virtual, etc.), as long as you're consistent with `dir`.
  files: Record<string, string>
  // base data directory, e.g. '/proj/src/data'. generate-lite scans `files`
  // for keys matching `{dir}/{modelsDir}/*.ts` and `{dir}/queries/*.ts`.
  dir: string
  // 'mutations' if `{dir}/mutations` exists, else 'models'. if the caller
  // knows, they pass it; else generate-lite infers it from the file keys
  // (prefers 'mutations' if any file is under it).
  modelsDir?: 'mutations' | 'models'
  parse: LiteParseFn
}

export type LiteGenerateResult = {
  // relative paths under `{dir}/generated/`, e.g. 'models.ts',
  // 'syncedMutations.ts'. callers decide where to write.
  files: Record<string, string>
  modelCount: number
  queryCount: number
  mutationCount: number
  schemaCount: number
}

// path helpers — deliberately string-only, no node:path

function stripTrailingSlash(s: string): string {
  return s.endsWith('/') ? s.slice(0, -1) : s
}

// returns the last '/' segment, stripped of a trailing `.ts` if present.
// does not depend on node:path.basename.
function baseName(path: string, ext?: string): string {
  const idx = path.lastIndexOf('/')
  let base = idx >= 0 ? path.slice(idx + 1) : path
  if (ext && base.endsWith(ext)) base = base.slice(0, -ext.length)
  return base
}

// returns files whose path is an immediate child of `dirPrefix` and ends in
// `.ts` (but not `.d.ts`, test files, or anything nested further down).
function listDirectTsFiles(files: Record<string, string>, dirPrefix: string): string[] {
  const prefix = stripTrailingSlash(dirPrefix) + '/'
  const out: string[] = []
  for (const path of Object.keys(files)) {
    if (!path.startsWith(prefix)) continue
    const rest = path.slice(prefix.length)
    // must be a direct child (no further slashes)
    if (rest.includes('/')) continue
    if (!rest.endsWith('.ts')) continue
    if (rest.endsWith('.d.ts')) continue
    if (rest.endsWith('.test.ts') || rest.endsWith('.spec.ts')) continue
    out.push(path)
  }
  return out.sort()
}

// main entry point

export function generateLite(opts: LiteGenerateOptions): LiteGenerateResult {
  const { files, parse } = opts
  const baseDir = stripTrailingSlash(opts.dir)

  // determine models dir (mutations vs models)
  let modelsDirName: 'mutations' | 'models'
  if (opts.modelsDir) {
    modelsDirName = opts.modelsDir
  } else {
    // infer: prefer 'mutations' if any file lives under {dir}/mutations/
    const mutationsPrefix = `${baseDir}/mutations/`
    const hasMutationsDir = Object.keys(files).some((p) => p.startsWith(mutationsPrefix))
    modelsDirName = hasMutationsDir ? 'mutations' : 'models'
  }

  const modelsDirPath = `${baseDir}/${modelsDirName}`
  const queriesDirPath = `${baseDir}/queries`

  const modelFilePaths = listDirectTsFiles(files, modelsDirPath)
  const queryFilePaths = listDirectTsFiles(files, queriesDirPath)

  // parse each model file and build ModelMutations records for the emitter
  const allModelMutations: ModelMutations[] = []
  const modelNamesWithSchema: string[] = []

  for (const filePath of modelFilePaths) {
    const modelName = baseName(filePath, '.ts')
    const content = files[filePath]!
    const parsed = parse(content, filePath)

    // a model file has at most one mutate export, but the lite ast is an array
    const mutationExport = parsed.mutations[0] ?? null

    // extract schema info if present
    const columns: Record<string, SchemaColumn> = {}
    const primaryKeys: string[] = []
    let hasSchema = false

    if (mutationExport?.schema) {
      hasSchema = true
      modelNamesWithSchema.push(modelName)
      for (const pk of mutationExport.schema.primaryKeys) primaryKeys.push(pk)
      for (const col of mutationExport.schema.columns) {
        columns[col.name] = parseColumnType(col.builderText)
      }
    }

    // a model participates in crud only when it has a schema AND its mutate
    // call is `mutations(schema, perm)` / `mutations(schema, perm, { ... })`.
    // in the lite ast, we don't know the call arity directly, so we use the
    // presence of a schema as the signal. this matches the real generator's
    // behavior for schemas-with-mutate: hasCRUD is true whenever both exist.
    //
    // models without `export const mutate` still appear in the output as
    // empty entries — see the test "treats models without export const mutate
    // as empty mutations".
    const hasCRUD = hasSchema && mutationExport !== null

    const custom = (mutationExport?.handlers ?? []).map((h) => {
      // null or empty annotation → void (no second param) → v.void_()
      if (h.paramTypeText == null) {
        return { name: h.name, paramType: 'void', valibotCode: '' }
      }

      const paramType = h.paramTypeText.trim()

      // unknown explicitly → permissive validator
      if (paramType === 'unknown') {
        return { name: h.name, paramType: 'unknown', valibotCode: '' }
      }

      // try the pure string parser. if it fails, fall back to v.unknown()
      // (no cross-file type resolution in lite mode).
      let valibotCode: string | null = null
      try {
        valibotCode = parseTypeString(paramType)
      } catch {
        valibotCode = null
      }

      return {
        name: h.name,
        paramType,
        valibotCode: valibotCode ?? 'v.unknown()',
      }
    })

    allModelMutations.push({
      modelName,
      hasCRUD,
      columns,
      primaryKeys,
      custom,
    })
  }

  // parse each query file
  const allQueries: Array<{
    name: string
    params: string
    valibotCode: string
    sourceFile: string
  }> = []

  for (const filePath of queryFilePaths) {
    const fileBaseName = baseName(filePath, '.ts')
    const content = files[filePath]!
    const parsed = parse(content, filePath)

    for (const q of parsed.queries) {
      // permission exports are filtered upstream in existing behavior
      if (q.name === 'permission') continue

      // null annotation → no first arg → void query
      if (q.paramTypeText == null) {
        allQueries.push({
          name: q.name,
          params: 'void',
          valibotCode: '',
          sourceFile: fileBaseName,
        })
        continue
      }

      const paramType = q.paramTypeText.trim()

      // try to parse the annotation. if we can't, fall back to v.unknown()
      // so the query still makes it into the output (consistent with
      // mutations). the existing node generator silently drops queries
      // whose types can't be resolved; in lite mode we emit them with a
      // permissive validator rather than losing them.
      let valibotCode: string | null = null
      try {
        valibotCode = parseTypeString(paramType)
      } catch {
        valibotCode = null
      }

      allQueries.push({
        name: q.name,
        params: paramType,
        valibotCode: valibotCode ?? 'v.unknown()',
        sourceFile: fileBaseName,
      })
    }
  }

  // emit files
  const modelNames = modelFilePaths.map((p) => baseName(p, '.ts'))
  const out: Record<string, string> = {}

  out['models.ts'] = generateModelsFile(modelNames, modelsDirName)

  if (modelNamesWithSchema.length > 0) {
    out['types.ts'] = generateTypesFile(modelNamesWithSchema)
    out['tables.ts'] = generateTablesFile(modelNamesWithSchema, modelsDirName)
  }

  out['README.md'] = generateReadmeFile()

  if (queryFilePaths.length > 0) {
    out['groupedQueries.ts'] = generateGroupedQueriesFile(allQueries)
    out['syncedQueries.ts'] = generateSyncedQueriesFile(allQueries)
  }

  if (allModelMutations.length > 0) {
    out['syncedMutations.ts'] = generateSyncedMutationsFile(allModelMutations)
  }

  // count mutations the same way `generate()` does: 3 per crud model plus
  // non-crud custom mutations (the crud-ops set is excluded when hasCRUD).
  let mutationCount = 0
  for (const m of allModelMutations) {
    if (m.hasCRUD) mutationCount += 3
    mutationCount += m.custom.filter(
      (mut) => !m.hasCRUD || !['insert', 'update', 'delete', 'upsert'].includes(mut.name),
    ).length
  }

  return {
    files: out,
    modelCount: modelNames.length,
    queryCount: allQueries.length,
    mutationCount,
    schemaCount: modelNamesWithSchema.length,
  }
}
