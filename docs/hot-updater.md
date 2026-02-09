---
name: takeout-hot-updater
description: Guide for implementing OTA updates and hot updates in React Native apps. hot updater, OTA updates, over-the-air updates, app updates, code push, deploy updates, @hot-updater/react-native, HotUpdater.wrap, useHotUpdater, update deployment, clearCrashHistory, crash history.
---

# Hot Updater Guide

This guide covers the hot update system for delivering over-the-air (OTA)
updates to React Native applications using `@hot-updater/react-native` and the
`@take-out/native-hot-update` helper package.

## Overview

The hot updater system allows you to push JavaScript bundle updates to deployed
React Native apps without going through the app store review process.

## Architecture

### Components

1. **@hot-updater/react-native** - React Native client library (v0.25.x+)
2. **@take-out/native-hot-update** - Takeout helper package wrapping
   hot-updater with MMKV storage, timeout protection, and pre-release support
3. **HotUpdater.wrap()** - HOC that initializes config and crash protection
4. **Feature Flags** - Remote configuration via PostHog
5. **Supabase** - Backend for bundle storage and database

### Key Files

- `hot-updater.config.ts` - server-side config for deploy command
- `app.config.ts` - expo plugin config with channel
- `vite.config.ts` - babel plugins via `babelConfigOverrides`
- `src/features/hot-updater/HotUpdaterSplash.native.tsx` - HotUpdater.wrap()
- `src/features/hot-updater/useHotUpdater.ts` - hook with PostHog integration
- `src/features/hot-updater/HotUpdaterDebugInfo.native.tsx` - debug panel
- `packages/native-hot-update/` - @take-out/native-hot-update package

## Initial Setup (Supabase Backend)

### Prerequisites

- Docker or OrbStack installed
- Supabase CLI
- Active Supabase account

### 1. Install dependencies

```bash
bun add hot-updater --dev
bun add @hot-updater/react-native @hot-updater/bare @hot-updater/supabase
```

### 2. Login to Supabase and initialize

```bash
npx -y supabase login
npx hot-updater init
```

During `hot-updater init`, select:

- **Build plugin**: `Bare` (required for our Metro/Expo setup)
- **Storage/Database**: `Supabase`

This generates `hot-updater.config.ts` and sets up Supabase tables/storage.

### 3. Environment variables

Create `.env.hotupdater` with values from `hot-updater init`:

```
HOT_UPDATER_SUPABASE_URL=https://your-project-id.supabase.co
HOT_UPDATER_SUPABASE_ANON_KEY=your-anon-key
HOT_UPDATER_SUPABASE_BUCKET_NAME=your-bucket-name
```

### 4. Expo plugin configuration

In `app.config.ts`:

```typescript
plugins: [
  [
    "@hot-updater/react-native",
    { channel: APP_VARIANT } // development, preview, or production
  ]
]
```

### 5. Babel plugins

Babel plugins are configured in `vite.config.ts` via `babelConfigOverrides`
(no separate `babel.config.js` needed):

- `babel-plugin-react-compiler` - must run first
- `hot-updater/babel-plugin` - hot updater transform
- `react-native-reanimated/plugin` - must be last

## Implementation

### HotUpdater.wrap() (required)

`HotUpdater.wrap()` must wrap a component early in the app tree. It initializes
the native module and enables crash protection via `notifyAppReady`.

```tsx
import { HotUpdater } from '@take-out/native-hot-update'

const SplashContent = ({ children }: { children?: React.ReactNode }) => {
  const { userClearedForAccess, progress } = useHotUpdater()
  if (!userClearedForAccess) return <SplashScreen progress={progress} />
  return <>{children}</>
}

export const HotUpdaterSplash = HotUpdater.wrap({
  baseURL: DEFAULT_HOT_UPDATE_SERVER_URL,
  updateMode: 'manual',
})(SplashContent)
```

### useHotUpdater hook (with PostHog)

```tsx
import { createHotUpdater } from '@take-out/native-hot-update'
import { createMMKVStorage } from '@take-out/native-hot-update/mmkv'

export function useHotUpdater() {
  const posthog = usePostHogClient()
  const isEnabled = posthog?.isFeatureEnabled(FEATURE_FLAGS.ENABLE_HOT_UPDATES) ?? false
  const serverUrl = posthog?.getFeatureFlag(DYNAMIC_CONFIGS.HOT_UPDATE_SERVER_URL) as string || ''

  const hotUpdater = createHotUpdater({
    serverUrl,
    storage: createMMKVStorage(mmkv),
    updateStrategy: 'appVersion',
  })

  return hotUpdater.useOtaUpdater({
    enabled: isEnabled && !!serverUrl,
  })
}
```

### Feature Flags

Two PostHog feature flags control hot updates:

1. **ENABLE_HOT_UPDATES** - boolean to enable/disable
2. **HOT_UPDATE_SERVER_URL** - dynamic config for server URL

## Update Strategy

### Version Management

Uses the "appVersion" strategy:

- Runtime version matches app version
- Updates are compatible within the same runtime version
- Native changes require a new app store release

### Channels

Based on APP_VARIANT: `development`, `preview`, `production`

## Deployment

### Deploy an update

```bash
# iOS
tko hot-update ios

# Android
tko hot-update android
```

Or directly:

```bash
npx hot-updater deploy --platform ios --channel production
npx hot-updater deploy --platform android --channel production
```

## Crash Protection and Rollback

### How it works (v0.25.x+)

1. When a bundle is applied, it's tracked as "staging"
2. `HotUpdater.wrap()` calls `notifyAppReady` internally on successful launch
3. `notifyAppReady` promotes the bundle to "stable"
4. If the app crashes before `notifyAppReady`, the bundle goes to crash history
5. Crashed bundles are blocked from being re-applied

### Crash history management

```typescript
// clear crash history to retry blocked bundles
HotUpdater.clearCrashHistory()

// inspect crashed bundles
const crashedBundles = HotUpdater.getCrashHistory()
```

### Rollback strategy

1. **Automatic** - crashed bundles roll back to the previous stable bundle
2. **Feature flag** - disable ENABLE_HOT_UPDATES to stop all OTA updates
3. **Deploy fix** - push a corrected bundle via `hot-updater deploy`

## Monitoring

### PostHog events

- `hot_update_downloaded` - update downloaded
- `hot_update_check_error` - error checking for updates

### Debug panel

Tap version info 5 times to reveal the debug panel showing:

- bundle ID, channel, OTA status
- crash history
- manual update check and crash history clear buttons

## Best Practices

### Do's

1. **Test updates thoroughly** in development/preview channels first
2. **Use feature flags** to control rollout
3. **Monitor analytics** after deploying updates
4. **Keep updates small** - large bundles take longer to download
5. **Version native changes** properly with runtime version bumps
6. **Import HotUpdater from `@take-out/native-hot-update`** - ensures single instance

### Don'ts

1. **Don't include native changes** in hot updates
2. **Don't skip testing** in preview environments
3. **Don't force updates** without user consent
4. **Don't update during critical user operations**
5. **Don't ignore error tracking**
6. **Don't import HotUpdater from `@hot-updater/react-native` directly in app code** - use the package re-export
