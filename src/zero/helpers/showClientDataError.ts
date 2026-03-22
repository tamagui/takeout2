// lazy imports to avoid circular dependency with zero/client
const getShowNotification = () =>
  import('~/interface/notification/Notification').then((m) => m.showNotification)

const getClearClientData = () =>
  import('~/zero/helpers/clearClientData').then((m) => m.clearClientData)

const shownErrorKeys = new Set<string>()
const LAST_RELOAD_AT_KEY = 'zero-client-data-last-reload-at'
const REPEAT_WINDOW_MS = 3 * 60 * 1000

type ShowClientDataErrorOptions = {
  key?: string
  title?: string
  description: string
}

function getLastReloadAt() {
  if (typeof window === 'undefined') return 0
  const raw = window.localStorage.getItem(LAST_RELOAD_AT_KEY)
  const parsed = Number(raw || 0)
  return Number.isFinite(parsed) ? parsed : 0
}

function markErrorShown() {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(LAST_RELOAD_AT_KEY, String(Date.now()))
}

export async function showClientDataErrorOnce({
  key = 'client-data-error',
  title = 'Data Error',
  description,
}: ShowClientDataErrorOptions) {
  if (shownErrorKeys.has(key)) {
    return
  }

  shownErrorKeys.add(key)

  const shouldShowClear = Date.now() - getLastReloadAt() <= REPEAT_WINDOW_MS

  markErrorShown()

  const showNotification = await getShowNotification()
  showNotification(title, {
    description,
    display: 'error',
    action: shouldShowClear
      ? {
          label: 'Reset',
          async onPress() {
            const clearClientData = await getClearClientData()
            await clearClientData()
          },
        }
      : {
          label: 'Reload',
          onPress() {
            markErrorShown()
            window.location.reload()
          },
        },
  })
}

export function resetShownClientDataError(key = 'client-data-error') {
  shownErrorKeys.delete(key)
}
