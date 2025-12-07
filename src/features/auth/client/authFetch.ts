import { createFetch } from '@better-fetch/fetch'

import { authState } from './authClient'

if (!process.env.ONE_SERVER_URL) {
  throw new Error(`No ONE_SERVER_URL?`)
}

export const authFetch = createFetch({
  // in dev mode ONE_SERVER_URL is 0.0.0.0 which is annoying when we use localhost as it can cause issues
  baseURL: typeof location !== 'undefined' ? location.origin : process.env.ONE_SERVER_URL,
  auth: {
    type: 'Bearer',
    token: () => {
      const sessionToken = authState.value?.session?.token
      if (!sessionToken) {
        console.warn(`No session token, authFetch will fail`)
      }
      return sessionToken
    },
  },
})
