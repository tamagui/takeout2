#!/usr/bin/env bun

const upstreamDb = process.env.ZERO_UPSTREAM_DB

if (!upstreamDb) {
  console.error('ZERO_UPSTREAM_DB not found in environment')
  console.error('Make sure to run: bun db:psql:dev (which runs with bun run:dev)')
  process.exit(1)
}

// Parse the DATABASE_URL format
const url = new URL(upstreamDb)

console.info(`Connecting to dev postgres at ${url.hostname}`)

// Pass any additional arguments to psql
const args = process.argv.slice(2)

// If QUERY env var is set, use it as a -c argument
if (process.env.QUERY) {
  args.unshift('-c', process.env.QUERY)
}

const proc = Bun.spawnSync(['psql', upstreamDb, ...args], {
  stdin: 'ignore',
  stdout: 'inherit',
  stderr: 'inherit',
} as const)

process.exit(proc.exitCode || 0)
