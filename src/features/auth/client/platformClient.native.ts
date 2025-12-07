import '~/helpers/crypto/polyfill.native' // `better-auth/client/plugins` uses `@better-auth/utils` which requires `crypto` in globalThis

import { expoClient } from '@better-auth/expo/client'
import { createStorage } from '@take-out/helpers'

import { APP_SCHEME } from '../constants'

import type { BetterAuthClientPlugin } from 'better-auth'

const expoStorage = createStorage('expo-auth-client')

export function platformClient(): BetterAuthClientPlugin {
  return expoClient({
    scheme: APP_SCHEME,
    storagePrefix: APP_SCHEME,
    storage: expoStorage,
  })
}
