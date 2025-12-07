// see analytics.native.ts

import { postHog } from '~/posthog/posthog'

import type { Analytics, AnalyticsEvent, EventProperties } from './types'

class WebAnalytics implements Analytics {
  track<T extends AnalyticsEvent['type']>(
    event: T,
    properties: EventProperties<T>
  ): void {
    postHog.capture(event, properties as any)
  }

  identify(userId: string, properties?: Record<string, any>): void {
    postHog.identify(userId, properties)
  }

  reset(): void {
    postHog.reset()
  }
}

export const analytics = new WebAnalytics()
