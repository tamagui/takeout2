import '~/helpers/crypto/polyfill'
import '~/storage/setupStorage'
import '~/features/analytics/analytics'
import '~/posthog/posthog'

import { setupDev } from 'tamagui'

import { initializeErrorHandling } from '~/features/errors/setupErrorHandling'
import { initializeLogger } from '~/features/logger/logger'
// import { initializeSidecar } from '~/features/sidecar/initialize'

console.info(`[client] start (SHA: ${process.env.GIT_SHA})`)

initializeErrorHandling()
initializeLogger()
// initializeSidecar()

if (process.env.NODE_ENV === 'development') {
  setupDev({
    visualizer: true,
  })
}
