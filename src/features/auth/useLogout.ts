import { router } from 'one'

import { authClient, clearAuthClientToken } from '~/features/auth/client/authClient'
import { dialogConfirm, showError } from '~/interface/dialogs/actions'

export const useLogout = () => {
  const logout = async (options?: { skipConfirm?: boolean }) => {
    if (!options?.skipConfirm) {
      const confirmed = await dialogConfirm({
        title: 'Log Out',
        description: 'Are you sure you want to log out?',
      })

      if (!confirmed) return false
    }

    try {
      await authClient.signOut()
      clearAuthClientToken()
      router.dismissAll()
      router.replace('/login')
      return true
    } catch (error) {
      console.error('logout error:', error)
      showError(error, 'Logout')
      return false
    }
  }

  return { logout }
}
