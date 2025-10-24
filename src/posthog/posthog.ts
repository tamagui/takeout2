import { DEBUG_LEVEL } from '~/features/devtools/constants'
import type { PostHogInstance } from './types'

/**
 * PostHog abstraction class that dynamically loads the appropriate implementation
 * based on the environment (server vs client) and platform (native vs web)
 */

export class PostHog implements PostHogInstance {
  private initPromise: Promise<PostHogInstance> | null = null
  private instance: PostHogInstance | null = null

  private async initialize(): Promise<PostHogInstance> {
    if (this.instance) {
      return this.instance
    }
    if (this.initPromise) {
      return await this.initPromise
    }

    if (DEBUG_LEVEL > 1) {
      console.info(`loading posthog for environment ${process.env.VITE_ENVIRONMENT}`)
    }

    const initPromise = (async () => {
      if (process.env.VITE_ENVIRONMENT === 'ssr') {
        const { postHog } = await import('./instance.node')
        return postHog
      } else if (
        process.env.VITE_ENVIRONMENT === 'ios' ||
        process.env.VITE_ENVIRONMENT === 'android'
      ) {
        const { postHog } = await import('./instance.native')
        return postHog
      } else {
        const { postHog } = await import('./instance')
        return postHog
      }
    })()

    this.initPromise = initPromise
    this.instance = await initPromise

    return this.instance
  }

  private async getInstance(): Promise<PostHogInstance> {
    if (!this.initPromise) {
      this.initPromise = this.initialize()
    }
    return this.initPromise
  }

  async capture(event: string, properties?: Record<string, any>): Promise<void> {
    const instance = await this.getInstance()
    const enhancedProperties = {
      ...properties,
      environment: process.env.VITE_ENVIRONMENT || 'unknown',
    }
    return instance.capture(event, enhancedProperties)
  }

  async identify(userId: string, properties?: Record<string, any>): Promise<void> {
    const instance = await this.getInstance()
    const enhancedProperties = {
      ...properties,
      environment: process.env.VITE_ENVIRONMENT || 'unknown',
    }
    return instance.identify(userId, enhancedProperties)
  }

  async reset(): Promise<void> {
    const instance = await this.getInstance()
    return instance.reset()
  }

  async captureException(error: Error, properties?: Record<string, any>): Promise<void> {
    const instance = await this.getInstance()
    const enhancedProperties = {
      ...properties,
      environment: process.env.VITE_ENVIRONMENT || 'unknown',
    }
    return instance.captureException(error, enhancedProperties)
  }
}

export const postHog = new PostHog()
