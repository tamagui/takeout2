import { isWeb } from 'tamagui'

export {
  isAndroid,
  isBrowser,
  isChrome,
  isClient,
  isIos,
  isNativeDesktop,
  isServer,
  isTouchable,
  isTV,
  isWebTouchable,
  isWindowDefined,
  supportsDynamicColorIOS,
  useIsomorphicLayoutEffect,
  currentPlatform,
} from '@take-out/helpers'

export const isNative = !isWeb
