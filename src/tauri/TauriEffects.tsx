import { useEffect } from 'react'
import { mutateThemes } from 'tamagui'
import { setAuthClientToken } from '~/auth/client/authClient'
import { useAsyncEffect } from '@vxrn/helpers'
import { emptyFn } from '@vxrn/helpers'
import { isTauri } from '@vxrn/helpers'
import { setupTauriMenuListeners } from './menu'
import { useTauriUpdater } from './useTauriUpdater'
import { router } from 'one'

export const TauriEffects = () => {
  // TODO would be nice to prevent click going through if a tauri-drag-region is used to move
  // right now if you drag on a tauri-drag-region and then let go it still clicks the element
  // useEffect(() => {
  //   event.listen('tauri://move', () => {
  //   })
  // }, [])

  useTauriDeepLinks()
  useTauriUpdater()

  useEffect(() => {
    if (isTauri) {
      setupTauriMenuListeners().catch(console.error)
    }
  }, [])

  return null
}

const useTauriDeepLinks = !isTauri
  ? (emptyFn as never)
  : () => {
      useAsyncEffect(async () => {
        try {
          const { onOpenUrl } = await import('@tauri-apps/plugin-deep-link')

          onOpenUrl(([urlString]) => {
            const url = new URL(urlString || '')

            switch (url.host) {
              case 'finish-auth': {
                const token = url.searchParams.get('token')
                const session = url.searchParams.get('session')

                if (token && session) {
                  setAuthClientToken({
                    token,
                    session,
                  })

                  // i don't see a way for better auth to turn a token into a cookie, so we set token into cookie
                  // biome-ignore lint/suspicious/noDocumentCookie: need
                  document.cookie = `better-auth.jwt=${token}; path=/; max-age=604800; SameSite=Lax`
                  router.navigate('/')
                }

                break
              }

              case 'theme': {
                const base64 = url.searchParams.get('value')

                if (base64) {
                  const parsed = JSON.parse(atob(base64))

                  mutateThemes({
                    themes: Object.entries(parsed).map(([name, theme]) => ({
                      name,
                      theme,
                    })) as any,
                    batch: true,
                    insertCSS: true,
                  })

                  console.warn('got it', parsed)
                }

                break
              }
            }
          })
        } catch (err) {
          console.error(err)
        }
      }, [])
    }
