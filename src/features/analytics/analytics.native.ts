import { postHog } from '../../posthog/posthog'
import type { Analytics, AnalyticsEvent } from './types'

class NativeAnalytics implements Analytics {
  track<T extends AnalyticsEvent>(event: T['type'], properties: T['properties']): void {
    postHog.capture(event, properties)
  }

  identify(userId: string, properties?: Record<string, any>): void {
    postHog.identify(userId, properties)
  }

  reset(): void {
    postHog.reset()
  }
}

export const analytics = new NativeAnalytics()
