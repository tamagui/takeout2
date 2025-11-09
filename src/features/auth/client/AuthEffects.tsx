import { isClient, isWeb } from 'tamagui'
import { isTauri } from '@tamatko/helpers'
import { setAuthClientToken } from './authClient'

const disableAuthBrowser =
  !isWeb || isTauri || (typeof window !== 'undefined' && window.opener)

if (isWeb && isClient && !disableAuthBrowser) {
  // Listen for messages from the popup
  window.addEventListener('message', async (event) => {
    if (event.origin !== origin) return

    if (event.data?.type === 'login-success') {
      popup?.close()

      if (event.data) {
        await setAuthClientToken({
          session: event.data.session,
          token: event.data.token,
        })
      }
    }
  })
}

let popup: Window | null = null

export function setLoginPopup(_: Window) {
  popup = _
}
