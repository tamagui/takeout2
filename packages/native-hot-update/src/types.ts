/** Simple key-value storage interface */
export interface HotUpdateStorage {
  get(key: string): string | undefined
  set(key: string, value: string): void
  delete(key: string): void
}

export interface HotUpdaterConfig {
  /** Storage for persisting update state */
  storage: HotUpdateStorage
  /** Update strategy (default: 'appVersion') */
  updateStrategy?: 'appVersion' | 'fingerprint'
}

export interface UpdateInfo {
  id: string
  isCriticalUpdate: boolean
  fileUrl: string | null
  message: string | null
}

export interface HotUpdaterInstance {
  /** React hook for automatic update checking */
  useOtaUpdater: (options?: {
    enabled?: boolean
    onUpdateDownloaded?: (info: UpdateInfo) => void
    onError?: (error: unknown) => void
  }) => {
    userClearedForAccess: boolean
    progress: number
    isUpdatePending: boolean
  }

  /** Manually check for updates (for dev/testing) */
  checkForUpdate: (options?: {
    channel?: string
    isPreRelease?: boolean
  }) => Promise<UpdateInfo | null>

  /** Get currently applied OTA bundle ID (null if native) */
  getAppliedOta: () => string | null

  /** Get short version of OTA ID */
  getShortOtaId: () => string | null

  /** Check if update is pending (will apply on restart) */
  getIsUpdatePending: () => boolean

  /** Reload the app to apply update */
  reload: () => void

  /** Get current bundle ID */
  getBundleId: () => string

  /** Get minimum bundle ID (native build time) */
  getMinBundleId: () => string

  /** Get current channel */
  getChannel: () => string

  /** Clear crash history to allow retrying failed bundles */
  clearCrashHistory: () => boolean

  /** Get list of crashed bundle IDs */
  getCrashHistory: () => string[]
}
