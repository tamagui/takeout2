import { createStorageValue } from '@o/helpers'
import {
  type AppAnalyticsInstallationState,
  createAppAnalyticsClient,
} from 'contrast-better-auth/analytics'
import { SERVER_URL } from '~/constants'

const installationStorage = createStorageValue<AppAnalyticsInstallationState>(
  'contrast-analytics-installation-id',
)

export const appAnalytics = createAppAnalyticsClient({
  serverUrl: SERVER_URL,
  installationStorage,
  createInstallationId: () => crypto.randomUUID(),
})
