// deno-lint-ignore-file
/* eslint-disable */
// biome-ignore: needed import
import type { OneRouter } from 'one'

declare module 'one' {
  export namespace OneRouter {
    export interface __routes<T extends string = string> extends Record<string, unknown> {
      StaticRoutes: `/` | `/(app)` | `/(app)/auth` | `/(app)/auth/login` | `/(app)/auth/login/password` | `/(app)/auth/signup/otp` | `/(app)/auth/waiting-list` | `/(app)/home` | `/(app)/home/ai` | `/(app)/home/ai/` | `/(app)/home/feed` | `/(app)/home/feed/` | `/(app)/home/profile` | `/(app)/home/profile/` | `/(app)/home/search` | `/(app)/home/search/` | `/(app)/settings` | `/(app)/settings/` | `/(app)/settings/blocked-users` | `/(app)/settings/edit-profile` | `/(legal)/eula` | `/(legal)/privacy-policy` | `/(legal)/terms-of-service` | `/(site)` | `/(site)/` | `/(site)/(legal)/eula` | `/(site)/(legal)/privacy-policy` | `/(site)/(legal)/terms-of-service` | `/(site)/docs` | `/(site)/eula` | `/(site)/help` | `/(site)/privacy-policy` | `/(site)/terms-of-service` | `/_sitemap` | `/auth` | `/auth/login` | `/auth/login/password` | `/auth/signup/otp` | `/auth/waiting-list` | `/docs` | `/eula` | `/help` | `/home` | `/home/ai` | `/home/ai/` | `/home/feed` | `/home/feed/` | `/home/profile` | `/home/profile/` | `/home/search` | `/home/search/` | `/privacy-policy` | `/settings` | `/settings/` | `/settings/blocked-users` | `/settings/edit-profile` | `/terms-of-service`
      DynamicRoutes: `/(app)/auth/signup/${OneRouter.SingleRoutePart<T>}` | `/(app)/home/feed/post/${OneRouter.SingleRoutePart<T>}` | `/(app)/home/feed/profile/${OneRouter.SingleRoutePart<T>}` | `/(app)/home/profile/post/${OneRouter.SingleRoutePart<T>}` | `/(site)/docs/${OneRouter.SingleRoutePart<T>}` | `/auth/signup/${OneRouter.SingleRoutePart<T>}` | `/docs/${OneRouter.SingleRoutePart<T>}` | `/home/feed/post/${OneRouter.SingleRoutePart<T>}` | `/home/feed/profile/${OneRouter.SingleRoutePart<T>}` | `/home/profile/post/${OneRouter.SingleRoutePart<T>}`
      DynamicRouteTemplate: `/(app)/auth/signup/[method]` | `/(app)/home/feed/post/[feedId]` | `/(app)/home/feed/profile/[userId]` | `/(app)/home/profile/post/[feedId]` | `/(site)/docs/[slug]` | `/auth/signup/[method]` | `/docs/[slug]` | `/home/feed/post/[feedId]` | `/home/feed/profile/[userId]` | `/home/profile/post/[feedId]`
      IsTyped: true
      RouteTypes: {
        '/(app)/auth/signup/[method]': RouteInfo<{ method: string }>
        '/(app)/home/feed/post/[feedId]': RouteInfo<{ feedId: string }>
        '/(app)/home/feed/profile/[userId]': RouteInfo<{ userId: string }>
        '/(app)/home/profile/post/[feedId]': RouteInfo<{ feedId: string }>
        '/(site)/docs/[slug]': RouteInfo<{ slug: string }>
        '/auth/signup/[method]': RouteInfo<{ method: string }>
        '/docs/[slug]': RouteInfo<{ slug: string }>
        '/home/feed/post/[feedId]': RouteInfo<{ feedId: string }>
        '/home/feed/profile/[userId]': RouteInfo<{ userId: string }>
        '/home/profile/post/[feedId]': RouteInfo<{ feedId: string }>
      }
    }
  }
}

/**
 * Helper type for route information
 */
type RouteInfo<Params = Record<string, never>> = {
  Params: Params
  LoaderProps: { path: string; params: Params; request?: Request }
}