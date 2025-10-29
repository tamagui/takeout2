import { useMemo } from 'react'
import { useAuth } from '~/features/auth/client/authClient'
import { DESKTOP_APP_SCHEME } from './constants'

const key = 'CHAT_CAME_FROM_TAURI'

export const useTauriAuthDeepLink = () => {
  const { session, token } = useAuth()

  return useMemo(() => {
    if (!session?.token || !token) {
      return null
    }

    const url = new URL(`${DESKTOP_APP_SCHEME}://finish-auth`)
    url.searchParams.set('token', token)
    url.searchParams.set('session', session?.token || '')

    return url.toString()
  }, [token, session?.token])
}

export const setShouldRedirectBackToTauri = (should = true) => {
  if (should) {
    localStorage.setItem(key, `${Date.now()}`)
  } else {
    localStorage.removeItem(key)
  }
}

export const shouldRedirectBackToTauri = () => {
  const val = localStorage.getItem(key)
  // if we started redirected tauri login within last 10 minutes
  if (val && Date.now() - +val < 10_000 * 60) {
    return true
  }
  return false
}
