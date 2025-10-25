import { Platform } from 'react-native'

export const IS_MAC_DESKTOP =
  typeof navigator !== 'undefined' && /Macintosh|MacIntel/.test(navigator.platform)

export const IS_SAFARI =
  typeof navigator !== 'undefined' &&
  /Version\/[\d.]+.*Safari/.test(navigator.userAgent) &&
  /Apple Computer/.test(navigator.vendor)

export const isWeb = Platform.OS === 'web'

export const isNative = Platform.OS === 'ios' || Platform.OS === 'android'

export const isIOS = Platform.OS === 'ios'
export const isIos = isIOS // alias for backwards compatibility

export const isAndroid = Platform.OS === 'android'
