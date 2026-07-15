import {
  boolean as zeroBoolean,
  createSchema,
  enumeration as zeroEnumeration,
  json as zeroJson,
  number as zeroNumber,
  string as zeroString,
  table as zeroTable,
} from '@rocicorp/zero'
import type {
  ColumnBuilder,
  ReadonlyJSONValue,
  TableBuilderWithColumns,
  ValueType,
} from '@rocicorp/zero'
import {
  Column,
  Table,
  getColumns,
  getTableName,
  getTableUniqueName,
  is,
} from 'drizzle-orm'
import { Relations as LegacyRelations } from 'drizzle-orm/_relations'
import { toCamelCase, toSnakeCase } from 'drizzle-orm/casing'
import { getColumnTable } from 'drizzle-orm/column'
import { SQLiteTable, getTableConfig } from 'drizzle-orm/sqlite-core'

export type { ColumnBuilder, ReadonlyJSONValue, TableBuilderWithColumns }

type Flatten<T> = { [K in keyof T]: T[K] } & {}
type Nullish = null | undefined
type ZeroType = 'string' | 'number' | 'boolean' | 'json'

type TableColumnKeys<TTable extends Table> = Extract<
  {
    [K in keyof TTable]: TTable[K] extends Column ? K : never
  }[keyof TTable],
  string
>

type Columns<TTable extends Table> = Pick<TTable, TableColumnKeys<TTable>>
type ColumnNames<TTable extends Table> = keyof Columns<TTable>
type ColumnMetadata<TColumn> = TColumn extends { _: unknown } ? TColumn['_'] : never
type ColumnData<TColumn> =
  ColumnMetadata<TColumn> extends { data: infer TData } ? TData : never
type ColumnDataType<TColumn> =
  ColumnMetadata<TColumn> extends {
    dataType: infer TDataType extends string
  }
    ? TDataType
    : never
type ColumnEnumValues<TColumn> =
  ColumnMetadata<TColumn> extends {
    enumValues: infer TEnumValues
  }
    ? TEnumValues
    : never

type NormalizeColumnDataType<TDataType extends string> = TDataType extends 'date'
  ? 'date'
  : TDataType extends `bigint${string}`
    ? 'number'
    : TDataType extends 'boolean'
      ? 'boolean'
      : TDataType extends `number${string}`
        ? 'number'
        : TDataType extends 'string'
          ? 'string'
          : TDataType extends `string ${string}`
            ? 'string'
            : TDataType extends 'object json'
              ? 'json'
              : TDataType extends 'object date'
                ? 'date'
                : never

type ResolveColumnZeroType<TColumn> =
  ColumnEnumValues<TColumn> extends readonly string[]
    ? 'string'
    : NormalizeColumnDataType<ColumnDataType<TColumn>> extends 'number' | 'date'
      ? 'number'
      : NormalizeColumnDataType<ColumnDataType<TColumn>> extends infer TType extends
            ZeroType
        ? TType
        : never

type PreserveNarrow<TData, TWide, TFallback> = TData extends TWide
  ? TWide extends TData
    ? TFallback
    : TData
  : TFallback

type ResolveCustomType<TColumn> =
  ResolveColumnZeroType<TColumn> extends 'json'
    ? unknown extends ColumnData<TColumn>
      ? ReadonlyJSONValue
      : ColumnData<TColumn>
    : ResolveColumnZeroType<TColumn> extends 'boolean'
      ?
          | PreserveNarrow<Exclude<ColumnData<TColumn>, Nullish>, boolean, boolean>
          | Extract<ColumnData<TColumn>, Nullish>
      : ResolveColumnZeroType<TColumn> extends 'number'
        ? number
        : ResolveColumnZeroType<TColumn> extends 'string'
          ?
              | PreserveNarrow<Exclude<ColumnData<TColumn>, Nullish>, string, string>
              | Extract<ColumnData<TColumn>, Nullish>
          : unknown

type PrimaryKeyColumns<TTable extends Table> = {
  [K in keyof Columns<TTable>]: ColumnMetadata<Columns<TTable>[K]> extends {
    isPrimaryKey: true
  }
    ? K extends string
      ? K
      : never
    : never
}[keyof Columns<TTable>]

type FindPrimaryKeyFromTable<TTable extends Table> = [PrimaryKeyColumns<TTable>] extends [
  never,
]
  ? [never]
  : [PrimaryKeyColumns<TTable>]

type TypeOverride<TCustomType> = {
  readonly type: ZeroType
  readonly optional: boolean
  readonly customType: TCustomType
  readonly kind?: 'enum'
}

export type ColumnsConfig<TTable extends Table> =
  | boolean
  | Partial<{
      readonly [KColumn in ColumnNames<TTable>]:
        | boolean
        | ColumnBuilder<TypeOverride<ResolveCustomType<Columns<TTable>[KColumn]>>>
    }>

type PrimaryKeyColumnNames<TTable extends Table> = Extract<
  FindPrimaryKeyFromTable<TTable>[number],
  ColumnNames<TTable>
>

type IncludedColumnKeys<
  TTable extends Table,
  TColumnConfig extends ColumnsConfig<TTable> | undefined,
> = [TColumnConfig] extends [boolean | undefined]
  ? ColumnNames<TTable>
  : [PrimaryKeyColumnNames<TTable>] extends [never]
    ? ColumnNames<TTable>
    : Extract<
        | PrimaryKeyColumnNames<TTable>
        | {
            [KColumn in keyof TColumnConfig & ColumnNames<TTable>]: [
              TColumnConfig[KColumn],
            ] extends [false | undefined]
              ? never
              : KColumn
          }[keyof TColumnConfig & ColumnNames<TTable>],
        ColumnNames<TTable>
      >

type ZeroColumnDefinition<
  TTable extends Table,
  KColumn extends ColumnNames<TTable>,
> = Flatten<{
  optional: boolean
  type: ValueType
  customType: ResolveCustomType<Columns<TTable>[KColumn]>
  serverName?: string
}>

export type ZeroColumns<
  TTable extends Table,
  TColumnConfig extends ColumnsConfig<TTable> | undefined,
> = Flatten<{
  [KColumn in IncludedColumnKeys<TTable, TColumnConfig>]: TColumnConfig extends object
    ? KColumn extends keyof TColumnConfig
      ? TColumnConfig[KColumn] extends ColumnBuilder<any>
        ? TColumnConfig[KColumn]['schema']
        : ZeroColumnDefinition<TTable, KColumn>
      : ZeroColumnDefinition<TTable, KColumn>
    : ZeroColumnDefinition<TTable, KColumn>
}>

export type ZeroTableBuilderSchema<
  TTableName extends string,
  TTable extends Table,
  TColumnConfig extends ColumnsConfig<TTable> | undefined,
> = Flatten<{
  name: TTableName
  serverName?: string
  primaryKey: FindPrimaryKeyFromTable<TTable> extends [never]
    ? readonly [string, ...string[]]
    : readonly [string, ...string[]] & FindPrimaryKeyFromTable<TTable>
  columns: Flatten<ZeroColumns<TTable, TColumnConfig>>
}>

export type ZeroTableBuilder<
  TTableName extends string,
  TTable extends Table,
  TColumnConfig extends ColumnsConfig<TTable> | undefined,
> = TableBuilderWithColumns<
  Readonly<ZeroTableBuilderSchema<TTableName, TTable, TColumnConfig>>
>

export type ZeroTableCasing = 'snake_case' | 'camelCase' | undefined

type TableColumnsConfig<TSchema extends Record<string, unknown>> = Partial<
  Flatten<{
    readonly [K in keyof TSchema as TSchema[K] extends Table<any>
      ? K
      : never]: TSchema[K] extends Table<any> ? ColumnsConfig<TSchema[K]> : never
  }>
>

type DefaultTableColumnsConfig<TSchema extends Record<string, unknown>> = Flatten<{
  readonly [K in keyof TSchema as TSchema[K] extends Table<any>
    ? K
    : never]: TSchema[K] extends Table<any>
    ? { readonly [C in ColumnNames<TSchema[K]>]: true }
    : never
}>

type IncludedTableNames<
  TSchema extends Record<string, unknown>,
  TColumnConfig extends TableColumnsConfig<TSchema>,
> = Extract<
  {
    [K in keyof TSchema & string]: TSchema[K] extends Table<any>
      ? K extends keyof TColumnConfig
        ? [TColumnConfig[K]] extends [false | undefined]
          ? never
          : K
        : never
      : never
  }[keyof TSchema & string],
  string
>

type TableConfigFor<
  TSchema extends Record<string, unknown>,
  TColumnConfig extends TableColumnsConfig<TSchema>,
  TTableName extends IncludedTableNames<TSchema, TColumnConfig>,
> = TSchema[TTableName] extends infer TTable extends Table<any>
  ? TTableName extends keyof TColumnConfig
    ? TColumnConfig[TTableName] extends ColumnsConfig<TTable> | undefined
      ? TColumnConfig[TTableName]
      : never
    : never
  : never

export type DrizzleToZeroSchema<
  TSchema extends Record<string, unknown>,
  TColumnConfig extends TableColumnsConfig<TSchema> = DefaultTableColumnsConfig<TSchema>,
> = {
  readonly tables: {
    readonly [K in IncludedTableNames<
      TSchema,
      TColumnConfig
    >]: TSchema[K] extends infer TTable extends Table<any>
      ? ZeroTableBuilderSchema<K, TTable, TableConfigFor<TSchema, TColumnConfig, K>>
      : never
  }
  readonly relationships: Record<string, Record<string, RelationHop[]>>
  readonly enableLegacyMutators?: boolean
  readonly enableLegacyQueries?: boolean
}

type RelationHop = {
  sourceField: string[]
  destField: string[]
  destSchema: string
  cardinality: 'one' | 'many'
}

type RuntimeColumn = Column & {
  columnType?: string
  dataType?: string
  enumValues?: readonly string[]
  defaultFn?: unknown
}

type BetaRelation = {
  fieldName: string
  relationType: 'one' | 'many'
  sourceTable: Table
  targetTable: Table
  targetTableName: string
  sourceColumns: RuntimeColumn[]
  targetColumns: RuntimeColumn[]
  through?: {
    source: Array<{ _: { key: string } }>
    target: Array<{ _: { key: string } }>
  }
  throughTable?: Table
}

type BetaRelationsTableConfig = {
  name: string
  table: Table
  relations: Record<string, BetaRelation>
}

const prefix = '@take-out/drizzle-zero-sqlite'
const warnedServerDefaults = new Set<string>()

const typedEntries = <T extends object>(value: T) =>
  Object.entries(value) as Array<[keyof T, T[keyof T]]>

const debugLog = (debug: boolean | undefined, message: string, detail?: unknown) => {
  if (debug) console.log(`${prefix}: ${message}`, detail ?? '')
}

const zeroTypeByColumnType: Record<string, ZeroType> = {
  SQLiteText: 'string',
  SQLiteTextJson: 'json',
  SQLiteInteger: 'number',
  SQLiteBoolean: 'boolean',
  SQLiteTimestamp: 'number',
  SQLiteReal: 'number',
  SQLiteBlobJson: 'json',
  SQLiteBigInt: 'number',
}

const zeroTypeBySqlType: Record<string, ZeroType> = {
  text: 'string',
  char: 'string',
  varchar: 'string',
  clob: 'string',
  integer: 'number',
  int: 'number',
  tinyint: 'number',
  smallint: 'number',
  mediumint: 'number',
  bigint: 'number',
  real: 'number',
  double: 'number',
  'double precision': 'number',
  float: 'number',
  numeric: 'number',
  decimal: 'number',
  boolean: 'boolean',
  date: 'number',
  datetime: 'number',
  time: 'number',
  timestamp: 'number',
  json: 'json',
  jsonb: 'json',
}

const zeroTypeFromDataType = (dataType: unknown): ZeroType | null => {
  if (typeof dataType !== 'string') return null
  if (dataType === 'boolean') return 'boolean'
  if (dataType === 'date' || dataType === 'object date') return 'number'
  if (dataType === 'object json') return 'json'
  if (dataType === 'string' || dataType.startsWith('string ')) return 'string'
  if (dataType === 'bigint' || dataType.startsWith('bigint ')) return 'number'
  if (dataType === 'number' || dataType.startsWith('number ')) return 'number'
  return null
}

const resolveZeroType = (column: RuntimeColumn): ZeroType | null => {
  if (column.enumValues?.length) return 'string'
  if (column.columnType && zeroTypeByColumnType[column.columnType]) {
    return zeroTypeByColumnType[column.columnType] ?? null
  }
  const dataType = zeroTypeFromDataType(column.dataType)
  if (dataType) return dataType
  return zeroTypeBySqlType[column.getSQLType().toLowerCase()] ?? null
}

const getSqliteTableConfig = (table: Table) => {
  if (!is(table, SQLiteTable)) {
    throw new Error(
      `${prefix}: Unsupported table type: ${getTableName(table)}. Only SQLite tables are supported.`,
    )
  }
  return getTableConfig(table)
}

export const getDrizzleColumnKeyFromColumnName = ({
  columnName,
  table,
}: {
  columnName: string
  table: Table
}) => {
  const match = typedEntries(getColumns(table)).find(
    ([_key, column]) => column.name === columnName,
  )
  if (!match) {
    throw new Error(
      `${prefix}: Unable to resolve column ${getTableName(table)}.${columnName}`,
    )
  }
  return String(match[0])
}

export const createZeroTableBuilder = <
  TTableName extends string,
  TTable extends Table,
  TColumnConfig extends ColumnsConfig<TTable> | undefined = undefined,
  TCasing extends ZeroTableCasing = ZeroTableCasing,
>(
  tableName: TTableName,
  table: TTable,
  columns?: TColumnConfig,
  debug?: boolean,
  casing?: TCasing,
  suppressDefaultsWarning?: boolean,
): ZeroTableBuilder<TTableName, TTable, TColumnConfig> => {
  const actualTableName = getTableName(table)
  const tableColumns = getColumns(table) as Record<string, RuntimeColumn>
  const tableConfig = getSqliteTableConfig(table)
  const columnNameToKey = new Map(
    Object.entries(tableColumns).map(([key, column]) => [column.name, key]),
  )
  const primaryKeys = new Set<string>()

  for (const [key, column] of Object.entries(tableColumns)) {
    if (column.primary) primaryKeys.add(key)
  }
  for (const primaryKey of tableConfig.primaryKeys) {
    for (const column of primaryKey.columns) {
      const key = columnNameToKey.get(column.name)
      if (key) primaryKeys.add(key)
    }
  }

  if (primaryKeys.size === 0) {
    throw new Error(`${prefix}: No primary keys found in table ${actualTableName}`)
  }

  const isColumnBuilder = (value: unknown): value is ColumnBuilder<any> =>
    typeof value === 'object' && value !== null && 'schema' in value
  const mappedColumns: Record<string, ColumnBuilder<any>> = {}

  for (const [key, column] of Object.entries(tableColumns)) {
    const columnConfig =
      typeof columns === 'object' && columns !== null
        ? (columns as Record<string, unknown>)[key]
        : undefined
    const override = isColumnBuilder(columnConfig)
    const resolvedColumnName =
      !column.keyAsName || casing === undefined
        ? column.name
        : casing === 'camelCase'
          ? toCamelCase(column.name)
          : toSnakeCase(column.name)

    if (typeof columns === 'object' && columns !== null) {
      if (columnConfig !== undefined && typeof columnConfig !== 'boolean' && !override) {
        throw new Error(
          `${prefix}: Invalid column config for ${actualTableName}.${resolvedColumnName}`,
        )
      }
      if (columnConfig !== true && !override && !primaryKeys.has(key)) {
        debugLog(debug, `Skipping column ${actualTableName}.${resolvedColumnName}`)
        continue
      }
    }

    if (override) {
      mappedColumns[key] = columnConfig
      continue
    }

    const type = resolveZeroType(column)
    if (!type) {
      console.warn(
        `${prefix}: Unsupported column type: ${actualTableName}.${resolvedColumnName} (${column.columnType}, ${column.dataType}, ${column.getSQLType()})`,
      )
      continue
    }

    const hasServerDefault = column.hasDefault || column.defaultFn !== undefined
    if (hasServerDefault && !suppressDefaultsWarning) {
      const warningKey = `${actualTableName}.${resolvedColumnName}`
      if (!warnedServerDefaults.has(warningKey)) {
        warnedServerDefaults.add(warningKey)
        console.warn(
          `${prefix}: ${warningKey} uses a database default that a Zero client cannot apply`,
        )
      }
    }

    const optional = primaryKeys.has(key)
      ? false
      : hasServerDefault
        ? true
        : !column.notNull
    const builder = column.enumValues?.length
      ? zeroEnumeration()
      : type === 'string'
        ? zeroString()
        : type === 'number'
          ? zeroNumber()
          : type === 'boolean'
            ? zeroBoolean()
            : zeroJson()
    const namedBuilder =
      resolvedColumnName === key ? builder : builder.from(resolvedColumnName)
    mappedColumns[key] = optional ? namedBuilder.optional() : namedBuilder
  }

  const tableBuilder = zeroTable(tableName)
  const namedTableBuilder =
    actualTableName === tableName ? tableBuilder : tableBuilder.from(actualTableName)
  return namedTableBuilder
    .columns(mappedColumns)
    .primaryKey(...primaryKeys) as ZeroTableBuilder<TTableName, TTable, TColumnConfig>
}

const isBetaRelationsTableConfig = (
  value: unknown,
): value is BetaRelationsTableConfig => {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false
  return (
    'name' in value &&
    typeof value.name === 'string' &&
    'table' in value &&
    'relations' in value &&
    typeof value.relations === 'object' &&
    value.relations !== null
  )
}

const isBetaRelationsExport = (
  value: unknown,
): value is Record<string, BetaRelationsTableConfig> => {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false
  const entries = Object.values(value)
  return entries.length > 0 && entries.every(isBetaRelationsTableConfig)
}

const getDrizzleKeyFromTable = ({
  schema,
  table,
  fallbackTableName,
}: {
  schema: Record<string, unknown>
  table?: Table
  fallbackTableName?: string
}) => {
  if (table) {
    const directMatch = typedEntries(schema).find(
      ([_key, value]) => is(value, Table) && value === table,
    )?.[0]
    if (directMatch) return String(directMatch)

    const uniqueName = getTableUniqueName(table)
    const uniqueMatch = typedEntries(schema).find(
      ([_key, value]) => is(value, Table) && getTableUniqueName(value) === uniqueName,
    )?.[0]
    if (uniqueMatch) return String(uniqueMatch)
  }

  if (fallbackTableName) {
    const fallbackMatch = typedEntries(schema).find(
      ([_key, value]) => is(value, Table) && getTableName(value) === fallbackTableName,
    )?.[0]
    if (fallbackMatch) return String(fallbackMatch)
  }

  throw new Error(
    `${prefix}: Unable to resolve table key for ${table ? getTableUniqueName(table) : fallbackTableName}`,
  )
}

const relationEntries = (relations: Record<string, BetaRelation>) =>
  Object.fromEntries(
    Object.entries(relations).filter(([_name, relation]) => {
      if (typeof relation !== 'object' || relation === null) return false
      return (
        'fieldName' in relation &&
        'relationType' in relation &&
        'sourceTable' in relation &&
        'targetTable' in relation &&
        'sourceColumns' in relation &&
        'targetColumns' in relation
      )
    }),
  )

const normalizeRelation = ({
  schema,
  relation,
}: {
  schema: Record<string, unknown>
  relation: BetaRelation
}) => {
  if (!is(relation.sourceTable, Table) || !is(relation.targetTable, Table)) {
    throw new Error(`${prefix}: Relations involving views are not supported`)
  }

  const sourceTableName = getDrizzleKeyFromTable({
    schema,
    table: relation.sourceTable,
    fallbackTableName: getTableName(relation.sourceTable),
  })
  const targetTableName = getDrizzleKeyFromTable({
    schema,
    table: relation.targetTable,
    fallbackTableName: relation.targetTableName,
  })
  const sourceField = relation.sourceColumns.map((column) =>
    getDrizzleColumnKeyFromColumnName({
      columnName: column.name,
      table: getColumnTable(column),
    }),
  )
  const destField = relation.targetColumns.map((column) =>
    getDrizzleColumnKeyFromColumnName({
      columnName: column.name,
      table: getColumnTable(column),
    }),
  )

  if (!sourceField.length || !destField.length) {
    throw new Error(
      `${prefix}: Missing join columns for ${sourceTableName}.${relation.fieldName}`,
    )
  }

  if (!relation.through) {
    return {
      sourceTableName,
      relationName: relation.fieldName,
      hops: [
        {
          sourceField,
          destField,
          destSchema: targetTableName,
          cardinality: relation.relationType,
        },
      ] satisfies RelationHop[],
    }
  }

  if (!relation.throughTable || !is(relation.throughTable, Table)) {
    throw new Error(
      `${prefix}: Invalid through relation ${sourceTableName}.${relation.fieldName}`,
    )
  }
  const throughTableName = getDrizzleKeyFromTable({
    schema,
    table: relation.throughTable,
    fallbackTableName: getTableName(relation.throughTable),
  })
  const throughSourceField = relation.through.source.map((column) => column._.key)
  const throughTargetField = relation.through.target.map((column) => column._.key)

  if (!throughSourceField.length || !throughTargetField.length) {
    throw new Error(
      `${prefix}: Missing through columns for ${sourceTableName}.${relation.fieldName}`,
    )
  }

  return {
    sourceTableName,
    relationName: relation.fieldName,
    hops: [
      {
        sourceField,
        destField: throughSourceField,
        destSchema: throughTableName,
        cardinality: relation.relationType,
      },
      {
        sourceField: throughTargetField,
        destField,
        destSchema: targetTableName,
        cardinality: relation.relationType,
      },
    ] satisfies RelationHop[],
  }
}

export const drizzleZeroConfig = <
  const TSchema extends Record<string, unknown>,
  const TColumnConfig extends TableColumnsConfig<TSchema> =
    DefaultTableColumnsConfig<TSchema>,
  const TCasing extends ZeroTableCasing = undefined,
>(
  schema: TSchema,
  config?: {
    readonly tables?: TColumnConfig
    readonly casing?: TCasing
    readonly debug?: boolean
    readonly suppressDefaultsWarning?: boolean
  },
): Flatten<DrizzleToZeroSchema<TSchema, TColumnConfig>> => {
  const tables: Array<TableBuilderWithColumns<any>> = []
  const includedTableKeys = new Set<string>()
  const tableColumnNames = new Map<string, Set<string>>()
  const discoveredRelations = new Map<
    string,
    { table: Table; relations: Record<string, BetaRelation> }
  >()
  const legacyRelations: string[] = []

  for (const [entryNameKey, value] of typedEntries(schema)) {
    const entryName = String(entryNameKey)
    if (!value) throw new Error(`${prefix}: ${entryName} is not defined`)

    if (is(value, Table)) {
      const tableConfig = config?.tables?.[entryNameKey as keyof TColumnConfig]
      if (config?.tables && (tableConfig === false || tableConfig === undefined)) {
        debugLog(config.debug, `Skipping table ${entryName}`)
        continue
      }
      const tableBuilder = createZeroTableBuilder(
        entryName,
        value,
        tableConfig as ColumnsConfig<typeof value> | undefined,
        config?.debug,
        config?.casing,
        config?.suppressDefaultsWarning,
      )
      tables.push(tableBuilder)
      includedTableKeys.add(entryName)
      tableColumnNames.set(entryName, new Set(Object.keys(tableBuilder.schema.columns)))
      continue
    }

    if (value instanceof LegacyRelations) {
      legacyRelations.push(entryName)
      continue
    }
    if (!isBetaRelationsExport(value)) continue

    for (const [tableKey, tableConfig] of Object.entries(
      value as Record<string, BetaRelationsTableConfig>,
    )) {
      if (!is(tableConfig.table, Table)) continue
      const entries = relationEntries(tableConfig.relations)
      const existing = discoveredRelations.get(tableKey)
      if (!existing) {
        discoveredRelations.set(tableKey, {
          table: tableConfig.table,
          relations: entries,
        })
        continue
      }
      if (
        existing.table !== tableConfig.table &&
        getTableUniqueName(existing.table) !== getTableUniqueName(tableConfig.table)
      ) {
        throw new Error(`${prefix}: Conflicting relation exports for ${tableKey}`)
      }
      for (const [relationName, relation] of Object.entries(entries)) {
        if (relationName in existing.relations) {
          throw new Error(`${prefix}: Duplicate relationship ${tableKey}.${relationName}`)
        }
        existing.relations[relationName] = relation
      }
    }
  }

  if (legacyRelations.length) {
    throw new Error(
      `${prefix}: Legacy relations() exports are unsupported. Use defineRelations(). Found: ${legacyRelations.join(', ')}`,
    )
  }
  if (!tables.length) {
    throw new Error(`${prefix}: No SQLite tables found in the input`)
  }

  const relationships: Record<string, Record<string, RelationHop[]>> = {}
  for (const relationConfig of discoveredRelations.values()) {
    for (const relation of Object.values(relationConfig.relations)) {
      const normalized = normalizeRelation({ schema, relation })
      const targetTableName = normalized.hops.at(-1)!.destSchema
      const throughTableName =
        normalized.hops.length === 2 ? normalized.hops[0]!.destSchema : undefined
      if (
        !includedTableKeys.has(normalized.sourceTableName) ||
        !includedTableKeys.has(targetTableName) ||
        (throughTableName && !includedTableKeys.has(throughTableName))
      ) {
        debugLog(config?.debug, `Skipping relation ${normalized.relationName}`)
        continue
      }
      if (
        tableColumnNames.get(normalized.sourceTableName)?.has(normalized.relationName)
      ) {
        throw new Error(
          `${prefix}: Relationship ${normalized.sourceTableName}.${normalized.relationName} conflicts with a column`,
        )
      }
      if (relationships[normalized.sourceTableName]?.[normalized.relationName]) {
        throw new Error(
          `${prefix}: Duplicate relationship ${normalized.sourceTableName}.${normalized.relationName}`,
        )
      }
      relationships[normalized.sourceTableName] = {
        ...relationships[normalized.sourceTableName],
        [normalized.relationName]: normalized.hops,
      }
    }
  }

  return createSchema({
    tables,
    relationships: Object.entries(relationships).map(([name, value]) => ({
      name,
      relationships: value,
    })),
  } as any) as unknown as Flatten<DrizzleToZeroSchema<TSchema, TColumnConfig>>
}

export const drizzleZeroSqliteConfig = drizzleZeroConfig
