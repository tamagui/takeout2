import { Platform } from 'react-native'

export const isWeb = Platform.OS === 'web'
export const isIOS = Platform.OS === 'ios'
export const isAndroid = Platform.OS === 'android'
export const isNative = isIOS || isAndroid
export const isMobile = isNative

export const platform = Platform.OS
export const platformSelect = Platform.select
