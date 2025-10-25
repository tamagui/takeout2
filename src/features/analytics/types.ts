// Typed events using discriminated unions
export type AnalyticsEvent =
  | {
      type: 'user_signup'
      properties: {
        method: 'email' | 'google' | 'github'
        source?: string
      }
    }
  | {
      type: 'post_created'
      properties: {
        postId: string
        contentLength: number
        hasMedia: boolean
      }
    }
  | {
      type: 'post_liked'
      properties: {
        postId: string
        authorId: string
      }
    }
  | {
      type: 'user_followed'
      properties: {
        followedUserId: string
      }
    }
  | {
      type: 'feed_viewed'
      properties: {
        feedType: 'home' | 'profile' | 'explore'
        postsLoaded: number
      }
    }
  | {
      type: 'feature_used'
      properties: {
        featureName: string
        context?: string
      }
    }
  | {
      type: 'error_occurred'
      properties: {
        errorCode: string
        errorMessage: string
        userId?: string
      }
    }
  | {
      type: 'api_error'
      properties: {
        status: number
        errorCode?: string
        errorMessage?: string
        endpoint: string
        method: string
        responseBody?: any
      }
    }
  | {
      type: 'log_info'
      properties: {
        message: string
        data?: any
        timestamp: number
        platform?: string
      }
    }
  | {
      type: 'log_warn'
      properties: {
        message: string
        data?: any
        timestamp: number
        platform?: string
      }
    }

export interface Analytics {
  track<T extends AnalyticsEvent>(event: T['type'], properties: T['properties']): void
  identify(userId: string, properties?: Record<string, any>): void
  reset(): void
}
