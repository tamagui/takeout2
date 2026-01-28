#!/usr/bin/env bun

/**
 * @description Build development profile for all platforms
 * @args --android, --ios
 */

import { args } from '@take-out/scripts/helpers/args'
import { $ } from 'bun'

const { android, ios } = args('--android boolean --ios boolean')

const platform = android ? 'android' : ios ? 'ios' : 'all'
await $`eas build --profile development --platform ${platform}`
