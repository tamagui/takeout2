// deno-lint-ignore-file
/* eslint-disable */
// biome-ignore: needed import
import type { OneRouter } from 'one'

declare module 'one' {
  export namespace OneRouter {
    export interface __routes<T extends string = string> extends Record<string, unknown> {
      StaticRoutes: 
        | `/`
        | `/(app)`
        | `/(app)/auth`
        | `/(app)/auth/login`
        | `/(app)/auth/signup/otp`
        | `/(app)/home`
        | `/(app)/home/(tabs)`
        | `/(app)/home/(tabs)/ai`
        | `/(app)/home/(tabs)/ai/`
        | `/(app)/home/(tabs)/feed`
        | `/(app)/home/(tabs)/feed/`
        | `/(app)/home/(tabs)/profile`
        | `/(app)/home/(tabs)/profile/`
        | `/(app)/home/(tabs)/search`
        | `/(app)/home/(tabs)/search/`
        | `/(app)/home/ai`
        | `/(app)/home/ai/`
        | `/(app)/home/feed`
        | `/(app)/home/feed/`
        | `/(app)/home/notification`
        | `/(app)/home/notification/`
        | `/(app)/home/profile`
        | `/(app)/home/profile/`
        | `/(app)/home/search`
        | `/(app)/home/search/`
        | `/(app)/home/settings`
        | `/(app)/home/settings/`
        | `/(app)/home/settings/blocked-users`
        | `/(app)/home/settings/edit-profile`
        | `/(legal)/eula`
        | `/(legal)/privacy-policy`
        | `/(legal)/terms-of-service`
        | `/_sitemap`
        | `/auth`
        | `/auth/login`
        | `/auth/signup/otp`
        | `/docs`
        | `/eula`
        | `/help`
        | `/home`
        | `/home/(tabs)`
        | `/home/(tabs)/ai`
        | `/home/(tabs)/ai/`
        | `/home/(tabs)/feed`
        | `/home/(tabs)/feed/`
        | `/home/(tabs)/profile`
        | `/home/(tabs)/profile/`
        | `/home/(tabs)/search`
        | `/home/(tabs)/search/`
        | `/home/ai`
        | `/home/ai/`
        | `/home/feed`
        | `/home/feed/`
        | `/home/notification`
        | `/home/notification/`
        | `/home/profile`
        | `/home/profile/`
        | `/home/search`
        | `/home/search/`
        | `/home/settings`
        | `/home/settings/`
        | `/home/settings/blocked-users`
        | `/home/settings/edit-profile`
        | `/privacy-policy`
        | `/terms-of-service`
      DynamicRoutes: 
        | `/(app)/auth/signup/${OneRouter.SingleRoutePart<T>}`
        | `/(app)/home/(tabs)/feed/post/${OneRouter.SingleRoutePart<T>}`
        | `/(app)/home/(tabs)/feed/profile/${OneRouter.SingleRoutePart<T>}`
        | `/(app)/home/(tabs)/profile/post/${OneRouter.SingleRoutePart<T>}`
        | `/(app)/home/feed/post/${OneRouter.SingleRoutePart<T>}`
        | `/(app)/home/feed/profile/${OneRouter.SingleRoutePart<T>}`
        | `/(app)/home/profile/post/${OneRouter.SingleRoutePart<T>}`
        | `/auth/signup/${OneRouter.SingleRoutePart<T>}`
        | `/docs/${OneRouter.SingleRoutePart<T>}`
        | `/home/(tabs)/feed/post/${OneRouter.SingleRoutePart<T>}`
        | `/home/(tabs)/feed/profile/${OneRouter.SingleRoutePart<T>}`
        | `/home/(tabs)/profile/post/${OneRouter.SingleRoutePart<T>}`
        | `/home/feed/post/${OneRouter.SingleRoutePart<T>}`
        | `/home/feed/profile/${OneRouter.SingleRoutePart<T>}`
        | `/home/profile/post/${OneRouter.SingleRoutePart<T>}`
      DynamicRouteTemplate: 
        | `/(app)/auth/signup/[method]`
        | `/(app)/home/(tabs)/feed/post/[feedId]`
        | `/(app)/home/(tabs)/feed/profile/[userId]`
        | `/(app)/home/(tabs)/profile/post/[feedId]`
        | `/(app)/home/feed/post/[feedId]`
        | `/(app)/home/feed/profile/[userId]`
        | `/(app)/home/profile/post/[feedId]`
        | `/auth/signup/[method]`
        | `/docs/[slug]`
        | `/home/(tabs)/feed/post/[feedId]`
        | `/home/(tabs)/feed/profile/[userId]`
        | `/home/(tabs)/profile/post/[feedId]`
        | `/home/feed/post/[feedId]`
        | `/home/feed/profile/[userId]`
        | `/home/profile/post/[feedId]`
      IsTyped: true
      RouteTypes: {
        '/(app)/auth/signup/[method]': RouteInfo<{ method: string }>
        '/(app)/home/(tabs)/feed/post/[feedId]': RouteInfo<{ feedId: string }>
        '/(app)/home/(tabs)/feed/profile/[userId]': RouteInfo<{ userId: string }>
        '/(app)/home/(tabs)/profile/post/[feedId]': RouteInfo<{ feedId: string }>
        '/(app)/home/feed/post/[feedId]': RouteInfo<{ feedId: string }>
        '/(app)/home/feed/profile/[userId]': RouteInfo<{ userId: string }>
        '/(app)/home/profile/post/[feedId]': RouteInfo<{ feedId: string }>
        '/auth/signup/[method]': RouteInfo<{ method: string }>
        '/docs/[slug]': RouteInfo<{ slug: string }>
        '/home/(tabs)/feed/post/[feedId]': RouteInfo<{ feedId: string }>
        '/home/(tabs)/feed/profile/[userId]': RouteInfo<{ userId: string }>
        '/home/(tabs)/profile/post/[feedId]': RouteInfo<{ feedId: string }>
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