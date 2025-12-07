import { useCallback } from 'react'

import { analytics } from '~/features/analytics/analytics'
import { postHog } from '~/posthog/posthog'

/**
 * React hook for PostHog feature flags and analytics
 * Provides a similar interface to the old Statsig client
 */
export const usePostHogClient = () => {
  const checkGate = useCallback((gate: string): boolean => {
    return postHog.isFeatureEnabled(gate, false)
  }, [])

  const logEvent = useCallback((event: string, value?: any) => {
    analytics.track('feature_used', {
      featureName: event,
      context: value ? JSON.stringify(value) : undefined,
    })
  }, [])

  const reloadFeatureFlags = useCallback(async () => {
    await postHog.reloadFeatureFlags()
  }, [])

  return {
    checkGate,
    logEvent,
    getFeatureFlag: (key: string) => postHog.getFeatureFlag(key),
    isFeatureEnabled: (key: string, defaultValue?: boolean) =>
      postHog.isFeatureEnabled(key, defaultValue),
    reloadFeatureFlags,
  }
}
