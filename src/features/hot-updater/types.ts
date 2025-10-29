import type { AuthData } from '~/features/auth/types'

export interface HotUpdaterContextValue {
  isUpdateAvailable: boolean
  isDownloading: boolean
  downloadProgress: number
  checkForUpdate: () => Promise<void>
  applyUpdate: () => Promise<void>
  lastCheckTime: Date | null
  authData: AuthData | null
}

export interface HotUpdaterProviderProps {
  children: React.ReactNode
  authData?: AuthData | null
}
