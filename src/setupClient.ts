import '~/features/analytics/analytics'
import '~/posthog/posthog'
import '~/zero/helpers/setupClientGlobalEffects'

import { initializeErrorHandling } from '~/features/errors/setupErrorHandling'
import { initializeLogger } from '~/features/logger/logger'
// import { initializeSidecar } from '~/features/sidecar/initialize'

initializeErrorHandling()
initializeLogger()
// initializeSidecar()
