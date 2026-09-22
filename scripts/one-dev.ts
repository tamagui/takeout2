#!/usr/bin/env bun

import { cmd } from '@o/cli'

await cmd`Start One framework dev server`
  .args('--port number')
  .run(async ({ args, $ }) => {
    const { ports } = await import('~/env')
    const actualPort = args.port ?? ports.web

    // await $`bun tko ensure-port ${actualPort} --auto-kill Onejs:dev`
    await $`bun run one dev --port ${actualPort} ${args.rest}`
  })
