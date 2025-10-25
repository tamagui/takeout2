import { useCallback } from 'react'
import { postHog } from '~/posthog/posthog'
import { analytics } from '~/features/analytics/analytics'

/**
 * React hook for PostHog feature flags and analytics
 * Provides a similar interface to the old Statsig client
 */
export const usePostHogClient = () => {
  const checkGate = useCallback((gate: string): boolean => {
    return postHog.isFeatureEnabled(gate, false)
  }, [])

  const logEvent = useCallback((event: string, value?: any) => {
    // Log to analytics
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
    client: {
      checkGate,
      logEvent,
      getFeatureFlag: (key: string) => postHog.getFeatureFlag(key),
      isFeatureEnabled: (key: string, defaultValue?: boolean) =>
        postHog.isFeatureEnabled(key, defaultValue),
    },
    reloadFeatureFlags,
  }
}

// Alias for backward compatibility with old code
export const useStatsigClient = usePostHogClient
export const useStatsig = usePostHogClient
export const usePostHog = usePostHogClient
