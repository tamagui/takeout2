import { globalEffect } from '@vxrn/helpers'
import { clearIndexedDB } from '~/helpers/storage/clearAllDataAndStorages'
import { dialogConfirm } from '~/interface/dialogs/actions'
import { showNotificationToast } from '~/interface/notification/NotificationToast'
import { zeroEvents } from '~/zero/client'

let connectionFailures = 0

globalEffect('zero-client', () => {
  const handleZeroError = (errorMessage: string) => {
    showNotificationToast(`Data Error`, {
      description: errorMessage,
      display: 'error',
      exclusiveKey: 'zero-error',
      action: {
        label: `Clear`,
        async onPress() {
          if (
            await dialogConfirm({
              title: `Delete caches and reload?`,
              description: `This will clear your local Zero database and reload the app.`,
            })
          ) {
            await clearIndexedDB()
            window.location.reload()
          }
        },
      },
    })
  }

  const unsubscribeZero = zeroEvents.listen((value) => {
    if (!value) return
    switch (value.type) {
      case 'error': {
        // this happens too often and isn't always a problem
        if (value.message.includes(`Failed to connect`)) {
          connectionFailures++
          if (connectionFailures > 3) {
            handleZeroError(value.message)
          }
          return
        }

        if (
          value.message.includes(`unexpected poke error`) ||
          value.message.includes(`failed`) ||
          value.message.includes(`ref count update must be non-negative`)
        ) {
          handleZeroError(value.message)
        }
        break
      }
    }
  })

  return () => {
    unsubscribeZero()
  }
})
