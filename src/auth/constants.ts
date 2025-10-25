/**
 * Scheme of the native app, should be the same as the scheme in `app.json`.
 */
export const APP_SCHEME = 'onechat'

// Auth constants
export const MIN_ONBOARDING_STEPS = 2
export const MAX_ONBOARDING_STEPS = 5

export enum OnboardingStep {
  Username = 'username',
  Profile = 'profile',
  Complete = 'complete',
}

// Phone authentication constants
export const PHONE_REGISTERED_USER_FAKE_EMAIL_DOMAIN = 'phone.local'

// Feature flags
export const shouldUsePasswordOnlyAuth = false
