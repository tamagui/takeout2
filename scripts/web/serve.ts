#!/usr/bin/env bun

import { cmd } from '@take-out/cli'

await cmd`Serve web in production mode`.run(async ({ $ }) => {
  await $`bun one serve --port 8081`
})
