#!/usr/bin/env bun

import { githubTail } from '@take-out/scripts/helpers/github-tail'

githubTail({
  showOnlyFailed: process.argv.includes('--failed'),
  forceWatch: process.argv.includes('--watch'),
})
