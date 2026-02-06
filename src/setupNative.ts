// setup tamagui native
// import '@tamagui/native/setup-teleport' // create post drawer freeze
import '@tamagui/native/setup-gesture-handler'
import '@tamagui/native/setup-expo-linear-gradient'
import '@tamagui/native/setup-keyboard-controller'
import '@tamagui/native/setup-burnt'
import '@tamagui/native/setup-zeego'
//
// setup global side effects
import '~/features/analytics/analytics'
import '~/features/storage/setupStorage'
import '~/helpers/crypto/polyfill'
import '~/posthog/posthog'

import { initializeErrorHandling } from '~/features/errors/setupErrorHandling'
import { initializeLogger } from '~/features/logger/logger'
import { initializeSplashScreen } from '~/interface/splash/initializeSplashScreen'

initializeErrorHandling()
initializeLogger()
initializeSplashScreen()
