// platform booleans, react-native variant.
// Mirrors @tamagui/constants (native) so @take-out/helpers carries no @tamagui/* runtime dep.
// react-native is an optional peer dep and is always present in the native runtime
// where this file is loaded, so importing it here is safe.

import { useLayoutEffect, type useEffect } from 'react'
import { Platform } from 'react-native'

export const IS_WEB: boolean = false
export const IS_BROWSER: boolean = false
export const IS_SERVER: boolean = false
export const IS_SERVER_RUNTIME: boolean = false
export const IS_CLIENT: boolean = true
export const useIsomorphicLayoutEffect: typeof useEffect = useLayoutEffect
export const IS_CHROME: boolean = false
export const IS_WEB_TOUCHABLE: boolean = false
export const IS_NATIVE_DESKTOP: boolean =
  Platform?.OS === 'macos' || Platform?.OS === 'windows'
export const IS_TOUCHABLE: boolean = !IS_NATIVE_DESKTOP
// optional chain required: babel extractor loads native.cjs in node where Platform is undefined
// on Android TV: Platform.OS === 'android' per react-native-tvos
export const IS_ANDROID: boolean =
  Platform?.OS === 'android' ||
  process.env.TEST_NATIVE_PLATFORM === 'android' ||
  process.env.TEST_NATIVE_PLATFORM === 'androidtv'
// on tvOS: Platform.OS === 'ios' per react-native-tvos
export const IS_IOS: boolean =
  Platform?.OS === 'ios' ||
  process.env.TEST_NATIVE_PLATFORM === 'ios' ||
  process.env.TEST_NATIVE_PLATFORM === 'tvos'
export const SUPPORTS_DYNAMIC_COLOR_IOS: boolean =
  IS_IOS || process.env.TAMAGUI_DYNAMIC_COLOR_IOS === '1'
export const IS_TV: boolean =
  Platform?.isTV ||
  process.env.TEST_NATIVE_PLATFORM === 'androidtv' ||
  process.env.TEST_NATIVE_PLATFORM === 'tvos'

type CurrentPlatform = 'web' | 'ios' | 'native' | 'android' | 'macos' | 'windows'

// Platform.OS includes 'web' in its type (PlatformOSType) but never at native runtime,
// so the map is partial — any unmapped OS falls through to 'native'.
const platforms: Partial<Record<typeof Platform.OS, CurrentPlatform>> = {
  ios: 'ios',
  android: 'android',
  macos: 'macos',
  windows: 'windows',
}
/**
 * Reflects Platform.OS. TV platforms are intentionally NOT separate values:
 * - Android TV has Platform.OS === 'android' (react-native-tvos behavior)
 * - tvOS has Platform.OS === 'ios' (react-native-tvos behavior)
 * Use `IS_TV` combined with `IS_ANDROID`/`IS_IOS` to detect specific TV platforms.
 */
export const CURRENT_PLATFORM: CurrentPlatform =
  (Platform?.OS ? platforms[Platform.OS] : undefined) || 'native'

// In Metro source mode, TAMAGUI_TARGET may not be set by the build tool.
// Set it here so all process.env.TAMAGUI_TARGET runtime checks work correctly.
// In pre-built dist, the build tool inlines TAMAGUI_TARGET as a literal string,
// making this block dead code (if (!'native') → never executes).
if (!process.env.TAMAGUI_TARGET) {
  process.env.TAMAGUI_TARGET = 'native'
}
