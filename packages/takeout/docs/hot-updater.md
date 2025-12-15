---
name: hot-updater
description: Hot updater guide for OTA updates. Use when implementing @hot-updater/react-native, HotUpdaterProvider, useHotUpdater hook, or deploying over-the-air updates.
---

# Hot Updater Guide

This guide covers the hot update system for delivering over-the-air (OTA)
updates to React Native applications.

## Overview

The hot updater system allows you to push JavaScript bundle updates to deployed
React Native apps without going through the app store review process. This
enables rapid bug fixes and feature deployments.

## Architecture

### Components

1. **@hot-updater/react-native** - React Native client library
2. **HotUpdaterProvider** - React context provider for update management
3. **Feature Flags** - Remote configuration via PostHog
4. **Update Server** - Hosts update bundles (configurable via feature flag)

## Setup

### Installation

The hot-updater package is already installed:

```bash
bun add @hot-updater/react-native
```

### Configuration

In `app.config.ts`:

```typescript
{
  expo: {
    version: "0.0.6",
    runtimeVersion: version, // Required for appVersion strategy
    plugins: [
      [
        "@hot-updater/react-native",
        {
          channel: APP_VARIANT, // development, preview, or production
        }
      ]
    ]
  }
}
```

### Feature Flags

Two feature flags control hot updates:

1. **ENABLE_HOT_UPDATES** - Boolean flag to enable/disable hot updates
2. **HOT_UPDATE_SERVER_URL** - Dynamic config for update server URL

Configure these in PostHog or your feature flag service.

## Implementation

### Provider Setup

Wrap your app with the HotUpdaterProvider:

```tsx
import { HotUpdaterProvider } from '~/features/hot-updater'

function App() {
  return <HotUpdaterProvider>{/* Your app components */}</HotUpdaterProvider>
}
```

### Update Notification UI

Add the notification component to show update prompts:

```tsx
import { HotUpdaterNotification } from '~/features/hot-updater'

function AppLayout() {
  return (
    <>
      {/* Your app content */}
      <HotUpdaterNotification />
    </>
  )
}
```

### Using the Hook

Access hot updater functionality in components:

```tsx
import { useHotUpdater } from '~/features/hot-updater'

function SettingsScreen() {
  const {
    isUpdateAvailable,
    isDownloading,
    downloadProgress,
    checkForUpdate,
    applyUpdate,
    lastCheckTime,
  } = useHotUpdater()

  return (
    <View>
      {isUpdateAvailable && <Button onPress={applyUpdate}>Apply Update</Button>}

      <Button onPress={checkForUpdate}>Check for Updates</Button>

      {lastCheckTime && (
        <Text>Last checked: {lastCheckTime.toLocaleString()}</Text>
      )}
    </View>
  )
}
```

## Update Strategy

### Version Management

The app uses the "appVersion" strategy:

- Runtime version matches app version (e.g., "0.0.6")
- Updates are compatible within the same runtime version
- Native changes require a new app store release

### Channels

Updates are distributed through channels based on APP_VARIANT:

- **development** - For development builds
- **preview** - For staging/preview builds
- **production** - For production releases

### Update Check Frequency

- On app launch
- When app returns to foreground
- Every 30 minutes while app is active
- Manual check via UI

## Deployment

### Creating an Update

1. Make JavaScript/asset changes (no native code changes)
2. Build the update bundle:

   ```bash
   eas update --branch [branch-name] --message "[update message]"
   ```

3. The update is automatically distributed to devices

### Update Server

Configure the update server URL via the HOT_UPDATE_SERVER_URL feature flag. The
default server handles:

- Bundle hosting
- Version compatibility checks
- Channel-based distribution
- Download progress tracking

## Monitoring

### Analytics Events

The system tracks these events via PostHog:

- `hot_update_available` - Update detected
- `hot_update_downloaded` - Update downloaded successfully
- `hot_update_check_error` - Error checking for updates
- `hot_update_apply_error` - Error applying update

### Debugging

Enable verbose logging:

```tsx
// In development
console.info('Hot updates enabled:', isEnabled)
console.info('Server URL:', serverUrl)
console.info('Current version:', Updates.currentVersion)
```

## Best Practices

### Do's

1. **Test updates thoroughly** in development/preview channels first
2. **Use feature flags** to control rollout
3. **Monitor analytics** after deploying updates
4. **Keep updates small** - large bundles take longer to download
5. **Version native changes** properly with runtime version bumps

### Don'ts

1. **Don't include native changes** in hot updates
2. **Don't skip testing** in preview environments
3. **Don't force updates** without user consent
4. **Don't update during critical user operations**
5. **Don't ignore error tracking**

## Rollback Strategy

If an update causes issues:

1. **Disable via feature flag** - Turn off ENABLE_HOT_UPDATES
2. **Deploy fix** - Create and test a fix
3. **Roll forward** - Deploy the fix as a new update
4. **Monitor** - Track analytics to ensure issues are resolved
