import { HotUpdater } from '@take-out/native-hot-update'
import * as Application from 'expo-application'
import { memo, useState } from 'react'
import { Alert, Pressable } from 'react-native'
import { SizableText, Spinner, XStack, YStack } from 'tamagui'

import { Button } from '~/interface/buttons/Button'

const INITIAL_OTA_ID = '00000000-0000-0000-0000-000000000000'

/**
 * Debug component showing hot-updater info.
 * Tap 5 times to reveal full details.
 */
export const HotUpdaterDebugInfo = memo(() => {
  const [tapCount, setTapCount] = useState(0)
  const [showDetails, setShowDetails] = useState(false)

  const bundleId = HotUpdater.getBundleId()
  const minBundleId = HotUpdater.getMinBundleId()
  const channel = HotUpdater.getChannel()
  const appVersion = Application.nativeApplicationVersion
  const buildNumber = Application.nativeBuildVersion

  const isOtaApplied = bundleId !== INITIAL_OTA_ID && bundleId !== minBundleId
  const shortBundleId = bundleId?.slice(-12) || 'native'

  const handleTap = () => {
    const newCount = tapCount + 1
    setTapCount(newCount)

    if (newCount >= 5) {
      setShowDetails(true)
      setTapCount(0)
    }
  }

  const handleLongPress = () => {
    const info = `App: ${appVersion} (${buildNumber})
Channel: ${channel}
Bundle: ${bundleId}
Min Bundle: ${minBundleId}
OTA Applied: ${isOtaApplied ? 'Yes' : 'No'}`

    Alert.alert('Hot Updater Info', info, [{ text: 'OK' }])
  }

  if (!showDetails) {
    return (
      <Pressable onPress={handleTap} onLongPress={handleLongPress}>
        <YStack items="center" gap="$1" opacity={0.6}>
          <SizableText size="$1" color="$color10">
            v{appVersion} ({buildNumber})
          </SizableText>
          {isOtaApplied && (
            <SizableText size="$1" color="$green10">
              OTA: {shortBundleId}
            </SizableText>
          )}
        </YStack>
      </Pressable>
    )
  }

  return (
    <YStack
      width={400}
      bg="$color2"
      rounded="$4"
      p="$3"
      gap="$2"
      borderWidth={1}
      borderColor="$color4"
    >
      <SizableText size="$2" fontWeight="bold" color="$color11">
        Hot Updater Debug
      </SizableText>

      <DebugRow label="App Version" value={`${appVersion} (${buildNumber})`} />
      <DebugRow label="Channel" value={channel} />
      <DebugRow label="OTA Applied" value={isOtaApplied ? 'Yes' : 'No'} />
      <DebugRow label="Bundle ID" value={bundleId} mono />
      <DebugRow label="Min Bundle" value={minBundleId} mono />
      <CrashHistoryRow />

      <CheckForUpdateButton />

      <YStack items="center" mt="$2">
        <SizableText size="$1" color="$color9">
          Tap to hide
        </SizableText>
      </YStack>
    </YStack>
  )
})

const CheckForUpdateButton = memo(() => {
  const [isChecking, setIsChecking] = useState(false)
  const [status, setStatus] = useState<string | null>(null)

  const handleCheckForUpdate = async () => {
    setIsChecking(true)
    setStatus(null)

    try {
      const updateInfo = await HotUpdater.checkForUpdate({
        updateStrategy: 'appVersion',
      })

      if (!updateInfo) {
        setStatus('No update available')
        return
      }

      await updateInfo.updateBundle()
      setStatus(`Downloaded: ${updateInfo.id.slice(-12)}`)

      Alert.alert(
        'Update Downloaded',
        `Bundle: ${updateInfo.id.slice(-12)}\nReload to apply.`,
        [
          { text: 'Later', style: 'cancel' },
          { text: 'Reload Now', onPress: () => HotUpdater.reload() },
        ]
      )
    } catch (err) {
      setStatus(`Error: ${err instanceof Error ? err.message : 'Unknown'}`)
    } finally {
      setIsChecking(false)
    }
  }

  const handleClearCrashHistory = () => {
    const result = HotUpdater.clearCrashHistory()
    if (result) {
      setStatus('Crash history cleared')
    } else {
      setStatus('Failed to clear crash history')
    }
  }

  return (
    <YStack gap="$2" mt="$2">
      <Button size="small" onPress={handleCheckForUpdate} disabled={isChecking}>
        {isChecking ? <Spinner size="small" /> : 'Check for Update'}
      </Button>
      <Button size="small" onPress={handleClearCrashHistory}>
        Clear Crash History
      </Button>
      {status && (
        <YStack items="center">
          <SizableText size="$1" color="$color10">
            {status}
          </SizableText>
        </YStack>
      )}
    </YStack>
  )
})

const CrashHistoryRow = memo(() => {
  const crashHistory = HotUpdater.getCrashHistory()
  if (crashHistory.length === 0) return null

  return (
    <YStack gap="$1">
      <SizableText size="$1" color="$red10">
        Crashed Bundles: {crashHistory.length}
      </SizableText>
      {crashHistory.map((id) => (
        <SizableText key={id} size="$1" color="$red9" fontFamily="$mono" ml="$2">
          {id.slice(-12)}
        </SizableText>
      ))}
    </YStack>
  )
})

const DebugRow = memo(
  ({ label, value, mono }: { label: string; value: string; mono?: boolean }) => (
    <XStack justify="space-between" gap="$2">
      <SizableText size="$1" color="$color10">
        {label}
      </SizableText>
      <SizableText
        size="$1"
        color="$color11"
        fontFamily={mono ? '$mono' : undefined}
        numberOfLines={1}
        ellipsizeMode="middle"
      >
        {value}
      </SizableText>
    </XStack>
  )
)
