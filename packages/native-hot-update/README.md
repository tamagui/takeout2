# @take-out/native-hot-update

Minimal, headless React Native hot update library.

## Features

- Simple instance-based API
- Pluggable storage (MMKV, AsyncStorage, custom)
- Timeout protection (5s + 20s hard limit)
- Pre-release testing workflow
- Works with Expo & React Native
- Zero UI - bring your own components

## Installation

```bash
bun add @take-out/native-hot-update react-native-mmkv
```

## Quick Start

### 1. Create Hot Updater Instance

```ts
// src/hotUpdater.ts
import { MMKV } from 'react-native-mmkv'
import { createHotUpdater } from '@take-out/native-hot-update'
import { createMMKVStorage } from '@take-out/native-hot-update/mmkv'

const mmkv = new MMKV({ id: 'hot-updater' })

const hotUpdaterInstance = createHotUpdater({
  serverUrl: 'https://your-update-server.com',
  storage: createMMKVStorage(mmkv),
  updateStrategy: 'appVersion',
})

// Export the hook directly for convenience
export const useOtaUpdater = hotUpdaterInstance.useOtaUpdater
export const hotUpdater = hotUpdaterInstance
```

### 2. Use in Your App

```tsx
// app/_layout.tsx
import { useOtaUpdater } from './hotUpdater'

export default function RootLayout() {
  const { userClearedForAccess, progress } = useOtaUpdater({
    enabled: true,
    onUpdateDownloaded: (info) => {
      console.info('Update downloaded:', info.id)
    },
    onError: (error) => {
      console.error('Update failed:', error)
    },
  })

  if (!userClearedForAccess) {
    return <SplashScreen progress={progress} />
  }

  return <YourApp />
}
```

### 3. Display Version Info

```tsx
import { hotUpdater } from './hotUpdater'
import * as Application from 'expo-application'

export function VersionDisplay() {
  const otaId = hotUpdater.getShortOtaId()
  const channel = hotUpdater.getChannel()

  return (
    <Text>
      v{Application.nativeApplicationVersion}
      {otaId && ` (${otaId})`} • {channel}
    </Text>
  )
}
```

### 4. Dev Tools

```tsx
import { hotUpdater } from './hotUpdater'
import { Button, View, Text, Alert } from 'react-native'

export function DevUpdateTools() {
  const handleCheckUpdate = async () => {
    const update = await hotUpdater.checkForUpdate()
    if (update) {
      Alert.alert('Update available', `ID: ${update.id}`, [
        { text: 'Later' },
        { text: 'Reload', onPress: () => hotUpdater.reload() },
      ])
    } else {
      Alert.alert('No update available')
    }
  }

  const handleCheckPreRelease = async () => {
    const update = await hotUpdater.checkForUpdate({
      channel: 'production-pre',
      isPreRelease: true,
    })
    if (update) {
      Alert.alert('Pre-release available', `ID: ${update.id}`, [
        { text: 'Later' },
        { text: 'Reload', onPress: () => hotUpdater.reload() },
      ])
    }
  }

  return (
    <View>
      <Text>Current: {hotUpdater.getAppliedOta() || 'Native build'}</Text>
      <Text>Channel: {hotUpdater.getChannel()}</Text>
      <Button title="Check for Update" onPress={handleCheckUpdate} />
      <Button title="Check Pre-release" onPress={handleCheckPreRelease} />
      <Button title="Reload App" onPress={() => hotUpdater.reload()} />
    </View>
  )
}
```

## API

### `createHotUpdater(config)`

Creates a hot updater instance.

**Config:**

- `serverUrl` (string): Your hot update server URL
- `storage` (HotUpdateStorage): Storage adapter for persisting state
- `updateStrategy` ('appVersion' | 'fingerprint'): Update strategy (default:
  'appVersion')

**Returns:** `HotUpdaterInstance`

### `useOtaUpdater(options?)`

React hook for automatic update checking.

**Options:**

- `enabled` (boolean): Enable/disable update checking (default: true)
- `onUpdateDownloaded` (function): Callback when update is downloaded
- `onError` (function): Callback on error

**Returns:**

- `userClearedForAccess` (boolean): Whether user can access app
- `progress` (number): Download progress (0-100)
- `isUpdatePending` (boolean): Whether update will apply on restart

### Instance Methods

- `checkForUpdate(options?)` - Manually check for updates
- `getAppliedOta()` - Get current OTA bundle ID
- `getShortOtaId()` - Get short OTA ID
- `getIsUpdatePending()` - Check if update is pending
- `reload()` - Reload app
- `getBundleId()` - Get current bundle ID
- `getMinBundleId()` - Get minimum bundle ID
- `getChannel()` - Get current channel
