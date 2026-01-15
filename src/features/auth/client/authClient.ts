import { createBetterAuthClient } from '@take-out/better-auth-utils'
import { href } from 'one'

import { SERVER_URL } from '~/constants/urls'
import { setUser } from '~/features/user/getUser'
import { showToast } from '~/interface/toast/Toast'

import { plugins } from './plugins'

import type { User } from 'better-auth'

type AppUser = User & { role?: 'admin' }

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

export const useAuth = () => {
  const auth = betterAuthClient.useAuth()
  return {
    ...auth,
    loginText: auth.state === 'logged-in' ? 'Account' : 'Login',
    loginLink: href(auth.state === 'logged-in' ? '/home/feed' : '/auth/login'),
  }
}

export const { setAuthClientToken, clearAuthClientToken, authState, authClient } =
  betterAuthClient
