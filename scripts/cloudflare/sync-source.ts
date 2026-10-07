// adapted from the existing application sync host; engine code stays in orez-lite.
type RustSyncColumn = {
  type: string
}

type RustSyncTable = {
  columns: Record<string, RustSyncColumn>
  primaryKey: string[]
}

export type RustSyncSchema = {
  tables: Record<string, RustSyncTable>
}

export type RustSyncAppSchema = {
  schema: RustSyncSchema
}

const SUPPORTED_COLUMN_TYPES = new Set(['bigint', 'boolean', 'json', 'number', 'string'])

export function rustSyncAppSchema(value: unknown): RustSyncAppSchema {
  if (!isRecord(value) || !isRecord(value.tables)) {
    throw new Error('generated Zero schema has no tables')
  }

  const tables: Record<string, RustSyncTable> = {}
  for (const [clientName, rawTable] of Object.entries(value.tables)) {
    if (!isRecord(rawTable)) {
      throw new Error(`generated Zero table ${clientName} is invalid`)
    }
    if (rawTable.name !== clientName) {
      throw new Error(
        `Rust sync requires matching client and database table names: ${clientName} != ${String(rawTable.name)}`,
      )
    }
    if (!Array.isArray(rawTable.primaryKey) || rawTable.primaryKey.length === 0) {
      throw new Error(`generated Zero table ${clientName} has no primary key`)
    }
    const primaryKey = rawTable.primaryKey.filter(
      (column): column is string => typeof column === 'string',
    )
    if (primaryKey.length !== rawTable.primaryKey.length) {
      throw new Error(`generated Zero table ${clientName} has an invalid primary key`)
    }
    if (!isRecord(rawTable.columns)) {
      throw new Error(`generated Zero table ${clientName} has no columns`)
    }
    const columns: Record<string, RustSyncColumn> = {}
    for (const [columnName, rawColumn] of Object.entries(rawTable.columns)) {
      if (!isRecord(rawColumn) || typeof rawColumn.type !== 'string') {
        throw new Error(`generated Zero column ${clientName}.${columnName} is invalid`)
      }
      if (!SUPPORTED_COLUMN_TYPES.has(rawColumn.type)) {
        throw new Error(
          `Rust sync does not support ${clientName}.${columnName} type ${rawColumn.type}`,
        )
      }
      if (
        typeof rawColumn.serverName === 'string' &&
        rawColumn.serverName !== columnName
      ) {
        throw new Error(
          `Rust sync requires matching client and database column names: ${clientName}.${columnName} != ${rawColumn.serverName}`,
        )
      }
      columns[columnName] = { type: rawColumn.type }
    }
    tables[clientName] = { columns, primaryKey }
  }
  return { schema: { tables } }
}

export function cloudflareRustSyncAuthenticateSource(): string {
  return `
export async function authenticate(request, env) {
  if (env.AUTH_REQUIRED !== '1') return { userID: 'anon', authData: null }
  if (!env.APP || !env.APP_ORIGIN) return null
  const syncNamespace = namespace(request)
  if (!syncNamespace) return null
  const endpoint = new URL('/api/zero/rust-auth', env.APP_ORIGIN)
  const headers = new Headers({ 'content-type': 'application/json' })
  const authorization = request.headers.get('authorization')
  const cookie = request.headers.get('cookie')
  if (authorization) headers.set('authorization', authorization)
  if (cookie) headers.set('cookie', cookie)
  headers.set('host', endpoint.host)
  const response = await env.APP.fetch(
    new Request(endpoint.toString(), {
      method: 'POST',
      headers,
      body: JSON.stringify({ namespace: syncNamespace }),
    }),
  )
  if (response.status === 401) return null
  if (!response.ok) {
    const retryAfterSeconds = Number(response.headers.get('retry-after'))
    throw Object.assign(
      new Error('application rust-auth returned ' + response.status),
      {
        status: response.status,
        ...(Number.isFinite(retryAfterSeconds) && retryAfterSeconds > 0
          ? { retryAfterMs: retryAfterSeconds * 1000 }
          : {}),
      },
    )
  }
  const claims = await response.json().catch(() => null)
  return claims && typeof claims.userID === 'string' && claims.userID.length > 0
    ? claims
    : null
}
`
}

export function cloudflareRustSyncHostSource(
  schema: RustSyncSchema,
  appId: string,
  appOrigin: string,
  allowedOrigins: readonly string[],
  queryTransformVersion: number,
  queryModuleSpecifier: string,
  schemaModuleSpecifier: string,
): string {
  const mutateUrl = `/api/zero/push?${new URLSearchParams({
    schema: `${appId}_0`,
    appID: appId,
  })}`
  return `
import { createSyncDurableObject, createSyncWorker } from 'orez-lite/cloudflare/sync'
import { defineStreamingFields } from 'orez-lite/realtime'
import { createSyncQueries } from 'on-zero/server'
import { queries as appQueryDefinitions } from ${JSON.stringify(queryModuleSpecifier)}
import { schema as appSchema } from ${JSON.stringify(schemaModuleSpecifier)}

const schema = ${JSON.stringify(schema)}
const queries = createSyncQueries({
  schema: appSchema,
  queries: appQueryDefinitions,
  defaultAllowAdminRole: 'all',
})
// this application has no server-side realtime producers.
const streamingManifest = defineStreamingFields(schema, {}).manifest

function quoteIdentifier(value) {
  return '"' + value.replaceAll('"', '""') + '"'
}

function sqliteType(type) {
  if (type === 'number') return 'REAL'
  if (type === 'boolean') return 'INTEGER'
  if (type === 'bigint' || type === 'string' || type === 'json') return 'TEXT'
  throw new Error('unsupported Zero column type: ' + type)
}

function initialize(sql) {
  for (const [tableName, table] of Object.entries(schema.tables)) {
    const columns = Object.entries(table.columns).map(
      ([columnName, column]) =>
        quoteIdentifier(columnName) + ' ' + sqliteType(column.type),
    )
    columns.push(
      'PRIMARY KEY (' + table.primaryKey.map(quoteIdentifier).join(', ') + ')',
    )
    sql.exec(
      'CREATE TABLE IF NOT EXISTS ' +
        quoteIdentifier(tableName) +
        ' (' +
        columns.join(', ') +
        ')',
    )
    const existingColumns = new Set(
      sql
        .query(
          "SELECT name FROM pragma_table_info('" +
            tableName.replaceAll("'", "''") +
            "')",
        )
        .map((row) => row.name),
    )
    for (const [columnName, column] of Object.entries(table.columns)) {
      if (existingColumns.has(columnName)) continue
      sql.exec(
        'ALTER TABLE ' +
          quoteIdentifier(tableName) +
          ' ADD COLUMN ' +
          quoteIdentifier(columnName) +
          ' ' +
          sqliteType(column.type),
      )
    }
  }
}

function namespace(request) {
  const first = new URL(request.url).pathname
    .split('/')
    .find((part) => part.length > 0)
  return first === 'zero-http' ? 'app' : null
}

${cloudflareRustSyncAuthenticateSource()}

function authorize(_request, claims, namespace) {
  return (
    namespace === 'app' &&
    typeof claims.userID === 'string' &&
    claims.userID.length > 0
  )
}

// wake uses the same auth zero already supplied to the standard transport.
async function authorizeWake(request, env) {
  const claims = await authenticate(request, env)
  return claims && typeof claims.userID === 'string' && claims.userID.length > 0
    ? { userID: claims.userID }
    : false
}

function authorizeProduce() { return false }
function authorizeNotify() { return false }

const config = {
  hostVersion: 'generated-app-rust-sync-2',
  schema,
  mutateUrl: ${JSON.stringify(mutateUrl)},
  mutateOrigin: ${JSON.stringify(appOrigin)},
  mutateBinding: 'APP',
  upstream: {
    binding: 'DATA',
    namespacePath: '/',
    intervalMs: 60_000,
  },
  initialize,
  authenticate,
  authorize,
  authorizeWake,
  authorizeNotify,
  authorizeProduce,
  streamingManifest,
  namespace,
  queries,
  queryTransformVersion: ${queryTransformVersion},
  retainChanges: 4_096,
  wakeCoalesceMs: 25,
  allowedOrigins: ${JSON.stringify(allowedOrigins)},
}

export const AppSyncDurableObject = createSyncDurableObject(config)
export default createSyncWorker(config)
`
}

export function cloudflareRustSyncWranglerConfig({
  appWorkerName,
  appOrigin,
  authRequired,
}: {
  appWorkerName: string
  appOrigin: string
  authRequired: boolean
}): Record<string, unknown> {
  return {
    name: `${appWorkerName}-sync`,
    main: 'orez-sync-host.js',
    compatibility_date: '2026-06-17',
    compatibility_flags: ['nodejs_compat'],
    workers_dev: true,
    durable_objects: {
      bindings: [{ name: 'SYNC_DO', class_name: 'AppSyncDurableObject' }],
    },
    migrations: [{ tag: 'v1', new_sqlite_classes: ['AppSyncDurableObject'] }],
    services: [
      { binding: 'APP', service: appWorkerName },
      {
        binding: 'DATA',
        service: appWorkerName,
        entrypoint: 'OrezDataFeed',
      },
    ],
    vars: {
      APP_ORIGIN: appOrigin,
      AUTH_REQUIRED: authRequired ? '1' : '0',
    },
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
