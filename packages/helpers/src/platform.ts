// platform booleans, web/default variant.
// Re-implemented locally (mirrors @tamagui/constants) so @take-out/helpers carries no @tamagui/* runtime dep.
// The native values live in platform.native.ts (resolved by metro / the react-native export condition).

import { useEffect, useLayoutEffect } from 'react'

export const IS_WEB: boolean = true

// RN adds fake window and document so its not simple to get this right
// check both navigator and location
export const IS_BROWSER: boolean =
  process.env.VITE_ENVIRONMENT === 'client' ||
  (process.env.VITE_ENVIRONMENT !== 'ssr' &&
    typeof navigator !== 'undefined' &&
    typeof location !== 'undefined')

export const IS_SERVER_RUNTIME: boolean =
  process.env.VITE_ENVIRONMENT === 'ssr' ||
  (process.env.VITE_ENVIRONMENT !== 'client' &&
    typeof process !== 'undefined' &&
    !!process.versions &&
    !!(process.versions.node || (process.versions as any).bun))
export const IS_SERVER: boolean =
  process.env.VITE_ENVIRONMENT === 'ssr' ||
  (process.env.VITE_ENVIRONMENT !== 'client' && IS_WEB && !IS_BROWSER)
export const IS_CLIENT: boolean = IS_WEB && !IS_SERVER

export const useIsomorphicLayoutEffect: typeof useEffect = IS_SERVER
  ? useEffect
  : useLayoutEffect

export const IS_CHROME: boolean =
  typeof navigator !== 'undefined' && (navigator.userAgent || '').includes('Chrome')

// guard the `window` access: in a web worker `navigator`/`location` exist (so
// IS_CLIENT is true) but `window` does NOT — touching it throws "window is not
// defined" and kills the worker. soot bundles @take-out/helpers into its
// project-server web worker, so the unguarded form (which @tamagui/constants
// also ships, but never loads in a worker) hard-crashes preview bundling.
// keep this typeof guard even though it diverges from @tamagui/constants.
export const IS_WEB_TOUCHABLE: boolean =
  IS_CLIENT &&
  typeof window !== 'undefined' &&
  ('ontouchstart' in window || navigator.maxTouchPoints > 0)

export const IS_NATIVE_DESKTOP: boolean = false
export const IS_TOUCHABLE: boolean = !IS_WEB || IS_WEB_TOUCHABLE
// set :boolean to avoid inferring type to false
// on web, IS_ANDROID/IS_IOS are always false in production.
// TEST_NATIVE_PLATFORM is only set by the test runner (vitest) to simulate native
// environments (e.g. androidtv, tvos) from a web/jsdom test context.
export const IS_ANDROID: boolean =
  process.env.TEST_NATIVE_PLATFORM === 'android' ||
  process.env.TEST_NATIVE_PLATFORM === 'androidtv'
export const IS_IOS: boolean =
  process.env.TEST_NATIVE_PLATFORM === 'ios' ||
  process.env.TEST_NATIVE_PLATFORM === 'tvos'
export const SUPPORTS_DYNAMIC_COLOR_IOS: boolean =
  IS_IOS || process.env.TAMAGUI_DYNAMIC_COLOR_IOS === '1'
export const IS_TV: boolean =
  process.env.TEST_NATIVE_PLATFORM === 'androidtv' ||
  process.env.TEST_NATIVE_PLATFORM === 'tvos'
/**
 * Reflects Platform.OS. TV platforms are intentionally NOT separate values:
 * - Android TV has Platform.OS === 'android' (react-native-tvos behavior)
 * - tvOS has Platform.OS === 'ios' (react-native-tvos behavior)
 * Use `IS_TV` combined with `IS_ANDROID`/`IS_IOS` to detect specific TV platforms.
 */
export const CURRENT_PLATFORM: 'web' | 'ios' | 'native' | 'android' = 'web'

// In web source mode (Vite/webpack without pre-built dist), TAMAGUI_TARGET may not be set.
// Set it here so all process.env.TAMAGUI_TARGET runtime checks work correctly.
// In pre-built dist, the build tool inlines TAMAGUI_TARGET as a literal string,
// making this block dead code (if (!'web') → never executes).
if (!process.env.TAMAGUI_TARGET) {
  process.env.TAMAGUI_TARGET = 'web'
}
