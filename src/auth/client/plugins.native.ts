import type { BetterAuthClientPlugin } from 'better-auth'
import { expoClient } from '@better-auth/expo/client'
import * as SecureStore from 'expo-secure-store'
import { APP_SCHEME } from '../constants'

export const plugins = [
  expoClient({
    scheme: APP_SCHEME,
    storagePrefix: 'onechat',
    storage: SecureStore,
  }) as any,
] satisfies BetterAuthClientPlugin[]
