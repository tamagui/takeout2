import { postHog } from '~/posthog/posthog'

interface UseFeatureFlagOptions {
  defaultValue?: boolean
}

/**
 * Simple hook to check if a feature flag is enabled
 *
 * @example
 * const isEnabled = useFeatureFlag('my_feature')
 *
 * @example
 * const isEnabled = useFeatureFlag('my_feature', { defaultValue: true })
 */
export function useFeatureFlag(flag: string, opts?: UseFeatureFlagOptions): boolean {
  return postHog.isFeatureEnabled(flag, opts?.defaultValue ?? false)
}
