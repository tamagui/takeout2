import { postHog } from '~/posthog/instance.node'

import type { AnalyticsEvent, EventProperties } from '~/features/analytics/types'

export const analyticsActions = () => {
  return {
    logEvent: async <T extends AnalyticsEvent['type']>(
      userId: string,
      event: T,
      properties: EventProperties<T>
    ) => {
      // add userId to properties for consistent tracking
      const enrichedProperties = {
        ...(properties as any),
        userId,
        distinctId: userId,
      }

      // send to PostHog on server
      await postHog.capture(event, enrichedProperties)

      // also log for debugging in development
      if (process.env.NODE_ENV === 'development') {
        console.info(`[Analytics] User ${userId}: ${event}`, properties)
      }
    },

    identifyUser: async (userId: string, traits?: any) => {
      // identify user in PostHog
      await postHog.identify(userId, traits)

      // also log for debugging in development
      if (process.env.NODE_ENV === 'development') {
        console.info(`[Analytics] Identify user ${userId}`, traits)
      }
    },

    trackException: async (error: Error, userId?: string, context?: any) => {
      // capture exception in PostHog
      await postHog.captureException(error, {
        userId,
        distinctId: userId || 'anonymous',
        ...context,
      })
    },
  }
}
