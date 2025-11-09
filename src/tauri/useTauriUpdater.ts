import type { Update } from '@tauri-apps/plugin-updater'
import { emptyFn, time, isTauri } from '@tamatko/helpers'
import { useCallback, useEffect, useRef } from 'react'
import { showNotification } from '~/interface/notification/Notification'
import { showToast } from '~/interface/toast/Toast'

const CHECK_INTERVAL = time.ms.minutes(30)
const isDev = process.env.NODE_ENV === 'development'

export const useTauriUpdater =
  !isTauri || isDev
    ? (emptyFn as never)
    : () => {
        const updateRef = useRef<Update | null>(null)

        const checkForUpdate = useCallback(async () => {
          try {
            console.info('Checking for Tauri updates...')
            const { check } = await import('@tauri-apps/plugin-updater')
            const { getVersion } = await import('@tauri-apps/api/app')

            const update = await check()

            if (!update?.version) {
              console.warn(`No version on update?`, update)
              return
            }

            if (update) {
              console.info(
                'Update available:',
                update.version,
                update.date,
                'current version:',
                await getVersion()
              )
              updateRef.current = update

              showToast('Downloading update...', {
                type: 'info',
              })

              let downloaded = 0
              let contentLength = 0

              await update.downloadAndInstall((event) => {
                switch (event.event) {
                  case 'Started':
                    contentLength = event.data.contentLength || 0
                    break
                  case 'Progress': {
                    downloaded += event.data.chunkLength
                    // const progress =
                    //   contentLength > 0
                    //     ? Math.round((downloaded / contentLength) * 100)
                    //     : 0
                    break
                  }
                  case 'Finished':
                    console.info('Download finished')
                    break
                }
              })

              showNotification('Update Ready', {
                description: `Version ${update.version} has been downloaded and is ready to install.`,
                display: 'info',
                action: {
                  label: 'Restart Now',
                  onPress: async () => {
                    const { relaunch } = await import('@tauri-apps/plugin-process')
                    await relaunch()
                  },
                },
              })
            } else {
              console.info('No updates available')
            }
          } catch (error) {
            console.error('Error checking for updates:', error)

            if (error instanceof Error) {
              console.error('Update check error details:', {
                message: error.message,
                stack: error.stack,
                name: error.name,
              })
            }
          }
        }, [])

        useEffect(() => {
          checkForUpdate()
          const interval = setInterval(checkForUpdate, CHECK_INTERVAL)
          return () => clearInterval(interval)
        }, [checkForUpdate])
      }
