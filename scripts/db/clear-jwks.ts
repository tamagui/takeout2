#!/usr/bin/env bun

import { cmd } from '@take-out/cli'

await cmd`Clear JWKS table to fix auth secret mismatch errors`.run(async ({ $ }) => {
  console.info('clearing jwks table (fixes "Failed to decrypt private key" errors)...')

  const result =
    await $`docker compose exec -T pgdb psql -U user -d postgres -c "DELETE FROM jwks;"`.quiet()

  if (result.exitCode === 0) {
    console.info('✓ jwks table cleared - restart your dev server')
  } else {
    console.error('failed to clear jwks table:', result.stderr.toString())
    console.info('is docker running? try: bun backend')
    process.exit(1)
  }
})
