import { getURL } from 'one'
import { setDevGlobal } from '~/features/devtools/devGlobal'
import { createBetterAuthClient } from './createAuthClient'
import { plugins } from './plugins'

let baseURL = getURL()
// FIXME: [One] prod ONE_SERVER_URL not working in metro
if (baseURL === 'http://one-server.example.com') {
  baseURL = 'https://start.chat'
}
console.info(`[better-auth] client baseURL`, baseURL)

const betterAuthClient = createBetterAuthClient({
  baseURL,
  plugins,
})

setDevGlobal(betterAuthClient, 'betterAuthClient')
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
