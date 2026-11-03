import { createLocalApplicationSqlClientFactory } from 'limesync/local'

export const localApplicationSqlClientFactory = createLocalApplicationSqlClientFactory({
  dataDir: '.orez/application-sql',
})

Reflect.set(
  globalThis,
  '__soot_cf_application_sql_client',
  localApplicationSqlClientFactory,
)
