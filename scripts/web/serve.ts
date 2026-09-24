#!/usr/bin/env bun

// @description Serve web application

import { cmd } from '@o/cli'

await cmd`Serve web application`.args('--port number').run(async ({ args, $ }) => {
  const { ports } = await import('~/env')
  await $`bun one serve --port ${args.port || ports.web}`
})
