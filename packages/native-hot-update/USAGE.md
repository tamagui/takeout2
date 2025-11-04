# Usage Example for @vxrn/native-hot-update

## Basic Setup

```ts
// src/hotUpdater.ts
import { MMKV } from 'react-native-mmkv'
import { createHotUpdater } from '@vxrn/native-hot-update'
import { createMMKVStorage } from '@vxrn/native-hot-update/mmkv'

const mmkv = new MMKV({ id: 'hot-updater' })

const hotUpdaterInstance = createHotUpdater({
  serverUrl: 'https://your-update-server.com',
  storage: createMMKVStorage(mmkv),
  updateStrategy: 'appVersion',
})

// Export the hook for use in components
export const useOtaUpdater = hotUpdaterInstance.useOtaUpdater

// Export the instance for other methods
export const hotUpdater = hotUpdaterInstance
```

## In Your App Layout

```tsx
// app/_layout.tsx
import { useOtaUpdater } from '~/hotUpdater'

export default function RootLayout() {
  const { userClearedForAccess, progress, isUpdatePending } = useOtaUpdater({
    enabled: true,
    onUpdateDownloaded: (info) => {
      console.info('Update downloaded:', info.id)
    },
    onError: (error) => {
      console.error('Update error:', error)
    },
  })

  if (!userClearedForAccess) {
    return <SplashScreen progress={progress} />
  }

  return <AppContent />
}
```

## Version Display

```tsx
import { hotUpdater } from '~/hotUpdater'
import * as Application from 'expo-application'

export function VersionBadge() {
  const otaId = hotUpdater.getShortOtaId()
  const channel = hotUpdater.getChannel()

  return (
    <Text>
      v{Application.nativeApplicationVersion}
      {otaId && ` (${otaId})`}
      {' • '}{channel}
    </Text>
  )
}
```

## Dev Tools

```tsx
import { hotUpdater } from '~/hotUpdater'
import { Button, View, Text, Alert } from 'react-native'

export function DevUpdateTools() {
  const handleCheckUpdate = async () => {
    const update = await hotUpdater.checkForUpdate()
    if (update) {
      Alert.alert('Update available!', `Bundle: ${update.id}`, [
        { text: 'Later', style: 'cancel' },
        { text: 'Reload Now', onPress: () => hotUpdater.reload() },
      ])
    } else {
      Alert.alert('No updates', 'You are on the latest version')
    }
  }

  const handleCheckPreRelease = async () => {
    const update = await hotUpdater.checkForUpdate({
      channel: 'production-pre',
      isPreRelease: true,
    })
    if (update) {
      Alert.alert('Pre-release found!', `Bundle: ${update.id}`, [
        { text: 'Later', style: 'cancel' },
        { text: 'Reload Now', onPress: () => hotUpdater.reload() },
      ])
    }
  }

  return (
    <View style={{ padding: 20, gap: 10 }}>
      <Text>Current: {hotUpdater.getAppliedOta() || 'Native Build'}</Text>
      <Text>Channel: {hotUpdater.getChannel()}</Text>
      <Text>Bundle ID: {hotUpdater.getBundleId()}</Text>

      <Button title="Check for Update" onPress={handleCheckUpdate} />
      <Button title="Check Pre-Release" onPress={handleCheckPreRelease} />
      <Button title="Reload App" onPress={() => hotUpdater.reload()} />
    </View>
  )
}
```

## With Feature Flags (Example for Fleek/Statsig)

```ts
// src/hotUpdater.ts
import { createHotUpdater } from '@vxrn/native-hot-update'
import { createMMKVStorage } from '@vxrn/native-hot-update/mmkv'
import { MMKV } from 'react-native-mmkv'
import { useStatsigClient } from '~/statsig/client-bindings'

const mmkv = new MMKV({ id: 'hot-updater' })

export function useOtaUpdater() {
  const { client } = useStatsigClient()

  const enabled = client.checkGate('enable_hot_updates')
  const serverUrl = client.getDynamicConfig('hot_update_config').value.url ||
    'https://default-server.com'

  const hotUpdater = createHotUpdater({
    serverUrl,
    storage: createMMKVStorage(mmkv),
    updateStrategy: 'appVersion',
  })

  return hotUpdater.useOtaUpdater({
    enabled,
    onUpdateDownloaded: (info) => {
      // Log to analytics
      analytics.track('ota_update_downloaded', { bundleId: info.id })
    },
    onError: (error) => {
      // Show toast
      showToast('Update failed: ' + error.message)
    },
  })
}
```

## API Reference

### `createHotUpdater(config)`

**Config:**
- `serverUrl`: Your hot-updater server URL
- `storage`: Storage adapter (use `createMMKVStorage(mmkv)`)
- `updateStrategy`: `'appVersion'` | `'fingerprint'` (default: `'appVersion'`)

**Returns:** Instance with methods below

### `useOtaUpdater(options?)`

**Options:**
- `enabled`: boolean (default: true)
- `onUpdateDownloaded`: (info) => void
- `onError`: (error) => void

**Returns:**
- `userClearedForAccess`: boolean - Whether user can access app
- `progress`: number - Download progress (0-100)
- `isUpdatePending`: boolean - Update will apply on restart

### Instance Methods

- `checkForUpdate({ channel?, isPreRelease? })` - Manual update check
- `getAppliedOta()` - Get current OTA bundle ID (or null)
- `getShortOtaId()` - Get short bundle ID
- `getIsUpdatePending()` - Check if update pending
- `reload()` - Reload app
- `getBundleId()` - Get full bundle ID
- `getMinBundleId()` - Get minimum bundle ID
- `getChannel()` - Get current channel
