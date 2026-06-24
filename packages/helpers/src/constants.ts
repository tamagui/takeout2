import { IS_WEB } from './platform'

export const IS_TAURI: boolean = typeof window !== 'undefined' && '__TAURI__' in window

export const IS_NATIVE: boolean = !IS_WEB && !IS_TAURI

// TODO move to probably ~/interface/constants

export const IS_MAC_DESKTOP: boolean =
  typeof navigator !== 'undefined' && /Macintosh|MacIntel/.test(navigator.platform)

export const IS_SAFARI: boolean =
  IS_TAURI ||
  (typeof navigator !== 'undefined' &&
    /Version\/[\d.]+.*Safari/.test(navigator.userAgent) &&
    typeof navigator.vendor === 'string' &&
    navigator.vendor.includes('Apple Computer'))

export * from './platform'

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
