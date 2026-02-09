export interface ZeroLiteConfig {
  dataDir: string
  pgPort: number
  zeroPort: number
  s3Port: number
  webPort: number
  pgUser: string
  pgPassword: string
  migrationsDir: string
  seedFile: string
}

export function getConfig(overrides: Partial<ZeroLiteConfig> = {}): ZeroLiteConfig {
  return {
    dataDir: overrides.dataDir || '.zero-lite',
    pgPort: overrides.pgPort || 6434,
    zeroPort: overrides.zeroPort || 5849,
    s3Port: overrides.s3Port || 10201,
    webPort: overrides.webPort || 7777,
    pgUser: overrides.pgUser || 'user',
    pgPassword: overrides.pgPassword || 'password',
    migrationsDir: overrides.migrationsDir || 'src/database/migrations',
    seedFile: overrides.seedFile || 'src/database/seed.sql',
  }
}

export function getConnectionString(config: ZeroLiteConfig, dbName = 'postgres'): string {
  return `postgresql://${config.pgUser}:${config.pgPassword}@127.0.0.1:${config.pgPort}/${dbName}`
}
