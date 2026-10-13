export const APP_ANALYTICS_EVENTS = {
  install: 'app_install',
  visit: 'app_visit',
  signup: 'app_signup',
} as const

export const APP_ANALYTICS_INSTALLATION_HEADER = 'x-app-installation-id'

export type AppAnalyticsEventName =
  (typeof APP_ANALYTICS_EVENTS)[keyof typeof APP_ANALYTICS_EVENTS]

export type AppAnalyticsEvent = {
  event: AppAnalyticsEventName
  installationId: string
}

export type ProjectProductionStats = {
  deploysThisWeek: number | null
  uniqueVisitorsToday: number | null
  appInstallsToday: number | null
  newSignupsToday: number | null
}

const ANALYTICS_EVENT_NAMES: readonly AppAnalyticsEventName[] =
  Object.values(APP_ANALYTICS_EVENTS)
const INSTALLATION_ID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export function isAppInstallationId(value: unknown): value is string {
  return typeof value === 'string' && INSTALLATION_ID_RE.test(value)
}

export function parseAppAnalyticsEvent(value: unknown): AppAnalyticsEvent | null {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return null
  const entries = Object.entries(value)
  if (entries.length !== 2) return null
  const event = Reflect.get(value, 'event')
  const installationId = Reflect.get(value, 'installationId')
  const eventName = ANALYTICS_EVENT_NAMES.find((candidate) => candidate === event)
  if (!eventName) return null
  if (!isAppInstallationId(installationId)) return null
  return { event: eventName, installationId }
}

export type AppAnalyticsInstallationState = {
  installationId: string
  installPending: boolean
}

export type AppAnalyticsInstallationStorage = {
  get(): AppAnalyticsInstallationState | null | undefined
  set(value: AppAnalyticsInstallationState): void
}

export type AppAnalyticsClient = {
  captureAppOpen(): Promise<void>
  installationId(): string
  authRequestHeaders(): Record<typeof APP_ANALYTICS_INSTALLATION_HEADER, string>
}

export function createAppAnalyticsClient(options: {
  serverUrl: string
  installationStorage: AppAnalyticsInstallationStorage
  createInstallationId(): string
  fetch?: typeof fetch
}): AppAnalyticsClient {
  const endpoint = `${options.serverUrl.replace(/\/+$/, '')}/api/analytics`
  const send = options.fetch ?? fetch
  let installationState: AppAnalyticsInstallationState | null = null

  const readInstallation = () => {
    if (installationState) return installationState
    const stored = options.installationStorage.get()
    if (
      stored &&
      isAppInstallationId(stored.installationId) &&
      typeof stored.installPending === 'boolean'
    ) {
      installationState = stored
      return installationState
    }
    const created = options.createInstallationId()
    if (!isAppInstallationId(created)) {
      throw new Error('createInstallationId must return a UUID')
    }
    installationState = { installationId: created, installPending: true }
    options.installationStorage.set(installationState)
    return installationState
  }

  const capture = async (event: AppAnalyticsEventName) => {
    const payload = { event, installationId: readInstallation().installationId }
    return send(endpoint, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    })
      .then((response) => response.ok)
      .catch(() => false)
  }

  return {
    async captureAppOpen() {
      const state = readInstallation()
      if (state.installPending && (await capture(APP_ANALYTICS_EVENTS.install))) {
        installationState = { ...state, installPending: false }
        options.installationStorage.set(installationState)
      }
      await capture(APP_ANALYTICS_EVENTS.visit)
    },
    installationId() {
      return readInstallation().installationId
    },
    authRequestHeaders() {
      return {
        [APP_ANALYTICS_INSTALLATION_HEADER]: readInstallation().installationId,
      }
    },
  }
}
