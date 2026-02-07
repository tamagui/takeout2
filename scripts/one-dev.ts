#!/usr/bin/env bun

import { cmd } from '@take-out/cli'

await cmd`Start One framework dev server`
  .args('--port number')
  .run(async ({ args, $ }) => {
    const defaultPort = +(process.env.VITE_PORT_WEB || 8081)
    const actualPort = args.port ?? defaultPort

    // await $`bun tko ensure-port ${actualPort} --auto-kill Onejs:dev`
    await $`bun run one dev --port ${actualPort} ${args.rest}`
  })
