#!/usr/bin/env bun

/**
 * @description Start backend services for CI
 */

import { ciBackend } from './helpers/ci-run'

await ciBackend()
