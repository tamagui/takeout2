// deno-lint-ignore-file
/* eslint-disable */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { OneRouter } from 'one'

declare module 'one' {
  export namespace OneRouter {
    export interface __routes<T extends string = string> extends Record<string, unknown> {
      StaticRoutes: `/` | `/(app)` | `/(app)/(auth-onboard)` | `/(app)/(auth-onboard)/avatar-setup` | `/(app)/(auth-onboard)/login` | `/(app)/(auth-onboard)/login/password` | `/(app)/(auth-onboard)/profile-setup` | `/(app)/(auth-onboard)/signup/otp` | `/(app)/(auth-onboard)/waiting-list` | `/(app)/(tabs)` | `/(app)/(tabs)/home` | `/(app)/(tabs)/home/` | `/(app)/(tabs)/plus` | `/(app)/(tabs)/plus/` | `/(app)/(tabs)/profile` | `/(app)/(tabs)/profile/` | `/(app)/(tabs)/search` | `/(app)/(tabs)/search/` | `/(app)/avatar-setup` | `/(app)/home` | `/(app)/home/` | `/(app)/login` | `/(app)/login/password` | `/(app)/plus` | `/(app)/plus/` | `/(app)/profile` | `/(app)/profile-setup` | `/(app)/profile/` | `/(app)/search` | `/(app)/search/` | `/(app)/settings` | `/(app)/settings/` | `/(app)/settings/blocked-users` | `/(app)/settings/edit-profile` | `/(app)/signup/otp` | `/(app)/waiting-list` | `/(auth-onboard)` | `/(auth-onboard)/avatar-setup` | `/(auth-onboard)/login` | `/(auth-onboard)/login/password` | `/(auth-onboard)/profile-setup` | `/(auth-onboard)/signup/otp` | `/(auth-onboard)/waiting-list` | `/(legal)/eula` | `/(legal)/privacy-policy` | `/(legal)/terms-of-service` | `/(site)` | `/(site)/` | `/(site)/(legal)/eula` | `/(site)/(legal)/privacy-policy` | `/(site)/(legal)/terms-of-service` | `/(site)/docs` | `/(site)/docs/` | `/(site)/eula` | `/(site)/help` | `/(site)/privacy-policy` | `/(site)/terms-of-service` | `/(tabs)` | `/(tabs)/home` | `/(tabs)/home/` | `/(tabs)/plus` | `/(tabs)/plus/` | `/(tabs)/profile` | `/(tabs)/profile/` | `/(tabs)/search` | `/(tabs)/search/` | `/_sitemap` | `/avatar-setup` | `/docs` | `/docs/` | `/eula` | `/help` | `/home` | `/home/` | `/login` | `/login/password` | `/plus` | `/plus/` | `/privacy-policy` | `/profile` | `/profile-setup` | `/profile/` | `/search` | `/search/` | `/settings` | `/settings/` | `/settings/blocked-users` | `/settings/edit-profile` | `/signup/otp` | `/terms-of-service` | `/waiting-list`
      DynamicRoutes: `/(app)/(auth-onboard)/signup/${OneRouter.SingleRoutePart<T>}` | `/(app)/(tabs)/home/post/${OneRouter.SingleRoutePart<T>}` | `/(app)/(tabs)/home/profile/${OneRouter.SingleRoutePart<T>}` | `/(app)/home/post/${OneRouter.SingleRoutePart<T>}` | `/(app)/home/profile/${OneRouter.SingleRoutePart<T>}` | `/(app)/signup/${OneRouter.SingleRoutePart<T>}` | `/(auth-onboard)/signup/${OneRouter.SingleRoutePart<T>}` | `/(site)/docs/${OneRouter.SingleRoutePart<T>}` | `/(tabs)/home/post/${OneRouter.SingleRoutePart<T>}` | `/(tabs)/home/profile/${OneRouter.SingleRoutePart<T>}` | `/docs/${OneRouter.SingleRoutePart<T>}` | `/home/post/${OneRouter.SingleRoutePart<T>}` | `/home/profile/${OneRouter.SingleRoutePart<T>}` | `/signup/${OneRouter.SingleRoutePart<T>}`
      DynamicRouteTemplate: `/(app)/(auth-onboard)/signup/[method]` | `/(app)/(tabs)/home/post/[feedId]` | `/(app)/(tabs)/home/profile/[userId]` | `/(app)/home/post/[feedId]` | `/(app)/home/profile/[userId]` | `/(app)/signup/[method]` | `/(auth-onboard)/signup/[method]` | `/(site)/docs/[slug]` | `/(tabs)/home/post/[feedId]` | `/(tabs)/home/profile/[userId]` | `/docs/[slug]` | `/home/post/[feedId]` | `/home/profile/[userId]` | `/signup/[method]`
      IsTyped: true
      RouteTypes: {
        '/(app)/(auth-onboard)/signup/[method]': RouteInfo<{ method: string }>
        '/(app)/(tabs)/home/post/[feedId]': RouteInfo<{ feedId: string }>
        '/(app)/(tabs)/home/profile/[userId]': RouteInfo<{ userId: string }>
        '/(app)/home/post/[feedId]': RouteInfo<{ feedId: string }>
        '/(app)/home/profile/[userId]': RouteInfo<{ userId: string }>
        '/(app)/signup/[method]': RouteInfo<{ method: string }>
        '/(auth-onboard)/signup/[method]': RouteInfo<{ method: string }>
        '/(site)/docs/[slug]': RouteInfo<{ slug: string }>
        '/(tabs)/home/post/[feedId]': RouteInfo<{ feedId: string }>
        '/(tabs)/home/profile/[userId]': RouteInfo<{ userId: string }>
        '/docs/[slug]': RouteInfo<{ slug: string }>
        '/home/post/[feedId]': RouteInfo<{ feedId: string }>
        '/home/profile/[userId]': RouteInfo<{ userId: string }>
        '/signup/[method]': RouteInfo<{ method: string }>
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