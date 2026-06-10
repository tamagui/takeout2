#!/usr/bin/env bun

// @description Build web application

import { existsSync } from 'node:fs'
import glob from 'fast-glob'
import { cmd } from '@take-out/cli'

// docs are SSG (app/docs/[slug]+ssg.tsx). one's build silently skips any page
// whose render throws (console.warn "skipping page ...") instead of failing, so
// a flaky build can ship a docs site missing most pages while CI stays green.
// that exact failure took prod down to 5/20 docs routes. fail loud instead.
function verifyDocsBuilt() {
  const docsSrc = 'src/features/site/docs'
  const slugs = glob
    .sync(`${docsSrc}/**/*.mdx`)
    .map((p) => p.replace(`${docsSrc}/`, '').replace(/\.mdx$/, ''))

  const missing = slugs.filter((slug) => !existsSync(`dist/client/docs/${slug}.html`))

  if (missing.length) {
    throw new Error(
      `web build skipped ${missing.length}/${slugs.length} docs pages (one swallows per-page render errors). missing: ${missing.join(', ')}`,
    )
  }
  console.info(`✅ all ${slugs.length} docs pages generated`)
}

await cmd`Build web application`
  .args('--dev boolean --prod boolean')
  .run(async ({ args, $ }) => {
    const isProd = args.prod || (!args.dev && process.env.NODE_ENV === 'production')

    if (isProd) {
      await $`bun run:prod one build --platform=web`
    } else {
      await $`bun run:dev one build --platform=web --skip-env`
    }

    verifyDocsBuilt()
  })
