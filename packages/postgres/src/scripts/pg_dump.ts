import { spawnSync } from 'node:child_process'

export type PgDumpOptions = {
  connectionString?: string
  host?: string
  port?: number
  database?: string
  user?: string
  password?: string
  args?: string[]
}

export function runPgDump(options: PgDumpOptions = {}) {
  const { connectionString, host, port, database, user, password, args = [] } = options

  const env: Record<string, string> = {
    ...process.env,
  } as any

  if (connectionString) {
    // parse connection string and set individual env vars
    const url = new URL(connectionString)
    env.PGHOST = url.hostname
    env.PGPORT = url.port || '5432'
    env.PGDATABASE = url.pathname.slice(1)
    env.PGUSER = url.username
    if (url.password) {
      env.PGPASSWORD = url.password
    }
  } else {
    if (host) env.PGHOST = host
    if (port) env.PGPORT = port.toString()
    if (database) env.PGDATABASE = database
    if (user) env.PGUSER = user
    if (password) env.PGPASSWORD = password
  }

  console.info(`Running pg_dump on postgres ${env.PGHOST}/${env.PGDATABASE}`)

  const result = spawnSync('pg_dump', args, {
    stdio: ['ignore', 'inherit', 'inherit'],
    env,
  })

  return result.status
}
