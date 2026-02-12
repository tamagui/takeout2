#!/usr/bin/env bun

// @description Build web application

import { cmd } from '@take-out/cli'

await cmd`Build web application`
  .args('--dev boolean --prod boolean')
  .run(async ({ args, $ }) => {
    const isProd = args.prod || (!args.dev && process.env.NODE_ENV === 'production')

    if (isProd) {
      await $`bun run:prod one build --platform=web`
    } else {
      await $`bun run:dev one build --platform=web --skip-env`
    }
  })
