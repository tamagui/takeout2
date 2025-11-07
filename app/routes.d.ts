// deno-lint-ignore-file
/* eslint-disable */
// biome-ignore: needed import
import type { OneRouter } from 'one'

declare module 'one' {
  export namespace OneRouter {
    export interface __routes<T extends string = string> extends Record<string, unknown> {
      StaticRoutes: `/` | `/(auth-onboard)` | `/(auth-onboard)/avatar-setup` | `/(auth-onboard)/eula` | `/(auth-onboard)/login` | `/(auth-onboard)/login-success` | `/(auth-onboard)/login/password` | `/(auth-onboard)/oauth-success` | `/(auth-onboard)/profile-setup` | `/(auth-onboard)/signup/otp` | `/(auth-onboard)/waiting-list` | `/(main)` | `/(main)/(tabs)` | `/(main)/(tabs)/home` | `/(main)/(tabs)/home/` | `/(main)/(tabs)/plus` | `/(main)/(tabs)/plus/` | `/(main)/(tabs)/profile` | `/(main)/(tabs)/profile/` | `/(main)/(tabs)/search` | `/(main)/home` | `/(main)/home/` | `/(main)/plus` | `/(main)/plus/` | `/(main)/profile` | `/(main)/profile/` | `/(main)/search` | `/(main)/setting` | `/(main)/setting/` | `/(main)/setting/blocked-users` | `/(main)/setting/edit-profile` | `/(site)` | `/(site)/` | `/(site)/docs` | `/(site)/docs/` | `/(site)/help` | `/(site)/privacy-policy` | `/(site)/terms-of-service` | `/(tabs)` | `/(tabs)/home` | `/(tabs)/home/` | `/(tabs)/plus` | `/(tabs)/plus/` | `/(tabs)/profile` | `/(tabs)/profile/` | `/(tabs)/search` | `/_sitemap` | `/avatar-setup` | `/docs` | `/docs/` | `/eula` | `/help` | `/home` | `/home/` | `/login` | `/login-success` | `/login/password` | `/oauth-success` | `/plus` | `/plus/` | `/privacy-policy` | `/profile` | `/profile-setup` | `/profile/` | `/search` | `/setting` | `/setting/` | `/setting/blocked-users` | `/setting/edit-profile` | `/signup/otp` | `/sub-window` | `/terms-of-service` | `/waiting-list`
      DynamicRoutes: `/(auth-onboard)/signup/${OneRouter.SingleRoutePart<T>}` | `/(main)/(tabs)/home/post/${OneRouter.SingleRoutePart<T>}` | `/(main)/(tabs)/home/profile/${OneRouter.SingleRoutePart<T>}` | `/(main)/home/post/${OneRouter.SingleRoutePart<T>}` | `/(main)/home/profile/${OneRouter.SingleRoutePart<T>}` | `/(site)/docs/${OneRouter.SingleRoutePart<T>}` | `/(tabs)/home/post/${OneRouter.SingleRoutePart<T>}` | `/(tabs)/home/profile/${OneRouter.SingleRoutePart<T>}` | `/docs/${OneRouter.SingleRoutePart<T>}` | `/home/post/${OneRouter.SingleRoutePart<T>}` | `/home/profile/${OneRouter.SingleRoutePart<T>}` | `/signup/${OneRouter.SingleRoutePart<T>}`
      DynamicRouteTemplate: `/(auth-onboard)/signup/[method]` | `/(main)/(tabs)/home/post/[feedId]` | `/(main)/(tabs)/home/profile/[userId]` | `/(main)/home/post/[feedId]` | `/(main)/home/profile/[userId]` | `/(site)/docs/[slug]` | `/(tabs)/home/post/[feedId]` | `/(tabs)/home/profile/[userId]` | `/docs/[slug]` | `/home/post/[feedId]` | `/home/profile/[userId]` | `/signup/[method]`
      IsTyped: true
    }
  }
}