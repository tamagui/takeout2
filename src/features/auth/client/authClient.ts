import { createBetterAuthClient } from '@vxrn/better-auth-utils'
import type { User } from 'better-auth'
import { SERVER_URL } from '~/constants/urls'
import { setUser } from '~/features/user/getUser'
import { showToast } from '~/interface/toast/Toast'
import { plugins } from './plugins'

type AppUser = User & { role?: 'admin' }

console.info(`[better-auth] client baseURL`, SERVER_URL)

const betterAuthClient = createBetterAuthClient({
  baseURL: SERVER_URL,
  plugins,
  createUser: (user: any) => user as AppUser,
  onAuthStateChange: (state) => {
    setUser(state.user)
  },
  onAuthError: (error: any) => {
    showToast(`Auth error: ${error.message || JSON.stringify(error)}`, {
      type: 'error',
    })
  },
})

export const {
  setAuthClientToken,
  clearAuthClientToken,
  authState,
  authClient,
  useAuth,
} = betterAuthClient
