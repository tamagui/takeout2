import { PostHog } from 'posthog-node'

import type { PostHogInstance } from './types'

class NodePostHog implements PostHogInstance {
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
    })
  }

  async capture(event: string, properties?: Record<string, any>): Promise<void> {
    if (!this.posthog) {
      if (process.env.NODE_ENV === 'production') {
        console.warn('PostHog not initialized')
      }
      return
    }

    this.posthog.capture({
      event,
      properties,
      distinctId: properties?.distinctId || properties?.userId || 'anonymous',
    })

    // auto-flush in production for error events
    if (process.env.NODE_ENV === 'production' && event === '$exception') {
      await this.posthog.flush()
    }
  }

  async captureException(error: Error, properties?: Record<string, any>): Promise<void> {
    if (!this.posthog) {
      if (process.env.NODE_ENV === 'production') {
        console.warn('PostHog not initialized')
      }
      return
    }

    // posthog-node doesn't have a native captureException, so we format it ourselves
    this.posthog.capture({
      event: '$exception',
      distinctId: properties?.distinctId || properties?.userId || 'anonymous',
      properties: {
        $exception_type: error.name,
        $exception_message: error.message,
        $exception_stack_trace_raw: error.stack || '',
        ...properties,
      },
    })

    // auto-flush in production for exceptions
    if (process.env.NODE_ENV === 'production') {
      await this.posthog.flush()
    }
  }

  async identify(userId: string, properties?: Record<string, any>): Promise<void> {
    if (!this.posthog) {
      if (process.env.NODE_ENV === 'production') {
        console.warn('PostHog not initialized')
      }
      return
    }

    this.posthog.identify({
      distinctId: userId,
      properties,
    })
  }

  async reset(): Promise<void> {
    if (!this.posthog) {
      return
    }

    await this.posthog.shutdown()
    this.posthog = null
    this.initialize()
  }

  isFeatureEnabled(key: string, defaultValue = false): boolean {
    if (!this.posthog) {
      return defaultValue
    }
    // Note: PostHog Node doesn't have synchronous feature flags
    // In a real app, you'd cache feature flags or use a different approach
    // For now, return default value on server
    return defaultValue
  }

  getFeatureFlag(key: string): boolean | string | undefined {
    if (!this.posthog) {
      return undefined
    }
    // Note: PostHog Node doesn't have synchronous feature flags
    // In a real app, you'd cache feature flags or use a different approach
    return undefined
  }

  async reloadFeatureFlags(): Promise<void> {
    // No-op on server - feature flags are typically client-side
    return
  }
}

export const postHog = new NodePostHog()
