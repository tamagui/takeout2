#!/usr/bin/env bun

{
  const upstreamDb = process.env.ZERO_UPSTREAM_DB

  if (!upstreamDb) {
    console.error('ZERO_UPSTREAM_DB not found in environment')
    console.error('Make sure to run this script with bun run:dev')
    process.exit(1)
  }

  // Get query from first argument
  const query = process.argv[2]

  if (!query) {
    console.error('Usage: ./scripts/psql-query.ts "SELECT * FROM table"')
    process.exit(1)
  }

  const proc = Bun.spawnSync(['psql', upstreamDb, '-c', query], {
    stdin: 'ignore',
    stdout: 'inherit',
    stderr: 'inherit',
  } as const)

  process.exit(proc.exitCode || 0)
}
