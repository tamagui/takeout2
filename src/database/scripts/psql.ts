#!/usr/bin/env bun

import '../../../scripts/ensure-tunnel'

import { Resource } from 'sst'

console.info(`Connecting to postgres`, Resource.Postgres2)

Bun.spawnSync([`psql`], {
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
