import { createStorageValue } from '@o/helpers'
import { useCallback, useSyncExternalStore } from 'react'

// whether this device may open the feedback overlay. it is on until the user
// turns it off, and the choice is remembered across launches.
//
// the switch controls availability only. nothing is read from the screen and
// nothing is sent while it is on; that happens when the user opens the overlay
// and presses send.
const storage = createStorageValue<boolean>('feedback-enabled')
const listeners = new Set<() => void>()

let enabled = storage.get() ?? true

export function isFeedbackSettingEnabled(): boolean {
  return enabled
}

export function setFeedbackSettingEnabled(next: boolean): void {
  enabled = next
  storage.set(next)
  for (const listener of listeners) listener()
}

export function subscribeToFeedbackSetting(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function useFeedbackSetting() {
  const value = useSyncExternalStore(
    subscribeToFeedbackSetting,
    isFeedbackSettingEnabled,
    () => true,
  )
  return {
    enabled: value,
    setEnabled: useCallback((next: boolean) => setFeedbackSettingEnabled(next), []),
  }
}
