import { execFileSync } from 'node:child_process'
// prepare the One build with published Orez deployment primitives.
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync, mkdirSync, renameSync } from 'node:fs'
import { resolve, join } from 'node:path'
import {
  defineCloudflareConfig,
  buildMigrationModuleSource,
  readNativeSqlMigrationStatements,
  bundleCloudflareLiteAppWorker,
  configureCloudflareWorker,
  importSpecifier,
  pruneUnreachableWorkerModules,
  stripDeadPageRouteImports,
  assertWorkerStaticModuleImportsResolve,
} from 'orez-lite/cloudflare/build'
import { schema } from '../data/generated/schema'
import {
  cloudflareRustSyncHostSource,
  cloudflareRustSyncWranglerConfig,
  rustSyncAppSchema,
} from './cloudflare/sync-source'

const origin = process.env.ONE_SERVER_URL
if (!origin || !origin.startsWith('https://'))
  throw new Error('ONE_SERVER_URL must name the HTTPS deployment origin')
const workerName = 'takeout-site'
const root = resolve('.')
const workerDir = join(root, 'dist/worker')
const syncDir = join(root, 'dist/orez-sync')
const cfg = defineCloudflareConfig('soot', {
  compiledWasmModules: ['orez-sync-cf-host/wasm-module.wasm'],
})
const statements = readNativeSqlMigrationStatements(
  join(root, 'database/migrations'),
  (sql) => ({
    sql,
  }),
)
const version = createHash('sha256')
  .update(JSON.stringify([statements, schema]))
  .digest('hex')
  .slice(0, 16)
const config = JSON.parse(readFileSync(join(workerDir, 'wrangler.json'), 'utf8'))
configureCloudflareWorker(config)
config.name = workerName
config.account_id = 'aa20b480cc813f2131bc005e2b7fd140'
config.workers_dev = true
config.routes = [
  {
    pattern: `${new URL(origin).hostname}/*`,
    zone_id: 'cb3035f552601556d4ff6ebe345f61d7',
  },
]
if (new URL(origin).hostname === 'takeout.tamagui.dev')
  config.routes.push({
    pattern: 'takeout-v2.tamagui.dev/*',
    zone_id: 'cb3035f552601556d4ff6ebe345f61d7',
  })
config.migrations = [{ tag: 'v1', new_sqlite_classes: ['ZeroSqlDO'] }]
config.services = [{ binding: 'SYNC', service: `${workerName}-sync` }]
config.r2_buckets = [{ binding: 'FILES', bucket_name: 'takeout-site-files' }]
config.vars = {
  NODE_ENV: 'production',
  ALLOW_MISSING_ENV: '1',
  BETTER_AUTH_URL: origin,
  VITE_PROTOCOL: 'https',
  VITE_WEB_HOSTNAME: new URL(origin).hostname,
  VITE_ZERO_HOSTNAME: new URL(origin).hostname,
  ZERO_APP_ID: 'takeout',
  CLOUDFLARE_R2_BUCKET: 'takeout-site-files',
  CLOUDFLARE_R2_PUBLIC_URL: 'https://pub-94d0316bd2b44bd59d3d3627e6eebd8f.r2.dev',
}
writeFileSync(join(workerDir, 'wrangler.json'), JSON.stringify(config, null, 2))
await bundleCloudflareLiteAppWorker(cfg, {
  workerDir,
  entryPoint: join(root, 'scripts/cloudflare/app-worker.js'),
  outfile: join(workerDir, 'index.js.patched'),
  writeMigrationModule: async () => {
    const path = join(workerDir, 'orez-migrations.js')
    writeFileSync(
      join(workerDir, 'orez-schema-version.js'),
      `export const SCHEMA_VERSION = ${JSON.stringify(version)}\n`,
    )
    writeFileSync(
      path,
      buildMigrationModuleSource(cfg, {
        mode: 'native',
        schemaVersion: version,
        schemaImportSpecifier: importSpecifier(
          workerDir,
          join(root, 'data/generated/schema.ts'),
        ),
        nativeSqlStatements: statements,
      }),
    )
    return path
  },
})
renameSync(join(workerDir, 'index.js.patched'), join(workerDir, 'index.js'))
if (stripDeadPageRouteImports(workerDir))
  pruneUnreachableWorkerModules(workerDir, 'index.js')
assertWorkerStaticModuleImportsResolve(workerDir)
mkdirSync(syncDir, { recursive: true })
const sourceVersion = JSON.parse(
  readFileSync(join(root, 'dist/client/version.json'), 'utf8'),
).version
const queryVersion = [...sourceVersion].reduce(
  (hash, char) => ((hash << 5) - hash + char.charCodeAt(0)) >>> 0,
  0,
)
writeFileSync(
  join(syncDir, 'orez-sync-host.js'),
  cloudflareRustSyncHostSource(
    rustSyncAppSchema(schema).schema,
    'takeout',
    origin,
    [],
    queryVersion,
    importSpecifier(syncDir, join(root, 'data/generated/syncedQueries.ts')),
    importSpecifier(syncDir, join(root, 'data/generated/schema.ts')),
  ),
)
const syncConfig = cloudflareRustSyncWranglerConfig({
  appWorkerName: workerName,
  appOrigin: origin,
  authRequired: true,
})
syncConfig.account_id = config.account_id
writeFileSync(join(syncDir, 'wrangler.json'), JSON.stringify(syncConfig, null, 2))
if (!process.argv.includes('--prepare-only')) {
  for (const directory of [syncDir, workerDir])
    execFileSync(
      'bunx',
      ['wrangler', 'deploy', '--config', join(directory, 'wrangler.json')],
      {
        stdio: 'inherit',
      },
    )
}
