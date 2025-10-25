/**
 * Feature flag constants for the application
 * These flags control the visibility of features that are not ready for release
 * Now integrated with Statsig for remote configuration
 *
 * Naming Convention (Statsig Best Practices):
 * - Use snake_case for gate names
 * - Use descriptive prefixes: enable_, show_, allow_, use_
 * - Group related features with common prefixes
 * - Keep names clear and self-documenting
 */

export const FEATURE_FLAGS = {
  ENABLE_HOT_UPDATES: 'enable_hot_updates',

  // notification features
  ENABLE_PUSH_NOTIFICATIONS: 'enable_push_notifications',

  // crypto features
  CRYPTO_SHOW_EARNINGS: 'crypto_show_earnings',
  CRYPTO_ENABLE_BUY_BUTTON: 'crypto_enable_buy_button',

  // feed interaction features
  FEED_SHOW_COMMENT_BUTTON: 'feed_show_comment_button',
  FEED_SHOW_MAGIC_WAND: 'feed_show_magic_wand',
  FEED_SHOW_REACTIONS: 'feed_show_reactions',
  FEED_ENABLE_SHARING: 'feed_enable_sharing',

  // auth features
  AUTH_ENABLE_SOCIAL_LOGIN: 'auth_enable_social_login',
  AUTH_ENABLE_PHONE_LOGIN: 'auth_enable_phone_login',

  // profile features
  PROFILE_ENABLE_REPORT_BLOCK: 'profile_enable_report_block',
  PROFILE_ENABLE_ACCOUNT_SWITCHING: 'profile_enable_account_switching',
  PROFILE_ENABLE_CRYPTO_TRADING: 'profile_enable_crypto_trading',
  PROFILE_ENABLE_WALLET: 'profile_enable_wallet',
  PROFILE_ENABLE_TRADING_TABS: 'profile_enable_trading_tabs',
  PROFILE_SHOW_COMPLETION_CARDS: 'profile_show_completion_cards',

  // character features
  CHARACTER_ENABLE: 'character_enable',
  CHARACTER_ENABLE_LIMITS: 'character_enable_limits',

  // waiting list feature
  WAITING_LIST_ENABLE: 'waiting_list_enable',
} as const

export type FeatureFlag = (typeof FEATURE_FLAGS)[keyof typeof FEATURE_FLAGS]

// legacy export for backwards compatibility
export const featureFlags = FEATURE_FLAGS

export const DYNAMIC_CONFIGS = {
  HOT_UPDATE_SERVER_URL: 'hot_update_server_url',
} as const
