import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { basename, dirname, resolve } from 'node:path'
import {
  formatObjectKey,
  generateGroupedQueriesFile,
  generateModelsFile,
  generateReadmeFile,
  generateSyncedMutationsFile,
  generateSyncedQueriesFile,
  generateTablesFile,
  generateTypesFile,
  parseColumnType,
  parseTypeString,
  shouldSkipObjectKey,
} from './generate-helpers'
import type { ExtractedMutation, ModelMutations, SchemaColumn } from './generate-helpers'

const hash = (s: string) => createHash('sha256').update(s).digest('hex')
const GENERATOR_CACHE_VERSION = '1'

const isGeneratorSourceFile = (name: string) =>
  name.endsWith('.ts') &&
  !name.endsWith('.d.ts') &&
  !name.endsWith('.test.ts') &&
  !name.endsWith('.spec.ts')

// hash every .ts input the generator reads (all of baseDir except the generated
// output dir + node_modules) so a dev-boot regen can be skipped when nothing
// changed. the expensive part of generate() — loading the typescript compiler
// and building a TS program per query/model for type resolution — runs every
// boot otherwise, even when the output is already current (the configureServer
// watcher re-runs it on real edits, so the boot-time pass is pure redundancy).
function hashInputTree(baseDir: string, generatedDir: string): string {
  const parts: string[] = []
  const walk = (dir: string) => {
    if (!existsSync(dir)) return
    const entries = readdirSync(dir, { withFileTypes: true }).sort((a, b) =>
      a.name < b.name ? -1 : 1,
    )
    for (const entry of entries) {
      const full = resolve(dir, entry.name)
      if (entry.isDirectory()) {
        if (entry.name === 'node_modules' || full === generatedDir) continue
        walk(full)
      } else if (entry.isFile() && isGeneratorSourceFile(entry.name)) {
        parts.push(`${full}\0${readFileSync(full, 'utf-8')}`)
      }
    }
  }
  walk(baseDir)
  return hash(parts.join('\0'))
}

let generateCache: Record<string, string> = {}
let generateCachePath = ''

function getCacheDir() {
  let dir = process.cwd()
  while (dir !== '/') {
    const nm = resolve(dir, 'node_modules')
    if (existsSync(nm)) {
      const cacheDir = resolve(nm, '.on-zero')
      if (!existsSync(cacheDir)) {
        mkdirSync(cacheDir, { recursive: true })
      }
      return cacheDir
    }
    dir = resolve(dir, '..')
  }
  return null
}

function loadCache() {
  const cacheDir = getCacheDir()
  if (!cacheDir) return
  generateCachePath = resolve(cacheDir, 'generate-cache.json')
  try {
    generateCache = JSON.parse(readFileSync(generateCachePath, 'utf-8'))
  } catch {
    generateCache = {}
  }
}

function saveCache() {
  if (generateCachePath) {
    writeFileSync(generateCachePath, JSON.stringify(generateCache) + '\n', 'utf-8')
  }
}

function writeFileIfChanged(filePath: string, content: string): boolean {
  const contentHash = hash(content)
  const cachedHash = generateCache[filePath]

  if (cachedHash === contentHash && existsSync(filePath)) {
    return false
  }

  writeFileSync(filePath, content, 'utf-8')
  generateCache[filePath] = contentHash
  return true
}

// file-content emitters and valibot helpers are imported from ./generate-helpers
// so they can be shared with the browser-safe generate-lite entry point.

// creates a TypeChecker that can resolve type references across files
function createTypeResolver(
  ts: typeof import('typescript'),
  files: Array<{ path: string; content: string }>,
  dir: string,
) {
  // find tsconfig if it exists for path alias resolution
  const configPath = ts.findConfigFile(dir, ts.sys.fileExists, 'tsconfig.json')
  let compilerOptions: import('typescript').CompilerOptions = {
    target: ts.ScriptTarget.Latest,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    strict: false,
    skipLibCheck: true,
    noEmit: true,
  }

  if (configPath) {
    const configFile = ts.readConfigFile(configPath, ts.sys.readFile)
    if (configFile.config) {
      // use tsconfig's directory as base for path resolution (not the models dir)
      const parsed = ts.parseJsonConfigFileContent(
        configFile.config,
        ts.sys,
        dirname(configPath),
      )
      compilerOptions = { ...compilerOptions, ...parsed.options }
    }
  }

  // create a virtual file system host backed by real files + our content map
  const fileMap = new Map<string, string>()
  for (const f of files) {
    fileMap.set(f.path, f.content)
  }

  const host = ts.createCompilerHost(compilerOptions)
  const originalGetSourceFile = host.getSourceFile.bind(host)
  host.getSourceFile = (fileName, languageVersion, onError) => {
    const content = fileMap.get(fileName)
    if (content !== undefined) {
      return ts.createSourceFile(fileName, content, languageVersion, true)
    }
    return originalGetSourceFile(fileName, languageVersion, onError)
  }
  host.fileExists = (fileName) => fileMap.has(fileName) || ts.sys.fileExists(fileName)
  host.readFile = (fileName) => fileMap.get(fileName) ?? ts.sys.readFile(fileName)

  const program = ts.createProgram(
    files.map((f) => f.path),
    compilerOptions,
    host,
  )
  const checker = program.getTypeChecker()

  return {
    program,
    checker,
    // resolve a type annotation node to a ts.Type
    resolveType(node: import('typescript').TypeNode): import('typescript').Type | null {
      try {
        return checker.getTypeFromTypeNode(node)
      } catch {
        return null
      }
    },
    // convert a resolved type to valibot code
    typeToValibot(type: import('typescript').Type): string {
      return tsTypeToValibot(ts, checker, type)
    },
  }
}

// find a specific exported arrow function's Nth parameter type in a checker-owned source file
function resolveParamType(
  ts: typeof import('typescript'),
  resolver: ReturnType<typeof createTypeResolver>,
  sourceFile: import('typescript').SourceFile,
  exportName: string,
  paramIndex: number,
): import('typescript').Type | null {
  let result: import('typescript').Type | null = null

  ts.forEachChild(sourceFile, (node) => {
    if (result) return
    if (!ts.isVariableStatement(node)) return
    if (!node.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)) return

    const decl = node.declarationList.declarations[0]
    if (!decl || !ts.isVariableDeclaration(decl)) return
    if (decl.name.getText(sourceFile) !== exportName) return

    if (decl.initializer && ts.isArrowFunction(decl.initializer)) {
      const param = decl.initializer.parameters[paramIndex]
      if (param?.type) {
        result = resolver.resolveType(param.type)
      }
    }
  })

  return result
}

// find mutation handler param types in a resolver-owned source file
// walks `export const mutate = mutations(..., { handlerName: async (ctx, param: Type) => ... })`
function resolveMutationParamTypes(
  ts: typeof import('typescript'),
  resolver: ReturnType<typeof createTypeResolver>,
  sourceFile: import('typescript').SourceFile,
): Map<string, import('typescript').Type> {
  const resolved = new Map<string, import('typescript').Type>()

  ts.forEachChild(sourceFile, (node) => {
    if (!ts.isVariableStatement(node)) return
    if (!node.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)) return

    const decl = node.declarationList.declarations[0]
    if (!decl || !ts.isVariableDeclaration(decl)) return
    if (decl.name.getText(sourceFile) !== 'mutate') return

    if (!decl.initializer || !ts.isCallExpression(decl.initializer)) return
    const args = decl.initializer.arguments

    // find the handlers object (last arg that is an object literal)
    let handlersArg: import('typescript').ObjectLiteralExpression | null = null
    for (let i = args.length - 1; i >= 0; i--) {
      if (ts.isObjectLiteralExpression(args[i]!)) {
        handlersArg = args[i] as import('typescript').ObjectLiteralExpression
        break
      }
    }
    if (!handlersArg) return

    for (const prop of handlersArg.properties) {
      if (!ts.isPropertyAssignment(prop) && !ts.isMethodDeclaration(prop)) continue
      const name = prop.name?.getText(sourceFile)
      if (!name) continue

      let params:
        | import('typescript').NodeArray<import('typescript').ParameterDeclaration>
        | null = null
      if (ts.isPropertyAssignment(prop)) {
        const init = prop.initializer
        if (ts.isArrowFunction(init) || ts.isFunctionExpression(init)) {
          params = init.parameters
        }
      } else if (ts.isMethodDeclaration(prop)) {
        params = prop.parameters
      }

      if (!params || params.length < 2) continue
      const typeNode = params[1]!.type
      if (!typeNode) continue

      const expanded = resolver.resolveType(typeNode)
      if (expanded) {
        resolved.set(name, expanded)
      }
    }
  })

  return resolved
}

function extractMutationsFromModel(
  ts: typeof import('typescript'),
  sourceFile: ReturnType<typeof ts.createSourceFile>,
  content: string,
  fileName: string,
  silent: boolean,
  typeToValibot: (typeString: string) => string | null,
  resolvedTypes?: Map<string, import('typescript').Type>,
  resolvedTypeToValibot?: (type: import('typescript').Type) => string,
): ModelMutations | null {
  let mutateNode: import('typescript').CallExpression | null = null

  // find `export const mutate = mutations(...)`
  ts.forEachChild(sourceFile, (node) => {
    if (!ts.isVariableStatement(node)) return
    if (!node.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)) return
    const decl = node.declarationList.declarations[0]
    if (!decl || !ts.isVariableDeclaration(decl)) return
    if (decl.name.getText(sourceFile) !== 'mutate') return
    if (decl.initializer && ts.isCallExpression(decl.initializer)) {
      mutateNode = decl.initializer
    }
  })

  if (!mutateNode) {
    return {
      modelName: basename(fileName, '.ts'),
      hasCRUD: false,
      columns: {},
      primaryKeys: [],
      custom: [],
    }
  }

  const call = mutateNode as import('typescript').CallExpression
  const args = call.arguments

  // determine overload
  // 1-arg: mutations({ ... })
  // schema model: mutations(schema, perm) / mutations(schema, perm, { ... })
  // named model: mutations('name', handlers) / mutations('name', perm, { ... })
  const firstArg = args[0]
  const hasNamedModel = Boolean(firstArg && ts.isStringLiteralLike(firstArg))
  const hasCRUD = args.length >= 2 && !hasNamedModel
  let handlersArg: import('typescript').ObjectLiteralExpression | null = null

  if (args.length === 1 && ts.isObjectLiteralExpression(args[0]!)) {
    handlersArg = args[0] as import('typescript').ObjectLiteralExpression
  } else if (hasNamedModel) {
    if (args.length >= 3 && ts.isObjectLiteralExpression(args[2]!)) {
      handlersArg = args[2] as import('typescript').ObjectLiteralExpression
    } else if (args.length >= 2 && ts.isObjectLiteralExpression(args[1]!)) {
      handlersArg = args[1] as import('typescript').ObjectLiteralExpression
    }
  } else if (args.length === 3 && ts.isObjectLiteralExpression(args[2]!)) {
    handlersArg = args[2] as import('typescript').ObjectLiteralExpression
  }

  // extract schema columns for CRUD generation
  const columns: Record<string, SchemaColumn> = {}
  const primaryKeys: string[] = []

  if (hasCRUD) {
    // parse schema columns from file content
    extractSchemaColumns(ts, sourceFile, columns, primaryKeys)
  }

  // extract custom mutation param types
  const custom: ExtractedMutation[] = []

  if (handlersArg) {
    for (const prop of handlersArg.properties) {
      if (!ts.isPropertyAssignment(prop) && !ts.isMethodDeclaration(prop)) continue

      const name = prop.name?.getText(sourceFile)
      if (!name) continue

      // find the arrow function or method
      let params:
        | import('typescript').NodeArray<import('typescript').ParameterDeclaration>
        | null = null

      if (ts.isPropertyAssignment(prop)) {
        const init = prop.initializer
        if (ts.isArrowFunction(init) || ts.isFunctionExpression(init)) {
          params = init.parameters
        }
      } else if (ts.isMethodDeclaration(prop)) {
        params = prop.parameters
      }

      if (!params) continue

      // second param is the mutation data (first is ctx)
      if (params.length < 2) {
        custom.push({ name, paramType: 'void', valibotCode: '' })
        continue
      }

      const secondParam = params[1]!
      const paramType = secondParam.type?.getText(sourceFile) || 'unknown'

      if (paramType === 'unknown') {
        custom.push({ name, paramType: 'unknown', valibotCode: '' })
        continue
      }

      let valibotCode = typeToValibot(paramType)

      // if direct parse failed (unresolved reference), use checker-resolved types
      if (!valibotCode && resolvedTypes && resolvedTypeToValibot) {
        const resolvedType = resolvedTypes.get(name)
        if (resolvedType) {
          valibotCode = resolvedTypeToValibot(resolvedType)
        }
      }

      custom.push({
        name,
        paramType,
        valibotCode: valibotCode || '',
      })
    }
  }

  return {
    modelName: '',
    hasCRUD,
    columns,
    primaryKeys,
    custom,
  }
}

function extractSchemaColumns(
  ts: typeof import('typescript'),
  sourceFile: ReturnType<typeof ts.createSourceFile>,
  columns: Record<string, SchemaColumn>,
  primaryKeys: string[],
) {
  // walk AST to find table(...).columns({...}).primaryKey(...)
  function visit(node: import('typescript').Node) {
    if (ts.isCallExpression(node)) {
      const text = node.expression.getText(sourceFile)

      // look for .primaryKey('id') or .primaryKey('id', 'otherId')
      if (text.endsWith('.primaryKey')) {
        for (const arg of node.arguments) {
          if (ts.isStringLiteral(arg)) {
            primaryKeys.push(arg.text)
          }
        }
      }

      // look for .columns({...})
      if (text.endsWith('.columns') && node.arguments.length === 1) {
        const obj = node.arguments[0]!
        if (ts.isObjectLiteralExpression(obj)) {
          for (const prop of obj.properties) {
            if (!ts.isPropertyAssignment(prop)) continue
            const colName = prop.name?.getText(sourceFile)
            if (!colName) continue

            const initText = prop.initializer.getText(sourceFile)
            const colType = parseColumnType(initText)
            columns[colName] = colType
          }
        }
      }
    }
    ts.forEachChild(node, visit)
  }
  visit(sourceFile)
}

function getInstantiatedPropertyType(
  checker: import('typescript').TypeChecker,
  parent: import('typescript').Type,
  name: string,
) {
  const resolveProperty: unknown = Reflect.get(checker, 'getTypeOfPropertyOfType')
  if (typeof resolveProperty !== 'function') return undefined
  // typescript exposes this runtime method but omits it from TypeChecker.
  return Reflect.apply(resolveProperty, checker, [parent, name]) as
    | import('typescript').Type
    | undefined
}

// convert a ts.Type to valibot code by walking the type checker AST
function tsTypeToValibot(
  ts: typeof import('typescript'),
  checker: import('typescript').TypeChecker,
  type: import('typescript').Type,
  seen?: Set<import('typescript').Type>,
): string {
  // prevent infinite recursion on circular types
  // only track structured types (objects, intersections) — not primitives/unions
  if (!seen) seen = new Set()
  const flags = type.getFlags()
  if (flags & (ts.TypeFlags.Object | ts.TypeFlags.Intersection)) {
    if (seen.has(type)) return 'v.unknown()'
    seen.add(type)
  }

  const recurse = (t: import('typescript').Type) => tsTypeToValibot(ts, checker, t, seen)

  // primitives
  if (flags & ts.TypeFlags.String) return 'v.string()'
  if (flags & ts.TypeFlags.Number) return 'v.number()'
  if (flags & ts.TypeFlags.Boolean) return 'v.boolean()'
  if (flags & ts.TypeFlags.Void || flags & ts.TypeFlags.Undefined) return 'v.void_()'
  if (flags & ts.TypeFlags.Null) return 'v.null_()'
  if (flags & ts.TypeFlags.Any || flags & ts.TypeFlags.Unknown) return 'v.unknown()'
  if (flags & ts.TypeFlags.Never) return 'v.never()'
  if (flags & ts.TypeFlags.TemplateLiteral) return 'v.string()'
  if (
    flags & ts.TypeFlags.Object &&
    (checker.isArrayType?.(type) || checker.isArrayLikeType?.(type))
  ) {
    const typeArgs =
      checker.getTypeArguments?.(type as import('typescript').TypeReference) ?? []
    const elementType = typeArgs.length === 1 ? typeArgs[0] : type.getNumberIndexType?.()
    return `v.array(${elementType ? recurse(elementType) : 'v.unknown()'})`
  }

  // string/number/boolean literals
  if (flags & ts.TypeFlags.StringLiteral) {
    return `v.literal(${JSON.stringify((type as import('typescript').StringLiteralType).value)})`
  }
  if (flags & ts.TypeFlags.NumberLiteral) {
    return `v.literal(${(type as import('typescript').NumberLiteralType).value})`
  }
  if (flags & ts.TypeFlags.BooleanLiteral) {
    const name = (type as any).intrinsicName
    return `v.literal(${name === 'true'})`
  }

  // union
  if (type.isUnion()) {
    const members = type.types
    const hasNull = members.some((t) => t.getFlags() & ts.TypeFlags.Null)
    const hasUndefined = members.some(
      (t) => t.getFlags() & (ts.TypeFlags.Undefined | ts.TypeFlags.Void),
    )
    const rest = members.filter(
      (t) =>
        !(
          t.getFlags() &
          (ts.TypeFlags.Null | ts.TypeFlags.Undefined | ts.TypeFlags.Void)
        ),
    )
    if (
      rest.length === 2 &&
      rest.every((t) => t.getFlags() & ts.TypeFlags.BooleanLiteral)
    ) {
      let inner = 'v.boolean()'
      if (hasNull) inner = `v.nullable(${inner})`
      if (hasUndefined) inner = `v.optional(${inner})`
      return inner
    }

    if (rest.length === 0) return 'v.unknown()'

    let inner =
      rest.length === 1
        ? recurse(rest[0]!)
        : `v.union([${rest.map((t) => recurse(t)).join(', ')}])`

    if (hasNull) inner = `v.nullable(${inner})`
    if (hasUndefined) inner = `v.optional(${inner})`
    return inner
  }

  // resolve symbol property type with fallbacks
  const resolveSymbolType = (
    parent: import('typescript').Type,
    prop: import('typescript').Symbol,
  ) => {
    // mapped and conditional types can expose transient symbols with no
    // declaration, so resolve each property against its concrete parent.
    const instantiated = getInstantiatedPropertyType(checker, parent, prop.getName())
    if (instantiated) return instantiated
    if (prop.valueDeclaration)
      return checker.getTypeOfSymbolAtLocation(prop, prop.valueDeclaration)
    if ((prop as any).declarations?.[0])
      return checker.getTypeOfSymbolAtLocation(prop, (prop as any).declarations[0])
    return checker.getDeclaredTypeOfSymbol(prop)
  }

  // intersection - use checker's merged properties directly
  if (type.isIntersection()) {
    const props = type.getProperties()
    if (props.length === 0) return 'v.object({})'
    const entries: string[] = []
    for (const prop of props) {
      const name = prop.getName()
      if (shouldSkipObjectKey(name)) continue
      const propType = resolveSymbolType(type, prop)
      const isOptional = !!(prop.getFlags() & ts.SymbolFlags.Optional)
      let val = recurse(propType)
      if (isOptional && !val.startsWith('v.optional(')) {
        val = `v.optional(${val})`
      }
      entries.push(`${formatObjectKey(name)}: ${val}`)
    }
    if (entries.length === 0) return 'v.object({})'
    return `v.object({\n    ${entries.join(',\n    ')},\n  })`
  }

  // object type with properties
  const props = type.getProperties()
  if (
    props.length > 0 &&
    (type.getFlags() & ts.TypeFlags.Object || (type as any).objectFlags)
  ) {
    const objectFlags = (type as import('typescript').ObjectType).objectFlags ?? 0

    // array
    if (objectFlags & ts.ObjectFlags.Reference) {
      const typeRef = type as import('typescript').TypeReference
      const symbol = type.getSymbol()
      const name = symbol?.getName()
      if (
        (name === 'Array' || name === 'ReadonlyArray') &&
        typeRef.typeArguments?.length === 1
      ) {
        return `v.array(${recurse(typeRef.typeArguments[0]!)})`
      }
    }

    // tuple
    if (objectFlags & ts.ObjectFlags.Tuple) {
      const typeRef = type as import('typescript').TypeReference
      const typeArgs = typeRef.typeArguments || []
      return `v.tuple([${typeArgs.map((t) => recurse(t)).join(', ')}])`
    }

    // regular object
    const entries: string[] = []
    for (const prop of props) {
      const name = prop.getName()
      if (shouldSkipObjectKey(name)) continue
      const propType = resolveSymbolType(type, prop)
      const isOptional = !!(prop.getFlags() & ts.SymbolFlags.Optional)
      let val = recurse(propType)
      if (isOptional && !val.startsWith('v.optional(')) {
        val = `v.optional(${val})`
      }
      entries.push(`${formatObjectKey(name)}: ${val}`)
    }
    if (entries.length === 0) return 'v.object({})'
    return `v.object({\n    ${entries.join(',\n    ')},\n  })`
  }

  // index signature / Record type
  const stringIndex = type.getStringIndexType()
  if (stringIndex) {
    return `v.record(v.string(), ${recurse(stringIndex)})`
  }
  const numberIndex = type.getNumberIndexType()
  if (numberIndex) {
    return `v.record(v.number(), ${recurse(numberIndex)})`
  }

  return 'v.unknown()'
}

type SchemaTable = {
  name: string
  serverName?: string
  columns: Record<string, SchemaColumn>
  primaryKey: readonly string[]
}

type SchemaRelationHop = {
  sourceField: string[]
  destField: string[]
  destSchema: string
  cardinality: 'one' | 'many'
}

type DrizzleZeroSchema = {
  tables: Record<string, SchemaTable>
  relationships: Record<string, Record<string, SchemaRelationHop[]>>
}

function serializeColumn(col: SchemaColumn): string {
  const parts: string[] = []
  parts.push(`type: '${col.type}'`)
  parts.push(`optional: ${col.optional}`)
  parts.push(
    `customType: null as unknown as ${col.type === 'json' ? 'ReadonlyJSONValue' : col.type}`,
  )
  if (col.serverName) {
    parts.push(`serverName: '${col.serverName}'`)
  }
  return `{ ${parts.join(', ')} }`
}

function serializeColumnBuilder(col: SchemaColumn): string {
  const zeroType =
    col.type === 'string'
      ? 'string'
      : col.type === 'number'
        ? 'number'
        : col.type === 'boolean'
          ? 'boolean'
          : 'json'
  let expr = `${zeroType}()`
  if (col.serverName) {
    expr += `.from('${col.serverName}')`
  }
  if (col.optional) {
    expr += '.optional()'
  }
  return expr
}

/**
 * generate a typed schema.ts from drizzle-zero output.
 * produces a file using table()/createSchema()/relationships() from @rocicorp/zero
 * so the full type system works (no `relationships: any`).
 *
 */
export function generateDrizzleSchemaFile(schema: DrizzleZeroSchema): string {
  const lines: string[] = [
    `// auto-generated by: on-zero generate (from drizzle schema)`,
    `import { boolean, createSchema, json, number, relationships, string, table } from '@rocicorp/zero'`,
    ``,
  ]

  const tableNames = Object.keys(schema.tables).sort()

  // emit table consts using Zero's builder API
  for (const tableName of tableNames) {
    const t = schema.tables[tableName]!
    const colEntries = Object.entries(t.columns)
      .map(([colName, col]) => `    ${colName}: ${serializeColumnBuilder(col)},`)
      .join('\n')
    const pkArgs = t.primaryKey.map((k) => `'${k}'`).join(', ')

    const tableSource = t.serverName
      ? `table(${JSON.stringify(t.name)}).from(${JSON.stringify(t.serverName)})`
      : `table(${JSON.stringify(t.name)})`
    lines.push(`const ${tableName}Table = ${tableSource}`)
    lines.push(`  .columns({`)
    lines.push(colEntries)
    lines.push(`  })`)
    lines.push(`  .primaryKey(${pkArgs})`)
    lines.push(``)
  }

  // emit relationship consts
  const relTableNames = Object.keys(schema.relationships).sort()
  for (const tableName of relTableNames) {
    const rels = schema.relationships[tableName]!
    const relEntries = Object.entries(rels)
    if (relEntries.length === 0) continue

    const relBody = relEntries
      .map(([relName, hops]) => {
        // each relationship is an array of hops (usually 1, 2 for many-to-many)
        if (hops.length === 1) {
          const hop = hops[0]!
          const fn = hop.cardinality === 'one' ? 'one' : 'many'
          const sf = hop.sourceField.map((f) => `'${f}'`).join(', ')
          const df = hop.destField.map((f) => `'${f}'`).join(', ')
          return `    ${relName}: ${fn}({\n      sourceField: [${sf}],\n      destSchema: ${hop.destSchema}Table,\n      destField: [${df}],\n    })`
        }
        // many-to-many (2 hops)
        if (hops.length !== 2) {
          throw new Error(
            `Relationship ${tableName}.${relName} must have one or two hops`,
          )
        }
        const cardinality = hops[0]!.cardinality
        if (hops.some((hop) => hop.cardinality !== cardinality)) {
          throw new Error(`Relationship ${tableName}.${relName} must use one cardinality`)
        }
        const fn = cardinality === 'one' ? 'one' : 'many'
        const hopCode = hops
          .map((hop) => {
            const sf = hop.sourceField.map((f) => `'${f}'`).join(', ')
            const df = hop.destField.map((f) => `'${f}'`).join(', ')
            return `{ sourceField: [${sf}], destSchema: ${hop.destSchema}Table, destField: [${df}] }`
          })
          .join(', ')
        return `    ${relName}: ${fn}(${hopCode})`
      })
      .join(',\n')

    lines.push(
      `const ${tableName}Relationships = relationships(${tableName}Table, ({ one, many }) => ({`,
    )
    lines.push(relBody)
    lines.push(`}))`)
    lines.push(``)
  }

  // emit createSchema
  const tableList = tableNames.map((n) => `  ${n}Table,`).join('\n')
  const relList = relTableNames
    .filter((n) => Object.keys(schema.relationships[n]!).length > 0)
    .map((n) => `  ${n}Relationships,`)
    .join('\n')

  lines.push(`export const schema = createSchema({`)
  lines.push(`  tables: [`)
  lines.push(tableList)
  lines.push(`  ],`)
  lines.push(`  relationships: [`)
  lines.push(relList)
  lines.push(`  ],`)
  lines.push(`})`)
  lines.push(``)

  return lines.join('\n')
}

export interface GenerateOptions {
  /** base data directory */
  dir: string
  /** run after generation */
  after?: string
  /** suppress output */
  silent?: boolean
  /** ignore the generation cache */
  force?: boolean
}

export interface WatchOptions extends GenerateOptions {
  /** debounce delay in ms */
  debounce?: number
}

export interface GenerateResult {
  filesChanged: number
  modelCount: number
  schemaCount: number
  queryCount: number
  mutationCount: number
}

export async function generate(options: GenerateOptions): Promise<GenerateResult> {
  const { dir, after, silent, force } = options
  const baseDir = resolve(dir)
  // support both mutations/ (new) and models/ (legacy) directories
  const mutationsDir = resolve(baseDir, 'mutations')
  const usesMutationsDir = existsSync(mutationsDir)
  const modelsDir = usesMutationsDir ? mutationsDir : resolve(baseDir, 'models')
  const modelsDirName = usesMutationsDir ? 'mutations' : 'models'
  const generatedDir = resolve(baseDir, 'generated')
  const queriesDir = resolve(baseDir, 'queries')

  if (!existsSync(generatedDir)) {
    mkdirSync(generatedDir, { recursive: true })
  }

  loadCache()

  // input-freshness gate: if nothing under baseDir changed since the last
  // COMPLETED generate (the input hash is only stored at the end, after
  // saveCache), the outputs are already current — skip the typescript-program
  // build entirely and return the cached counts. the configureServer watcher
  // still re-runs generate on real model/query edits.
  const inputHash = hashInputTree(baseDir, generatedDir)
  if (
    !force &&
    generateCache.__generatorVersion === GENERATOR_CACHE_VERSION &&
    generateCache.__inputHash === inputHash &&
    existsSync(resolve(generatedDir, 'models.ts'))
  ) {
    let counts: Partial<GenerateResult> = {}
    try {
      counts = JSON.parse(generateCache.__counts || '{}')
    } catch {}
    return {
      filesChanged: 0,
      modelCount: counts.modelCount ?? 0,
      schemaCount: counts.schemaCount ?? 0,
      queryCount: counts.queryCount ?? 0,
      mutationCount: counts.mutationCount ?? 0,
    }
  }

  const allModelFiles = readdirSync(modelsDir).filter(isGeneratorSourceFile).sort()

  const filesWithSchema = allModelFiles.filter((f) =>
    readFileSync(resolve(modelsDir, f), 'utf-8').includes('export const schema = table('),
  )

  const allModelNames = allModelFiles.map((f) => basename(f, '.ts'))
  const schemaModelNames = filesWithSchema.map((f) => basename(f, '.ts'))

  const writeResults = [
    writeFileIfChanged(
      resolve(generatedDir, 'models.ts'),
      generateModelsFile(allModelNames, modelsDirName),
    ),
    // only generate types.ts and tables.ts when model files define schemas.
    // when using drizzle-zero CLI for schema generation, these files are
    // managed externally and should not be overwritten.
    ...(filesWithSchema.length > 0
      ? [
          writeFileIfChanged(
            resolve(generatedDir, 'types.ts'),
            generateTypesFile(schemaModelNames),
          ),
          writeFileIfChanged(
            resolve(generatedDir, 'tables.ts'),
            generateTablesFile(schemaModelNames, modelsDirName),
          ),
        ]
      : []),
    writeFileIfChanged(resolve(generatedDir, 'README.md'), generateReadmeFile()),
  ]

  let filesChanged = writeResults.filter(Boolean).length
  let queryCount = 0
  let mutationCount = 0

  // lazy-load typescript
  const ts = await import('typescript')

  // lightweight string-based parser for inline type annotations from source text
  // handles simple cases: primitives, inline objects, arrays
  // returns null for type references that need the checker to resolve
  const typeToValibot = (paramType: string): string | null => {
    try {
      return parseTypeString(paramType.trim())
    } catch {
      return null
    }
  }

  // generate query files if queries directory exists
  if (existsSync(queriesDir)) {
    const queryFiles = readdirSync(queriesDir).filter(isGeneratorSourceFile)

    const allQueries: Array<{
      name: string
      params: string
      valibotCode: string
      sourceFile: string
    }> = []

    // build resolver for query files (lazy - only created if needed)
    let queryResolver: ReturnType<typeof createTypeResolver> | null = null
    const getQueryResolver = () => {
      if (!queryResolver) {
        const allFiles = readdirSync(queriesDir)
          .filter(isGeneratorSourceFile)
          .map((f) => ({
            path: resolve(queriesDir, f),
            content: readFileSync(resolve(queriesDir, f), 'utf-8'),
          }))
        queryResolver = createTypeResolver(ts, allFiles, queriesDir)
      }
      return queryResolver
    }

    for (const file of queryFiles) {
      const filePath = resolve(queriesDir, file)
      const fileBaseName = basename(file, '.ts')

      try {
        const content = readFileSync(filePath, 'utf-8')
        const sourceFile = ts.createSourceFile(
          filePath,
          content,
          ts.ScriptTarget.Latest,
          true,
        )

        ts.forEachChild(sourceFile, (node) => {
          if (ts.isVariableStatement(node)) {
            const exportModifier = node.modifiers?.find(
              (m) => m.kind === ts.SyntaxKind.ExportKeyword,
            )
            if (!exportModifier) return

            const declaration = node.declarationList.declarations[0]
            if (!declaration || !ts.isVariableDeclaration(declaration)) return

            const name = declaration.name.getText(sourceFile)
            if (name === 'permission') return

            if (declaration.initializer && ts.isArrowFunction(declaration.initializer)) {
              const params = declaration.initializer.parameters
              let paramType = 'void'

              if (params.length > 0) {
                const param = params[0]!
                paramType = param.type?.getText(sourceFile) || 'unknown'
              }

              let valibotCode = typeToValibot(paramType)

              // if direct parse failed (unresolved reference), use TypeChecker
              if (!valibotCode && params.length > 0 && params[0]!.type) {
                const resolver = getQueryResolver()
                const resolverSourceFile = resolver.program.getSourceFile(filePath)
                if (resolverSourceFile) {
                  const resolvedType = resolveParamType(
                    ts,
                    resolver,
                    resolverSourceFile,
                    name,
                    0,
                  )
                  if (resolvedType) {
                    valibotCode = resolver.typeToValibot(resolvedType)
                  }
                }
              }

              if (valibotCode) {
                allQueries.push({
                  name,
                  params: paramType,
                  valibotCode,
                  sourceFile: fileBaseName,
                })
              } else if (!silent && paramType !== 'void') {
                console.error(`✗ ${name}: could not resolve type "${paramType}"`)
              }
            }
          }
        })
      } catch (err) {
        if (!silent) console.error(`Error processing ${file}:`, err)
      }
    }

    queryCount = allQueries.length

    const groupedChanged = writeFileIfChanged(
      resolve(generatedDir, 'groupedQueries.ts'),
      generateGroupedQueriesFile(allQueries),
    )
    const syncedChanged = writeFileIfChanged(
      resolve(generatedDir, 'syncedQueries.ts'),
      generateSyncedQueriesFile(allQueries),
    )

    if (groupedChanged) filesChanged++
    if (syncedChanged) filesChanged++
  }

  // generate mutation validators from model files
  const allModelMutations: ModelMutations[] = []

  // first pass: extract mutations, note which have unresolved types
  const mutationFiles: Array<{ path: string; content: string; baseName: string }> = []
  const unresolvedModels: Array<{ baseName: string; filePath: string }> = []

  for (const file of allModelFiles) {
    const filePath = resolve(modelsDir, file)
    const fileBaseName = basename(file, '.ts')

    try {
      const content = readFileSync(filePath, 'utf-8')

      mutationFiles.push({ path: filePath, content, baseName: fileBaseName })

      const sourceFile = ts.createSourceFile(
        filePath,
        content,
        ts.ScriptTarget.Latest,
        true,
      )
      const result = extractMutationsFromModel(
        ts,
        sourceFile,
        content,
        filePath,
        !!silent,
        typeToValibot,
      )

      if (result) {
        result.modelName = fileBaseName
        allModelMutations.push(result)

        // check if any custom mutations have unresolved types
        const hasUnresolved = result.custom.some(
          (m) => m.paramType !== 'void' && m.paramType !== 'unknown' && !m.valibotCode,
        )
        if (hasUnresolved) {
          unresolvedModels.push({ baseName: fileBaseName, filePath })
        }
      }
    } catch (err) {
      if (!silent) console.error(`Error extracting mutations from ${file}:`, err)
    }
  }

  // second pass: resolve imported types using TypeChecker
  if (unresolvedModels.length > 0) {
    // build resolver with all ts files under baseDir for full import resolution
    // (model files may import types from generated files, shared types, etc)
    const collectTsFiles = (dir: string): Array<{ path: string; content: string }> => {
      const results: Array<{ path: string; content: string }> = []
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const fullPath = resolve(dir, entry.name)
        if (entry.isDirectory() && entry.name !== 'node_modules') {
          results.push(...collectTsFiles(fullPath))
        } else if (entry.isFile() && isGeneratorSourceFile(entry.name)) {
          results.push({ path: fullPath, content: readFileSync(fullPath, 'utf-8') })
        }
      }
      return results
    }
    const allFiles = collectTsFiles(baseDir)
    const modelResolver = createTypeResolver(ts, allFiles, baseDir)

    for (const { baseName, filePath } of unresolvedModels) {
      const resolverSourceFile = modelResolver.program.getSourceFile(filePath)
      if (!resolverSourceFile) continue

      const resolvedTypes = resolveMutationParamTypes(
        ts,
        modelResolver,
        resolverSourceFile,
      )
      if (resolvedTypes.size === 0) continue

      // re-extract with resolved types
      const content = readFileSync(filePath, 'utf-8')
      const sourceFile = ts.createSourceFile(
        filePath,
        content,
        ts.ScriptTarget.Latest,
        true,
      )
      const result = extractMutationsFromModel(
        ts,
        sourceFile,
        content,
        filePath,
        !!silent,
        typeToValibot,
        resolvedTypes,
        modelResolver.typeToValibot,
      )

      if (result) {
        result.modelName = baseName
        // replace the old entry
        const idx = allModelMutations.findIndex((m) => m.modelName === baseName)
        if (idx >= 0) allModelMutations[idx] = result
      }
    }
  }

  // count total mutations (CRUD + custom)
  for (const model of allModelMutations) {
    if (model.hasCRUD) mutationCount += 3 // insert, update, delete
    mutationCount += model.custom.filter(
      (m) => !model.hasCRUD || !['insert', 'update', 'delete', 'upsert'].includes(m.name),
    ).length
  }

  if (allModelMutations.length > 0) {
    const mutationsChanged = writeFileIfChanged(
      resolve(generatedDir, 'syncedMutations.ts'),
      generateSyncedMutationsFile(allModelMutations),
    )
    if (mutationsChanged) filesChanged++
  }

  if (filesChanged > 0 && !silent) {
    console.info(
      `✓ ${allModelFiles.length} models (${filesWithSchema.length} schemas)${queryCount ? `, ${queryCount} queries` : ''}${mutationCount ? `, ${mutationCount} mutations` : ''}`,
    )
  }

  // run after command
  if (filesChanged > 0 && after) {
    const { execSync } = await import('node:child_process')
    try {
      execSync(after, {
        stdio: 'inherit',
        env: { ...process.env, ON_ZERO_GENERATED_DIR: generatedDir },
      })
    } catch (err) {
      if (!silent) console.error(`Error running after command: ${err}`)
    }
  }

  // record the input hash + counts so the next boot can skip a no-op regen.
  generateCache.__generatorVersion = GENERATOR_CACHE_VERSION
  generateCache.__inputHash = inputHash
  generateCache.__counts = JSON.stringify({
    modelCount: allModelFiles.length,
    schemaCount: filesWithSchema.length,
    queryCount,
    mutationCount,
  })
  saveCache()

  return {
    filesChanged,
    modelCount: allModelFiles.length,
    schemaCount: filesWithSchema.length,
    queryCount,
    mutationCount,
  }
}

export async function watch(options: WatchOptions) {
  const { dir, debounce = 1000 } = options
  const baseDir = resolve(dir)
  const mutationsDir = resolve(baseDir, 'mutations')
  const modelsDir = existsSync(mutationsDir) ? mutationsDir : resolve(baseDir, 'models')
  const queriesDir = resolve(baseDir, 'queries')
  const generatedDir = resolve(baseDir, 'generated')

  // initial run (silent)
  await generate({ ...options, silent: true })
  console.info('👀 watching...\n')

  const chokidar = await import('chokidar')

  let debounceTimer: ReturnType<typeof setTimeout> | null = null

  const debouncedRegenerate = (path: string, event: string) => {
    if (debounceTimer) clearTimeout(debounceTimer)
    console.info(`\n${event} ${path}`)
    debounceTimer = setTimeout(() => {
      generate({ ...options, silent: false })
    }, debounce)
  }

  const watcher = chokidar.watch([modelsDir, queriesDir], {
    persistent: true,
    ignoreInitial: true,
    ignored: [generatedDir],
  })

  watcher.on('change', (path) => debouncedRegenerate(path, '📝'))
  watcher.on('add', (path) => debouncedRegenerate(path, '➕'))
  watcher.on('unlink', (path) => debouncedRegenerate(path, '🗑️ '))

  return watcher
}
