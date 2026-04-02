import {
  clearZeroClientData,
  type ClearZeroClientDataOptions,
} from './clearZeroClientData'

const shownErrorKeys = new Set<string>()
const LAST_RELOAD_AT_KEY = 'zero-client-data-last-reload-at'
const REPEAT_WINDOW_MS = 3 * 60 * 1000

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

export type ZeroClientErrorInfo = {
  key: string
  title: string
  description: string
  /** reload the page (marks error timestamp) */
  reload: () => void
  /** true if a recent reload already happened (user should be offered a hard reset) */
  shouldOfferReset: boolean
  /** clear client data and reload */
  reset: () => Promise<void>
}

export type ShowZeroClientErrorOptions = {
  key?: string
  title?: string
  description: string
  /** app-specific handler — receives error info and action helpers */
  onError: (info: ZeroClientErrorInfo) => void
  /** options passed to clearZeroClientData when reset is triggered */
  clearOptions?: ClearZeroClientDataOptions
}

export function showZeroClientErrorOnce({
  key = 'client-data-error',
  title = 'Data Error',
  description,
  onError,
  clearOptions,
}: ShowZeroClientErrorOptions) {
  if (shownErrorKeys.has(key)) return

  shownErrorKeys.add(key)

  const shouldOfferReset = Date.now() - getLastReloadAt() <= REPEAT_WINDOW_MS

  markErrorShown()

  onError({
    key,
    title,
    description,
    shouldOfferReset,
    reload() {
      markErrorShown()
      window.location.reload()
    },
    async reset() {
      await clearZeroClientData(clearOptions)
    },
  })
}

export function resetShownZeroClientError(key = 'client-data-error') {
  shownErrorKeys.delete(key)
}
