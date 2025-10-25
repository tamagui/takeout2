# Feature Flags Implementation Guide

This directory contains the Statsig-powered feature flag system for controlling feature visibility across different environments. Feature flags allow us to ship code to production while keeping unfinished features hidden until they're ready.

## Table of Contents

- [Quick Start](#quick-start)
- [Architecture Overview](#architecture-overview)
- [Creating a New Feature Flag](#creating-a-new-feature-flag)
- [Using Feature Flags in Components](#using-feature-flags-in-components)
- [Environment Configuration](#environment-configuration)
- [Managing Gates in Statsig](#managing-gates-in-statsig)
- [Testing Feature Flags](#testing-feature-flags)
- [Troubleshooting](#troubleshooting)

## Quick Start

### 1. Check a Single Feature Flag

```tsx
import { FEATURE_FLAGS, useFeatureFlag } from '~/features/feature-flags'

function MyComponent() {
  const showComments = useFeatureFlag(FEATURE_FLAGS.FEED_SHOW_COMMENT_BUTTON)
  
  return (
    <>
      {showComments && <CommentSection />}
    </>
  )
}
```

### 2. Check Multiple Feature Flags

```tsx
import { FEATURE_FLAGS, useFeatureFlags } from '~/features/feature-flags'

function MyComponent() {
  const features = useFeatureFlags({
    showComments: FEATURE_FLAGS.FEED_SHOW_COMMENT_BUTTON,
    showReactions: FEATURE_FLAGS.FEED_SHOW_REACTIONS,
    showSharing: FEATURE_FLAGS.FEED_ENABLE_SHARING
  })
  
  return (
    <>
      {features.showComments && <CommentSection />}
      {features.showReactions && <ReactionsBar />}
      {features.showSharing && <ShareButton />}
    </>
  )
}
```

## Architecture Overview

### File Structure

```
src/features/feature-flags/
├── featureFlags.ts           # Feature flag constants
├── useFeatureFlag.ts          # React hooks for checking flags
├── statsigApiHelper.ts        # Helper utilities for Statsig API
├── STATSIG_GATE_NAMES.md     # Documentation of gate names
├── STATSIG_TESTING_GUIDE.md  # Testing guide for Statsig
├── TROUBLESHOOTING.md         # Common issues and solutions
└── README.md                  # This file
```

### Integration Points

1. **Statsig Provider** - Initialized in `/app/_layout.native.tsx`
2. **Environment Detection** - Automatically sets tier based on `__DEV__`
3. **MMKV Storage** - Persists flag states locally for offline support

## Creating a New Feature Flag

### Step 1: Add the Flag Constant

Edit `src/features/feature-flags/featureFlags.ts`:

```typescript
export const FEATURE_FLAGS = {
  // ... existing flags
  
  // Add your new flag with descriptive naming
  MY_NEW_FEATURE: 'my_new_feature', // use snake_case for Statsig
} as const
```

### Step 2: Add to V0_FEATURE_GATES

Edit `src/features/feature-flags/statsigApiHelper.ts`:

```typescript
export const V0_FEATURE_GATES: StatsigGateConfig[] = [
  // ... existing gates
  
  {
    name: 'my_new_feature',
    displayName: 'My New Feature',
    description: 'Controls the visibility of my new feature',
    environmentRules: {
      development: true,    // Enabled in dev
      staging: false,       // Disabled in staging
      production: false,    // Disabled in production
    },
  },
]
```

### Step 3: Generate and Run Setup Script

```bash
# Generate the configuration
bun run ./scripts/setup-feature-flags.ts

# This creates ./scripts/create-statsig-gates.ts
# Run it with your Statsig Console API key
STATSIG_CONSOLE_API_KEY=your_key bun run ./scripts/create-statsig-gates.ts
```

### Step 4: Use in Your Component

```tsx
import { FEATURE_FLAGS, useFeatureFlag } from '~/features/feature-flags'

function MyNewFeature() {
  const isEnabled = useFeatureFlag(FEATURE_FLAGS.MY_NEW_FEATURE)
  
  if (!isEnabled) return null
  
  return <YourNewFeatureComponent />
}
```

## Environment Configuration

### Default Configuration

All feature flags follow this pattern:

| Environment | Status | Description |
|------------|--------|-------------|
| Development | ✅ Enabled | Features visible for testing |
| Staging | ❌ Disabled | Hidden from staging users |
| Production | ❌ Disabled | Hidden from production users |

### Environment Detection

The app automatically detects the environment:

```typescript
// In app/_layout.native.tsx
environment: { tier: __DEV__ ? 'development' : 'production' }
```

### Manual Override (Statsig Console)

1. Go to [Statsig Console](https://console.statsig.com/)
2. Navigate to Feature Gates
3. Select your gate
4. Modify the rules or percentages
5. Changes apply immediately without app deployment

## Managing Gates in Statsig

### Manual Creation

1. Go to [Statsig Console](https://console.statsig.com/)
2. Navigate to **Feature Gates** → **Create Gate**
3. Enter:
   - **Gate Name**: Use snake_case (e.g., `my_new_feature`)
   - **Display Name**: Human readable (e.g., "My New Feature")
   - **Description**: What the feature controls
4. Add Rules:
   - Development: 100% pass
   - Staging: 0% pass
   - Production: 0% pass
   - Default: 0% pass

### Programmatic Creation

Use the generated script:

```bash
# Set your API key
export STATSIG_CONSOLE_API_KEY=console-YOUR_KEY_HERE

# Run the creation script
bun run ./scripts/create-statsig-gates.ts
```

### Bulk Management

To update all gates at once:

```typescript
// In scripts/setup-feature-flags.ts
// Modify V0_FEATURE_GATES configuration
// Then regenerate and run the script
```

## Testing Feature Flags

### Development Testing

In development, all features are enabled by default. To test disabled state:

1. **Option 1**: Temporarily modify environment tier
   ```typescript
   environment: { tier: 'production' } // Forces production rules
   ```

2. **Option 2**: Use Statsig Console overrides
   - Go to your gate in Statsig Console
   - Add a user override for testing
   - Set to "Fail" to test disabled state

### Production Testing

To enable features for specific users in production:

1. Go to Statsig Console
2. Select the gate
3. Add **User Overrides**:
   ```
   User ID: specific_user_id
   Override: Pass ✅
   ```

### Debugging

Check feature flag values in console:

```typescript
// Add temporary debug logging
const features = useFeatureFlags({
  showComments: FEATURE_FLAGS.FEED_SHOW_COMMENT_BUTTON,
  showReactions: FEATURE_FLAGS.FEED_SHOW_REACTIONS,
})
console.info('Feature flags:', features)
```

## Troubleshooting

### Common Issues

#### 1. "FAIL (Default)" Message

This is **normal** for disabled features. It means:
- Gate returned `false` (feature is disabled)
- Using the default rule (no conditions matched)

#### 2. Changes Not Reflecting

1. Force refresh the app (pull to refresh)
2. Clear MMKV cache if needed
3. Check network connectivity
4. Verify Statsig SDK is initialized

#### 3. Feature Shows in Production

Check:
- Environment tier is correctly set
- No user overrides in Statsig Console
- Default rule is set to 0%

#### 4. API Script Fails

If you get "Forbidden" errors:
- Verify API key has write permissions
- Use Console API key, not Client SDK key
- Check API key hasn't expired

### Useful Commands

```bash
# Check current feature flags
bun run ./scripts/setup-feature-flags.ts

# Regenerate API script
bun run ./scripts/setup-feature-flags.ts

# Run type checks
bun types:check

# Run linter
bun lint:fix
```

## Current Feature Flags

| Flag | Description | Category |
|------|-------------|----------|
| `enable_push_notifications` | Push notification system | Notifications |
| `crypto_show_earnings` | Crypto earnings display | Crypto |
| `crypto_enable_buy_button` | Crypto purchase functionality | Crypto |
| `feed_show_comment_button` | Comment button on posts | Feed |
| `feed_show_magic_wand` | AI/magic wand interaction | Feed |
| `feed_show_reactions` | Emoji reactions on posts | Feed |
| `feed_enable_sharing` | Post sharing functionality | Feed |
| `auth_enable_social_login` | Google/Apple login options | Auth |
| `auth_enable_phone_login` | Phone number login option | Auth |

## Best Practices

1. **Naming Convention**: Use snake_case for gate names
2. **Descriptive Names**: Use prefixes like `enable_`, `show_`, `allow_`
3. **Group Related Features**: Use common prefixes (e.g., `feed_`, `auth_`)
4. **Default to Disabled**: New features should be disabled by default
5. **Document Changes**: Update this README when adding new flags
6. **Test Both States**: Always test enabled and disabled states
7. **Clean Up**: Remove flags for features that are permanently enabled

## Resources

- [Statsig Documentation](https://docs.statsig.com/)
- [Statsig Console](https://console.statsig.com/)
- [React Native Integration Guide](https://docs.statsig.com/client/javascript-sdk/expo/)
- [API Documentation](https://docs.statsig.com/console-api/gates)

## Support

For issues or questions:
1. Check `TROUBLESHOOTING.md` for common issues
2. Review `STATSIG_TESTING_GUIDE.md` for testing scenarios
3. Contact the development team for Statsig access or API keys