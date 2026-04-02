import { spawnSync } from 'node:child_process'

export type PsqlOptions = {
  connectionString?: string
  host?: string
  port?: number
  database?: string
  user?: string
  password?: string
  query?: string
}

export function runPsql(options: PsqlOptions = {}) {
  const { connectionString, host, port, database, user, password, query } = options

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

  const args: string[] = []
  if (query) {
    args.push('-c', query)
  }

  console.info(`Connecting to postgres ${env.PGHOST}/${env.PGDATABASE}`)

  const result = spawnSync('psql', args, {
    stdio: ['ignore', 'inherit', 'inherit'],
    env,
  })

  return result.status
}
