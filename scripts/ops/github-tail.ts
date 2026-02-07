#!/usr/bin/env bun
import { cmd } from '@take-out/cli'

await cmd`Tail GitHub CI logs`.run(async () => {
  const { githubTail } = await import('@take-out/scripts/helpers/github-tail')
  githubTail({
    showOnlyFailed: process.argv.includes('--failed'),
    forceWatch: process.argv.includes('--watch'),
  })
})
