import { HotUpdater } from '@hot-updater/react-native'

const INITIAL_OTA_ID = '00000000-0000-0000-0000-000000000000'

/**
 * Get the currently applied OTA bundle ID.
 * Returns null if running native build (no OTA applied).
 */
export function getAppliedOta(): string | null {
  const id = HotUpdater.getBundleId()
  if (id === INITIAL_OTA_ID) return null
  if (id === HotUpdater.getMinBundleId()) return null
  return id
}

/**
 * Get a short version of the OTA ID (last 12 characters).
 * Returns null if running native build.
 */
export function getShortOtaId(): string | null {
  const fullId = getAppliedOta()
  return fullId ? fullId.slice(-12) : null
}
