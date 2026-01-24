# Feature Flags

Minimal feature flag implementation for the demo app using PostHog.

Note: these are not SSR-safe, so only use them on SPA/app features, not site features.

## Quick Start

```tsx
import { useFeatureFlag, FEATURE_FLAGS } from '~/features/feature-flags'

function MyComponent() {
  const isEnabled = useFeatureFlag('my_feature')

  // With default value
  const showBeta = useFeatureFlag('beta_feature', { defaultValue: false })

  return (
    <>
      {isEnabled && <NewFeature />}
      {showBeta && <BetaFeature />}
    </>
  )
}
```

## Available Flags

- `FEATURE_FLAGS.ENABLE_HOT_UPDATES` - Controls hot update functionality

## Adding New Flags

1. Add the flag constant to `featureFlags.ts`:

```ts
export const FEATURE_FLAGS = {
  MY_NEW_FEATURE: 'my_new_feature',
} as const
```

2. Configure the flag in PostHog dashboard

3. Use the flag in your component:

```tsx
const isEnabled = useFeatureFlag(FEATURE_FLAGS.MY_NEW_FEATURE)
```

## Architecture

- **PostHog Integration**: Feature flags are managed via PostHog
- **Simple Hook**: `useFeatureFlag(flag, opts?)` - minimal API surface
- **Type Safe**: All flags are defined as constants
- **Default Values**: Support for fallback values when flag is not available

## PostHog Configuration

Feature flags are configured in the PostHog dashboard. The `useFeatureFlag` hook
will automatically check the flag status via PostHog's SDK.
