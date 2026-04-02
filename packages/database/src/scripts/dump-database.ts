import { spawn } from 'node:child_process'

export type DumpDatabaseOptions = {
  host: string
  database: string
  username: string
  password?: string
  /** output file path */
  outputPath: string
  /** timeout in ms (default: 5 minutes) */
  timeout?: number
  /** pg_dump format (default: 'custom') */
  format?: 'custom' | 'plain' | 'directory' | 'tar'
  /** compression level 0-9 (default: 9) */
  compress?: number
}

export async function dumpDatabase(options: DumpDatabaseOptions): Promise<boolean> {
  const {
    host,
    database,
    username,
    password,
    outputPath,
    timeout = 5 * 60 * 1000,
    format = 'custom',
    compress = 9,
  } = options

  return new Promise<boolean>((resolve) => {
    const proc = spawn(
      'pg_dump',
      [
        '--clean',
        '--if-exists',
        '--no-owner',
        '--no-privileges',
        '--verbose',
        `--format=${format}`,
        `--compress=${compress}`,
        '--file',
        outputPath,
      ],
      {
        env: {
          ...process.env,
          PGPASSWORD: password,
          PGUSER: username,
          PGHOST: host,
          PGDATABASE: database,
          PGCONNECT_TIMEOUT: '10',
        } as any,
        stdio: 'inherit',
      },
    )

    let timeoutId: ReturnType<typeof setTimeout>

    proc.on('error', (err) => {
      console.error('[database] pg_dump process error:', err)
      clearTimeout(timeoutId)
      resolve(false)
    })

    proc.on('exit', (code) => {
      clearTimeout(timeoutId)
      if (code === 0) {
        resolve(true)
      } else {
        console.error(`[database] pg_dump exited with code ${code}`)
        resolve(false)
      }
    })

    timeoutId = setTimeout(() => {
      console.error(`[database] pg_dump timed out after ${timeout}ms`)
      proc.kill('SIGTERM')
      setTimeout(() => {
        if (!proc.killed) proc.kill('SIGKILL')
      }, 5000)
      resolve(false)
    }, timeout)
  })
}

export async function checkDatabaseConnection(options: {
  host: string
  database: string
  username: string
  timeout?: number
}): Promise<boolean> {
  const { host, database, username, timeout = 5000 } = options

  return new Promise<boolean>((resolve) => {
    const proc = spawn('pg_isready', ['-d', database, '-h', host, '-U', username], {
      stdio: 'inherit',
      timeout,
    })

    proc.on('error', () => resolve(false))
    proc.on('exit', (code) => resolve(code === 0))
  })
}
