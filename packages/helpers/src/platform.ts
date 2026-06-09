// platform booleans, web/default variant.
// re-implemented locally so @take-out/helpers carries no @tamagui/* runtime dep.
// the native values live in platform.native.ts (resolved by metro / the react-native export condition).

export const isWeb: boolean = true

export const isBrowser: boolean =
  typeof navigator !== 'undefined' && typeof location !== 'undefined'

export const isServer: boolean = !isBrowser

export const isAndroid: boolean = false

export const isIos: boolean = false
