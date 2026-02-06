import { isWeb } from '@tamagui/constants'

export const isTauri: boolean = typeof window !== 'undefined' && '__TAURI__' in window

export const isNative: boolean = !isWeb && !isTauri

// TODO move to probably ~/interface/constants

export const IS_MAC_DESKTOP: boolean =
  typeof navigator !== 'undefined' && /Macintosh|MacIntel/.test(navigator.platform)

export const IS_SAFARI: boolean =
  isTauri ||
  (typeof navigator !== 'undefined' &&
    /Version\/[\d.]+.*Safari/.test(navigator.userAgent) &&
    /Apple Computer/.test(navigator.vendor))

export { isAndroid, isBrowser, isIos, isServer, isWeb } from '@tamagui/constants'

export const EMPTY_ARRAY = [] as never
export const EMPTY_OBJECT = {} as never

const getDebugLevelFromUrl = (): number | null => {
  if (typeof window === 'undefined') return null
  const match = window.location?.search?.match(/debug=(\d+)/)
  return match?.[1] ? parseInt(match[1], 10) : null
}

export const DEBUG_LEVEL: number = process.env.DEBUG_LEVEL
  ? +process.env.DEBUG_LEVEL
  : (getDebugLevelFromUrl() ?? (process.env.NODE_ENV === 'development' ? 1 : 0))
