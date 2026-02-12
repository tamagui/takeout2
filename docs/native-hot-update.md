---
name: takeout-native-hot-update
description: Native hot update (OTA/over-the-air) system guide for @take-out/native-hot-update. Use for HotUpdaterSplash, splash screen, deploy-hot-update scripts, update issues, or troubleshooting OTA updates.
---

# Native Hot Update System

## Overview

The app uses hot updates to deploy code changes to production without requiring
app store submissions. Updates are checked on app start and applied
automatically or after user confirmation.

## Architecture

### Package

Located at packages/native-hot-update, this is a reusable package that provides:

- Instance-based API via createHotUpdater()
- Pluggable storage interface (get/set/delete)
- Timeout protection (5s soft, 20s hard)
- Progress tracking during downloads
- Alert handling for critical updates

### Integration

Located at src/features/hot-updater, this integrates the package with the app:

- useHotUpdater hook with PostHog feature flags
- HotUpdaterSplash component for app initialization
- Analytics tracking for update events

## Update Flow

### On App Start

1. HotUpdaterSplash component renders
2. useHotUpdater hook checks PostHog feature flags
3. If enabled, queries update server for available updates
4. Shows splash screen during download with progress indicator
5. After timeout or completion, displays app content

### Update Types

Critical updates reload immediately if user hasn't accessed the app yet. If the
user is already in the app, an alert prompts them to reload now or later.

Non-critical updates download silently and apply on the next app restart.

Rollback updates check if a pre-release bundle is active and skip if the current
version is newer.

## Configuration

### Feature Flags

Controlled via PostHog:

- ENABLE_HOT_UPDATES: Master on/off switch
- HOT_UPDATE_SERVER_URL (optional): Override server URL dynamically (takes effect same session)

Default server URL is set via `DEFAULT_HOT_UPDATE_SERVER_URL` in `src/constants/urls.ts`.
If HOT_UPDATE_SERVER_URL is set in PostHog, it's persisted to MMKV and picked up by the
custom resolver on the next update check (no app restart required).

### Environment

Required variables in .env:

- HOT_UPDATER_SUPABASE_URL
- HOT_UPDATER_SUPABASE_ANON_KEY
- HOT_UPDATER_SUPABASE_BUCKET_NAME

### Update Strategy

Uses appVersion strategy, which requires runtimeVersion set in app.config.ts to
match the version field.

## Deployment

### Manual

Run deployment scripts for specific platforms:

```
bun tko hot-update ios
bun tko hot-update android
```

### Automated

Two GitHub Actions workflows handle deployments.

Manual deployment via Actions tab:
- Workflow: deploy-hot-update.yml
- Choose platform, channel, and critical flag
- Triggered manually from GitHub Actions UI

Automatic deployment after CI success:
- Workflow: auto-deploy-hot-update.yml
- Runs when CI completes on main branch
- Deploys to production-pre channel
- Non-critical updates only

Required GitHub secrets:
- HOT_UPDATER_SUPABASE_URL
- HOT_UPDATER_SUPABASE_ANON_KEY
- HOT_UPDATER_SUPABASE_BUCKET_NAME

### Channels

- production-pre: Pre-release testing channel
- production: Stable release channel

## Usage

### Basic Integration

```ts
import { HotUpdaterSplash } from '~/features/hot-updater/HotUpdaterSplash'

export function Layout() {
  return (
    <HotUpdaterSplash>
      <App />
    </HotUpdaterSplash>
  )
}
```

The component handles update checks automatically and shows a splash screen
during downloads.

### Custom Behavior

```ts
import { useHotUpdater } from '~/features/hot-updater/useHotUpdater'

export function CustomUpdater() {
  const { userClearedForAccess, progress } = useHotUpdater()

  if (!userClearedForAccess) {
    return <CustomSplash progress={progress} />
  }

  return <App />
}
```

### Debugging

```ts
import { hotUpdater } from '@take-out/native-hot-update'

console.info('Applied OTA:', hotUpdater.getAppliedOta())
console.info('Short ID:', hotUpdater.getShortOtaId())
console.info('Channel:', hotUpdater.getChannel())
console.info('Pending:', hotUpdater.getIsUpdatePending())
```

## Alert Behavior

### Critical Updates

Before user accesses app: Reloads automatically After user accesses app: Shows
alert with "Later" and "Reload Now" options

### Non-Critical Updates

No alerts shown. Updates apply silently on next app restart.

### Rollback Protection

If using a pre-release bundle and a rollback is detected, shows alert: "Update
Skipped - Skipped rollback because you are using a newer pre-release bundle."

## Storage

The package uses a pluggable storage interface. The app provides MMKV storage:

```ts
import { MMKV } from 'react-native-mmkv'
import { createMMKVStorage } from '@take-out/native-hot-update/mmkv'

const mmkv = new MMKV({ id: 'hot-updater' })
const storage = createMMKVStorage(mmkv)
```

Storage persists:

- Bundle IDs per app version
- Pre-release bundle markers
- Update state across app restarts

## Analytics

Update events are automatically tracked via PostHog:

- ota_update_downloaded: When update completes
- ota_update_error: When update fails

Event properties include bundle ID, critical flag, file URL, and error details.

## Timeout Protection

Soft timeout at 5 seconds: Shows app if no update is downloading Hard timeout at
20 seconds: Always shows app regardless of update state

This prevents slow servers or network issues from blocking user access.

## Build Configuration

The hot-updater.config.ts file at the project root configures:

- Build adapter: bare (with Hermes enabled)
- Storage: Supabase
- Database: Supabase
- Update strategy: appVersion

## Platform Support

iOS and Android both supported. Web is a no-op (splash component renders
children immediately).

Updates are deployed per platform and can be triggered independently.

## Security

Updates are served via Supabase with configured access controls. The anon key is
used for read access to the update bundles.

Pre-release updates use a separate channel and are marked in storage to prevent
accidental rollbacks.

## Troubleshooting

### Updates not applying

Check ENABLE_HOT_UPDATES feature flag in PostHog, verify server URL
(DEFAULT_HOT_UPDATE_SERVER_URL in urls.ts or HOT_UPDATE_SERVER_URL in PostHog),
confirm .env.hotupdater has correct credentials.

### Splash screen stuck

Check network connectivity, verify server is responding, review timeout logs.

### Wrong version shown

Use hotUpdater.getAppliedOta() to check current bundle, compare with server to
verify latest version is available.

## References

- Package README: packages/native-hot-update/README.md
- Integration guide: packages/native-hot-update/INTEGRATION.md
