import type { PostHogInstance } from './types'

// lightweight posthog client that uses our server proxy
// saves ~160KB by not bundling posthog-js

const STATS_API = '/api/stats'

// simple distinct_id management
let distinctId: string | null = null

function getDistinctId(): string {
  if (distinctId) return distinctId

  // try to get from localStorage
  if (typeof localStorage !== 'undefined') {
    const stored = localStorage.getItem('ph_distinct_id')
    if (stored) {
      distinctId = stored
      return distinctId
    }
  }

  // generate anonymous id
  distinctId = `anon_${crypto.randomUUID()}`

  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('ph_distinct_id', distinctId)
  }

  return distinctId
}

// feature flags cache
let featureFlags: Record<string, boolean | string> = {}
let featureFlagsLoaded = false

class LitePostHog implements PostHogInstance {
  private isInitialized = false

  constructor() {
    this.initialize()
  }

  private async initialize(): Promise<void> {
    if (this.isInitialized || !process.env.VITE_POSTHOG_API_KEY) {
      console.info(`🐽 PostHog lite: no key configured`)
      return
    }

    this.isInitialized = true

    // load feature flags on init
    await this.reloadFeatureFlags()

    // capture initial pageview
    if (typeof window !== 'undefined') {
      this.capture('$pageview', {
        $current_url: window.location.href,
        $pathname: window.location.pathname,
      })

      // capture pageleave
      window.addEventListener('beforeunload', () => {
        this.capture('$pageleave', {
          $current_url: window.location.href,
        })
      })
    }
  }

  async capture(event: string, properties?: Record<string, unknown>): Promise<void> {
    if (!this.isInitialized) return

    try {
      await fetch(STATS_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'capture',
          event,
          distinct_id: getDistinctId(),
          properties: {
            ...properties,
            $current_url:
              typeof window !== 'undefined' ? window.location.href : undefined,
          },
        }),
      })
    } catch {
      // fail silently
    }
  }

  async identify(userId: string, properties?: Record<string, unknown>): Promise<void> {
    if (!this.isInitialized) return

    // update distinct_id to user id
    distinctId = userId
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('ph_distinct_id', userId)
    }

    try {
      await fetch(STATS_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'identify',
          distinct_id: userId,
          properties,
        }),
      })

      // reload feature flags after identify
      await this.reloadFeatureFlags()
    } catch {
      // fail silently
    }
  }

  async reset(): Promise<void> {
    // clear distinct_id and regenerate
    distinctId = null
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('ph_distinct_id')
    }
    featureFlags = {}
    featureFlagsLoaded = false
  }

  async captureException(
    error: Error,
    properties?: Record<string, unknown>
  ): Promise<void> {
    await this.capture('error_occurred', {
      error_name: error.name,
      error_message: error.message,
      error_stack: error.stack?.slice(0, 1000), // limit stack size
      ...properties,
    })
  }

  isFeatureEnabled(key: string, defaultValue = false): boolean {
    if (!featureFlagsLoaded) return defaultValue
    const value = featureFlags[key]
    if (typeof value === 'boolean') return value
    if (value === 'true') return true
    if (value === 'false') return false
    return defaultValue
  }

  getFeatureFlag(key: string): boolean | string | undefined {
    if (!featureFlagsLoaded) return undefined
    return featureFlags[key]
  }

  async reloadFeatureFlags(): Promise<void> {
    if (!this.isInitialized) return

    try {
      const response = await fetch(STATS_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'decide',
          distinct_id: getDistinctId(),
        }),
      })

      const data = await response.json()
      featureFlags = data.featureFlags || {}
      featureFlagsLoaded = true
    } catch {
      // fail silently
    }
  }
}

export const postHog = new LitePostHog()
