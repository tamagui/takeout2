/**
 * App-specific authentication client
 *
 * This wraps the @vxrn/better-auth package with app-specific functionality:
 * - User state management via setUser
 * - Toast notifications for auth errors
 * - Custom user type with role field
 */

import { createBetterAuthClient } from '@vxrn/better-auth'
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
  createUser: (user) => user as AppUser,
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
  getAuth,
  useAuth,
} = betterAuthClient
