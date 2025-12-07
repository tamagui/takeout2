import '~/helpers/crypto/polyfill.native' // `better-auth/client/plugins` uses `@better-auth/utils` which requires `crypto` in globalThis

import { expoClient } from '@better-auth/expo/client'
import * as SecureStore from 'expo-secure-store'

import { APP_SCHEME } from '../constants'

import type { BetterAuthClientPlugin } from 'better-auth'

export function platformClient(): BetterAuthClientPlugin {
  return expoClient({
    scheme: APP_SCHEME,
    storagePrefix: APP_SCHEME,
    storage: {
      getItem(key: string) {
        const value = SecureStore.getItem(key)
        return value
      },
      setItem(key: string, value: string) {
        return SecureStore.setItem(key, value)
      },
    },
  })
}
