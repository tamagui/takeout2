import { SERVER_URL } from '~/constants/urls'
import { createBetterAuthClient } from './createAuthClient'
import { plugins } from './plugins'

console.info(`[better-auth] client baseURL`, SERVER_URL)

const betterAuthClient = createBetterAuthClient({
  baseURL: SERVER_URL,
  plugins,
})

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
