import { HotUpdater, useHotUpdaterStore } from '@hot-updater/react-native'
import * as Application from 'expo-application'
import { useEffect, useRef, useState } from 'react'
import { Alert } from 'react-native'

import type { HotUpdaterConfig, HotUpdaterInstance, UpdateInfo } from './types'

const INITIAL_OTA_ID = '00000000-0000-0000-0000-000000000000'
const BUNDLE_ID_KEY_PREFIX = 'hotUpdater.bundleId'
const PRE_RELEASE_BUNDLE_ID_KEY = 'hotUpdater.preReleaseBundleId'

/**
 * Creates a HotUpdater instance with custom hooks and helpers.
 * NOTE: Requires HotUpdater.wrap() to be called first (e.g., in HotUpdaterSplash).
 */
export function createHotUpdater(config: HotUpdaterConfig): HotUpdaterInstance {
  const { storage, updateStrategy = 'appVersion' } = config

  let isUpdatePending = false

  const getAppliedOta = (): string | null => {
    const id = HotUpdater.getBundleId()
    if (id === INITIAL_OTA_ID) return null
    if (id === HotUpdater.getMinBundleId()) return null
    return id
  }

  const getShortOtaId = (): string | null => {
    const fullId = getAppliedOta()
    return fullId ? fullId.slice(-12) : null
  }

  const getIsUpdatePending = (): boolean => {
    return isUpdatePending
  }

  const getPreReleaseBundleId = (): string | undefined => {
    return storage.get(PRE_RELEASE_BUNDLE_ID_KEY)
  }

  const handleUpdateDownloaded = (
    id: string,
    options: { isPreRelease?: boolean } = {}
  ) => {
    const appVersion = Application.nativeApplicationVersion
    if (appVersion) {
      storage.set(`${BUNDLE_ID_KEY_PREFIX}.${appVersion}`, id)
    }

    if (options.isPreRelease) {
      storage.set(PRE_RELEASE_BUNDLE_ID_KEY, id)
    } else {
      storage.delete(PRE_RELEASE_BUNDLE_ID_KEY)
    }

    isUpdatePending = true
  }

  /**
   * Hook that checks for OTA updates with timeout protection.
   * Returns userClearedForAccess which controls when to show the app.
   */
  const useOtaUpdater = (
    options: {
      enabled?: boolean
      onUpdateDownloaded?: (info: UpdateInfo) => void
      onError?: (error: unknown) => void
    } = {}
  ) => {
    const {
      enabled = true,
      onUpdateDownloaded: onUpdateDownloadedCallback,
      onError,
    } = options

    const progress = useHotUpdaterStore((state) => state.progress)
    const isUpdating = progress > 0.01

    const [isUserClearedForAccess, setIsUserClearedForAccess] = useState(false)
    const isUserClearedForAccessRef = useRef(isUserClearedForAccess)
    isUserClearedForAccessRef.current = isUserClearedForAccess

    // 5s timeout if no update started
    useEffect(() => {
      if (!isUpdating) {
        const timer = setTimeout(() => {
          if (!isUserClearedForAccessRef.current) {
            setIsUserClearedForAccess(true)
          }
        }, 5000)
        return () => clearTimeout(timer)
      }
      return undefined
    }, [isUpdating])

    // 20s hard timeout
    useEffect(() => {
      const timer = setTimeout(() => {
        if (!isUserClearedForAccessRef.current) {
          setIsUserClearedForAccess(true)
        }
      }, 20000)
      return () => clearTimeout(timer)
    }, [])

    // Update check
    useEffect(() => {
      let shouldContinue = true

      ;(async () => {
        try {
          if (!enabled) {
            setIsUserClearedForAccess(true)
            return
          }

          if (!shouldContinue) return

          const updateInfo = await HotUpdater.checkForUpdate({
            updateStrategy,
          })

          if (!updateInfo) {
            setIsUserClearedForAccess(true)
            return
          }

          if (!shouldContinue) return

          // Handle rollback for pre-release bundles
          if (updateInfo.status === 'ROLLBACK') {
            const preReleaseBundleId = getPreReleaseBundleId()
            const currentBundleId = HotUpdater.getBundleId()

            if (
              preReleaseBundleId &&
              preReleaseBundleId === currentBundleId &&
              currentBundleId > updateInfo.id
            ) {
              Alert.alert(
                'Update Skipped',
                'Skipped rollback because you are using a newer pre-release bundle.'
              )
              setIsUserClearedForAccess(true)
              return
            }
          }

          if (!updateInfo.shouldForceUpdate) {
            setIsUserClearedForAccess(true)
          }

          if (!shouldContinue) return

          await updateInfo.updateBundle()
          handleUpdateDownloaded(updateInfo.id)

          const info: UpdateInfo = {
            id: updateInfo.id,
            isCriticalUpdate: updateInfo.shouldForceUpdate,
            fileUrl: updateInfo.fileUrl,
            message: updateInfo.message,
          }
          onUpdateDownloadedCallback?.(info)

          if (!shouldContinue) return

          if (updateInfo.shouldForceUpdate) {
            if (!isUserClearedForAccessRef.current) {
              HotUpdater.reload()
              return
            }
            Alert.alert(
              'Update Downloaded',
              'An important update has been downloaded. Reload now to apply it?',
              [
                { text: 'Later', style: 'cancel' },
                { text: 'Reload Now', onPress: () => HotUpdater.reload() },
              ]
            )
          }
        } catch (error) {
          onError?.(error)
          setIsUserClearedForAccess(true)
        } finally {
          if (!isUserClearedForAccessRef.current) {
            setIsUserClearedForAccess(true)
          }
        }
      })()

      return () => {
        shouldContinue = false
      }
    }, [enabled, onUpdateDownloadedCallback, onError])

    return {
      userClearedForAccess: isUserClearedForAccess,
      progress,
      isUpdatePending: getIsUpdatePending(),
    }
  }

  /**
   * Manually check for updates (for debug/testing).
   */
  const checkForUpdate = async (
    options: { channel?: string; isPreRelease?: boolean } = {}
  ) => {
    const { channel, isPreRelease = false } = options

    const requestHeaders: Record<string, string> = {}
    if (channel) {
      requestHeaders['X-Channel'] = channel
    }

    const updateInfo = await HotUpdater.checkForUpdate({
      updateStrategy,
      ...(Object.keys(requestHeaders).length > 0 && { requestHeaders }),
    })

    if (updateInfo) {
      await updateInfo.updateBundle()
      handleUpdateDownloaded(updateInfo.id, { isPreRelease })

      return {
        id: updateInfo.id,
        isCriticalUpdate: updateInfo.shouldForceUpdate,
        fileUrl: updateInfo.fileUrl,
        message: updateInfo.message,
      }
    }

    return null
  }

  return {
    useOtaUpdater,
    checkForUpdate,
    getAppliedOta,
    getShortOtaId,
    getIsUpdatePending,
    reload: () => HotUpdater.reload(),
    getBundleId: () => HotUpdater.getBundleId(),
    getMinBundleId: () => HotUpdater.getMinBundleId(),
    getChannel: () => HotUpdater.getChannel(),
    clearCrashHistory: () => HotUpdater.clearCrashHistory(),
    getCrashHistory: () => HotUpdater.getCrashHistory(),
  }
}
