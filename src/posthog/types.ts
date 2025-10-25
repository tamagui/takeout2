export interface PostHogInstance {
  capture(event: string, properties?: Record<string, any>): Promise<void>
  captureException(error: Error, properties?: Record<string, any>): Promise<void>
  identify(userId: string, properties?: Record<string, any>): Promise<void>
  reset(): Promise<void>
  isFeatureEnabled(key: string, defaultValue?: boolean): boolean
  getFeatureFlag(key: string): boolean | string | undefined
  reloadFeatureFlags(): Promise<void>
}

export interface PostHogConfig {
  apiKey: string
  host?: string
  enableSessionReplay?: boolean
  personProfiles?: 'always' | 'never' | 'identified_only'
  capturePageview?: boolean
  capturePageleave?: boolean
  autocapture?: boolean
}
