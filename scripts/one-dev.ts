#!/usr/bin/env bun

import { args } from '@take-out/scripts/helpers/args'
import { $ } from 'bun'

const { port = 8081, _ } = args('--port number')

await $`bun tko ensure-port ${port} --auto-kill Onejs:dev`
await $`bun run one dev --port ${port} ${_}`
