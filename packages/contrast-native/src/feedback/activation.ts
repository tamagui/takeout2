// ---------------------------------------------------------------------------
// activation
//
// opening the overlay is one event regardless of source. the native wrapper's
// three-finger gesture, visible product controls, and future device-level
// capabilities all call `openFeedback()` and share the same enabled/configured
// check.
//
// a device-level source (a physical shake, the operating system's
// screenshot-taken notification) becomes one more caller of this function when
// its platform capability lands, never another branch inside the overlay.
// ---------------------------------------------------------------------------

import { readFeedbackConfig } from './config'
import type { FeedbackConfig } from './types'

type Listener = (config: FeedbackConfig) => void

const listeners = new Set<Listener>()

// returns whether anything opened, so a trigger can skip its haptic and keep
// its own affordance quiet when the app has feedback switched off, has no
// destination configured, or has no overlay mounted.
export function openFeedback(): boolean {
  const config = readFeedbackConfig()
  if (!config || config.enabled === false || listeners.size === 0) return false
  for (const listener of listeners) listener(config)
  return true
}

export function subscribeToFeedbackActivation(listener: Listener): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}
