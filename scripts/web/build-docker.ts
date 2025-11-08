#!/usr/bin/env bun

/**
 * @description Build docker image for web
 */

import { $ } from 'bun'

// Pass all arguments directly to docker buildx build
const args = process.argv.slice(2)

// build for arm64 - we use warp runners (arm) for github actions
await $`docker buildx build --platform linux/arm64 ${args}`
