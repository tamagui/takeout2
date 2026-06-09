// platform booleans, react-native variant.
// react-native is an optional peer dep and is always present in the native runtime
// where this file is loaded, so importing it here is safe.

import { Platform } from 'react-native'

export const isWeb: boolean = false

export const isBrowser: boolean = false

export const isServer: boolean = false

export const isAndroid: boolean = Platform?.OS === 'android'

export const isIos: boolean = Platform?.OS === 'ios'
