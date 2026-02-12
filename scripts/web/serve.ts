#!/usr/bin/env bun

// @description Serve web application

import { cmd } from '@take-out/cli'

await cmd`Serve web application`
  .args('--dev boolean --prod boolean')
  .run(async ({ args, $ }) => {
    const isProd = args.prod || (!args.dev && process.env.NODE_ENV === 'production')

    if (isProd) {
      await $`bun one serve --port 8081`
    } else {
      await $`bun run:dev one serve --port 8081`
    }
  })
