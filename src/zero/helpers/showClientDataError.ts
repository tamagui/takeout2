import { showZeroClientErrorOnce, resetShownZeroClientError } from 'on-zero'

// lazy imports to avoid circular dependency with zero/client
const getShowNotification = () =>
  import('~/interface/notification/Notification').then((m) => m.showNotification)

type ShowClientDataErrorOptions = {
  key?: string
  title?: string
  description: string
}

export async function showClientDataErrorOnce({
  key,
  title,
  description,
}: ShowClientDataErrorOptions) {
  const showNotification = await getShowNotification()

  showZeroClientErrorOnce({
    key,
    title,
    description,
    clearOptions: {
      closeZero: async () => {
        const { zero } = await import('../client')
        if (zero && typeof zero.close === 'function') {
          await zero.close()
        }
      },
    },
    onError(info) {
      showNotification(info.title, {
        description: info.description,
        display: 'error',
        action: info.shouldOfferReset
          ? { label: 'Reset', onPress: () => info.reset() }
          : { label: 'Reload', onPress: () => info.reload() },
      })
    },
  })
}

export { resetShownZeroClientError as resetShownClientDataError }
