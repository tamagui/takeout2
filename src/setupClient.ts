import '~/helpers/crypto/polyfill'
import '~/features/storage/setupStorage'
import '~/features/analytics/analytics'
import '~/posthog/posthog'

import { setupDev } from 'tamagui'

import { initializeErrorHandling } from '~/features/errors/setupErrorHandling'
import { initializeLogger } from '~/features/logger/logger'
import { initializeSplashScreen } from '~/interface/splash/initializeSplashScreen'
// import { initializeSidecar } from '~/features/sidecar/initialize'

console.info(`[client] start (SHA: ${process.env.GIT_SHA})`)

initializeErrorHandling()
initializeLogger()
initializeSplashScreen()
// initializeSidecar()

if (process.env.NODE_ENV === 'development') {
  setupDev({
    visualizer: true,
  })
}
