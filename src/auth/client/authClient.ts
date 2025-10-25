import { setDevGlobal } from '~/features/devtools/devGlobal'
import { SERVER_URL } from '~/constants/server-urls'
import { createBetterAuthClient } from './createAuthClient'
import { plugins } from './plugins'

const baseURL = SERVER_URL

console.info(`[better-auth] client baseURL`, baseURL)

const betterAuthClient = createBetterAuthClient({
  baseURL,
  plugins,
})

setDevGlobal(betterAuthClient.authClient, 'betterAuth')

export const {
  setAuthClientToken,
  clearAuthClientToken,
  authState,
  authClient,
  getAuth,
} = betterAuthClient

export const useAuth = () => {
  const betterAuthState = betterAuthClient.useAuth()
  return betterAuthState
}
