/**
 * Feature flag constants for the application
 * Minimal set for a simple feed demo app
 * Managed via PostHog feature flags
 */

export const FEATURE_FLAGS = {
  ENABLE_HOT_UPDATES: 'enable_hot_updates',
} as const

export type FeatureFlag = (typeof FEATURE_FLAGS)[keyof typeof FEATURE_FLAGS]

export const DYNAMIC_CONFIGS = {
  HOT_UPDATE_SERVER_URL: 'hot_update_server_url',
} as const
