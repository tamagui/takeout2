#!/usr/bin/env bun

// @description Serve web application

import { cmd } from '@take-out/cli'

await cmd`Serve web application`.args('--port number').run(async ({ args, $ }) => {
  await $`bun one serve --port ${args.port || 8081}`
})
