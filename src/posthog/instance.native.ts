import PostHog from 'posthog-react-native'

import type { PostHogInstance } from './types'

class NativePostHog implements PostHogInstance {
  private posthog: PostHog | null = null

  constructor() {
    this.initialize()
  }

  private initialize(): void {
    if (this.posthog || !process.env.VITE_POSTHOG_API_KEY) {
      return
    }

    this.posthog = new PostHog(process.env.VITE_POSTHOG_API_KEY, {
      host: process.env.VITE_POSTHOG_HOST || 'https://us.i.posthog.com',
      enableSessionReplay: false,
    })
  }

  async capture(event: string, properties?: Record<string, any>): Promise<void> {
    if (!this.posthog) {
      if (process.env.NODE_ENV === 'production') {
        console.warn('PostHog not initialized')
      }
      return
    }

    this.posthog.capture(event, properties)
  }

  async identify(userId: string, properties?: Record<string, any>): Promise<void> {
    if (!this.posthog) {
      if (process.env.NODE_ENV === 'production') {
        console.warn('PostHog not initialized')
      }
      return
    }

    this.posthog.identify(userId, properties)
  }

  async reset(): Promise<void> {
    if (!this.posthog) {
      return
    }

    this.posthog.reset()
  }

  async captureException(error: Error, properties?: Record<string, any>): Promise<void> {
    if (!this.posthog) {
      if (process.env.NODE_ENV === 'production') {
        console.warn('PostHog not initialized')
      }
      return
    }

    // check if posthog-react-native has captureException
    if (typeof this.posthog.captureException === 'function') {
      this.posthog.captureException(error, properties)
    } else {
      // fallback to manual capture
      this.posthog.capture('$exception', {
        $exception_type: error.name,
        $exception_message: error.message,
        $exception_stack_trace_raw: error.stack || '',
        ...properties,
      })
    }
  }

  isFeatureEnabled(key: string, defaultValue = false): boolean {
    if (!this.posthog) {
      return defaultValue
    }
    return this.posthog.isFeatureEnabled(key) ?? defaultValue
  }

  getFeatureFlag(key: string): boolean | string | undefined {
    if (!this.posthog) {
      return undefined
    }
    return this.posthog.getFeatureFlag(key)
  }

  async reloadFeatureFlags(): Promise<void> {
    if (!this.posthog) {
      return
    }
    return this.posthog.reloadFeatureFlags()
  }
}

export const postHog = new NativePostHog()
