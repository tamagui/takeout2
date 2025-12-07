import posthog from 'posthog-js'

import type { PostHogInstance } from './types'

class WebPostHog implements PostHogInstance {
  private isInitialized = false

  constructor() {
    this.initialize()
  }

  private initialize(): void {
    if (this.isInitialized || !process.env.VITE_POSTHOG_API_KEY) {
      console.info(`🐽 No PostHog key`)
      return
    }

    posthog.init(process.env.VITE_POSTHOG_API_KEY, {
      api_host: process.env.VITE_POSTHOG_HOST || 'https://us.i.posthog.com',
      person_profiles: 'identified_only',
      capture_pageview: true,
      capture_pageleave: true,
      autocapture: false,
    })

    this.isInitialized = true
  }

  async capture(event: string, properties?: Record<string, any>): Promise<void> {
    if (!this.isInitialized) {
      if (process.env.NODE_ENV === 'production') {
        console.warn('PostHog not initialized')
      }
      return
    }

    posthog.capture(event, properties)
  }

  async identify(userId: string, properties?: Record<string, any>): Promise<void> {
    if (!this.isInitialized) {
      if (process.env.NODE_ENV === 'production') {
        console.warn('PostHog not initialized')
      }
      return
    }

    posthog.identify(userId, properties)
  }

  async reset(): Promise<void> {
    if (!this.isInitialized) {
      return
    }

    posthog.reset()
  }

  async captureException(error: Error, properties?: Record<string, any>): Promise<void> {
    if (!this.isInitialized) {
      if (process.env.NODE_ENV === 'production') {
        console.warn('PostHog not initialized')
      }
      return
    }

    // check if posthog-js has captureException, otherwise use capture
    if (typeof posthog.captureException === 'function') {
      posthog.captureException(error, properties)
    } else {
      // fallback to manual capture if captureException isn't available
      posthog.capture('$exception', {
        $exception_type: error.name,
        $exception_message: error.message,
        $exception_stack_trace_raw: error.stack || '',
        ...properties,
      })
    }
  }

  isFeatureEnabled(key: string, defaultValue = false): boolean {
    if (!this.isInitialized) {
      return defaultValue
    }
    // posthog-js v1.96+ uses isFeatureEnabled without options
    return posthog.isFeatureEnabled(key) ?? defaultValue
  }

  getFeatureFlag(key: string): boolean | string | undefined {
    if (!this.isInitialized) {
      return undefined
    }
    return posthog.getFeatureFlag(key)
  }

  async reloadFeatureFlags(): Promise<void> {
    if (!this.isInitialized) {
      return
    }
    // posthog.reloadFeatureFlags doesn't take a callback in newer versions
    await posthog.reloadFeatureFlags()
  }
}

export const postHog = new WebPostHog()
