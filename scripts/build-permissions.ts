#!/usr/bin/env bun

import { $ } from 'bun'

await $`rm -f ./src/database/migrations/permissions.sql`
await $`mkdir -p ./dist`
await $`bun build --external=postgres --external=react --external=@rocicorp/zero --external=one ./src/zero/build-schema.ts --outdir=./dist`
await $`bun zero-deploy-permissions --output-file ./src/database/migrations/permissions.sql --schema-path ./dist/build-schema.js`
