import type { FeedbackConfig } from './types'

// the overlay draws above the app's own provider tree — it has to cover every
// screen, including ones rendered by a nested runtime — so its configuration
// cannot arrive through react context. it is set from the app's native setup
// and snapshotted when one feedback session opens, so a later navigation or
// workspace change cannot reroute a capture already in progress.

let current: FeedbackConfig | null = null
const listeners = new Set<() => void>()

export function configureFeedback(config: FeedbackConfig): void {
  current = config
  for (const listener of listeners) listener()
}

// leaving the surface that owned feedback takes it away with them: a report
// filed against a workspace the user has closed has nowhere to go.
export function clearFeedbackConfig(): void {
  current = null
  for (const listener of listeners) listener()
}

export function readFeedbackConfig(): FeedbackConfig | null {
  return current
}

// `enabled` defaults on: installing the integration is what turns feedback on.
// an app with a user-facing switch reconfigures with `enabled: false`, which
// takes activation away without unmounting anything.
export function isFeedbackEnabled(): boolean {
  return current !== null && current.enabled !== false
}

export function subscribeToFeedbackConfig(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}
