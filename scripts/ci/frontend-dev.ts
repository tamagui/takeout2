#!/usr/bin/env bun

/**
 * @description Start frontend in development mode for CI
 */

import { ciDevWeb } from './helpers/ci-run'

await ciDevWeb()
