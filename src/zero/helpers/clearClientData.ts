import { clearZeroClientData } from 'on-zero'
import { showToast } from '~/interface/toast/Toast'

export const clearClientData = async () => {
  const { zero } = await import('../client')

  await clearZeroClientData({
    closeZero: async () => {
      if (zero && typeof zero.close === 'function') {
        await zero.close()
      }
    },
    onCleared: ({ count, names }) => {
      showToast(
        count > 0
          ? `Cleared ${count} Zero/Replicache databases: ${names.join(', ')}`
          : 'Cleared all IndexedDB databases',
      )
    },
    onError: () => {
      showToast('Error clearing Zero database')
    },
  })
}
