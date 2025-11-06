#!/usr/bin/env bun

/**
 * @description Start frontend in production mode for CI
 */

import { ciServeWeb } from './helpers/ci-run'

// Serve the production build
await ciServeWeb()
