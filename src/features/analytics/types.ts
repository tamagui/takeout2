export type AnalyticsEvent =
  | {
      type: 'user_signup'
      properties: {
        method: 'email' | 'google' | 'github'
        source?: string
      }
    }
  | {
      type: 'user_onboarded'
      properties: {
        userId: string
        hasCompletedProfile: boolean
      }
    }
  | {
      type: 'profile_updated'
      properties: {
        fieldsUpdated: string[]
      }
    }
  | {
      type: 'post_created'
      properties: {
        postId: string
        hasImage?: boolean
        isDraft?: boolean
        contentLength?: number
        hasMedia?: boolean
      }
    }
  | {
      type: 'post_deleted'
      properties: {
        postId: string
        postAge?: number
        hasImage?: boolean
        isDraft?: boolean
      }
    }
  | {
      type: 'post_liked'
      properties: {
        postId: string
        authorId?: string
      }
    }
  | {
      type: 'post_unliked'
      properties: {
        postId: string
      }
    }
  | {
      type: 'user_blocked'
      properties: {
        targetUserId: string
      }
    }
  | {
      type: 'user_unblocked'
      properties: {
        targetUserId: string
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

// helper type to extract properties for a specific event type
export type EventProperties<T extends AnalyticsEvent['type']> = Extract<
  AnalyticsEvent,
  { type: T }
>['properties']

export interface Analytics {
  track<T extends AnalyticsEvent['type']>(event: T, properties: EventProperties<T>): void
  identify(userId: string, properties?: Record<string, any>): void
  reset(): void
}
