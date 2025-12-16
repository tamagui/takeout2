import '~/features/analytics/analytics'
import '~/features/storage/setupStorage'
import '~/helpers/crypto/polyfill'
import '~/posthog/posthog'

import { setupDev } from 'tamagui'

import { initializeErrorHandling } from '~/features/errors/setupErrorHandling'
import { initializeLogger } from '~/features/logger/logger'
import { initializeSplashScreen } from '~/interface/splash/initializeSplashScreen'

console.info(`[client] start (SHA: ${process.env.GIT_SHA})`)

initializeErrorHandling()
initializeLogger()
initializeSplashScreen()

if (process.env.NODE_ENV === 'development') {
  // hold down option in dev mode to see Tamagui dev visualizer
  setupDev({
    visualizer: true,
  })
}
