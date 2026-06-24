import { isWeb as TAMAGUI_IS_WEB } from 'tamagui'

export {
  IS_ANDROID,
  IS_BROWSER,
  IS_CHROME,
  IS_CLIENT,
  IS_IOS,
  IS_NATIVE_DESKTOP,
  IS_SERVER,
  IS_SERVER_RUNTIME,
  IS_TOUCHABLE,
  IS_TV,
  IS_WEB_TOUCHABLE,
  SUPPORTS_DYNAMIC_COLOR_IOS,
  useIsomorphicLayoutEffect,
  CURRENT_PLATFORM,
} from '@take-out/helpers'

export const IS_NATIVE = !TAMAGUI_IS_WEB
