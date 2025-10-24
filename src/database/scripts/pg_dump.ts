#!/usr/bin/env bun

import '../../../scripts/ensure-tunnel'

import { Resource } from 'sst'

console.info(`Running pg_dump on postgres ${Resource.Postgres2.host}`)

const args = process.argv.slice(2)

Bun.spawnSync(['pg_dump', ...args], {
  stdin: 'ignore',
  stdout: 'inherit',
  stderr: 'inherit',
  env: {
    ...process.env,
    PGPASSWORD: Resource.Postgres2.password,
    PGUSER: Resource.Postgres2.username,
    PGHOST: Resource.Postgres2.host,
    PGDATABASE: Resource.Postgres2.database,
  } as any,
})
