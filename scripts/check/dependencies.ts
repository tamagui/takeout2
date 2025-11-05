#!/usr/bin/env bun

/**
 * @description Check for circular dependencies
 */

import { $ } from 'bun'

await $`tko run check-circular-deps --ignore MarkdownSandboxQuery,afterCreateUser.ts,server.ts`
