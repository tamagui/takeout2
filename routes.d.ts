// deno-lint-ignore-file
/* eslint-disable */
// biome-ignore: needed import
import type { OneRouter } from 'one'

declare module 'one' {
  export namespace OneRouter {
    export interface __routes<T extends string = string> extends Record<string, unknown> {
      StaticRoutes: `/` | `/(chat)` | `/(chat)/` | `/(chat)/[serverId]/` | `/(chat)/[serverId]/[channelId]/settings/` | `/(chat)/[serverId]/[channelId]/settings/channel-settings` | `/(chat)/[serverId]/activity` | `/(chat)/[serverId]/members` | `/[serverId]/` | `/[serverId]/[channelId]/settings/` | `/[serverId]/[channelId]/settings/channel-settings` | `/[serverId]/activity` | `/[serverId]/members` | `/_.` | `/_/docs` | `/_/docs/` | `/_/home` | `/_/login` | `/_/login-github` | `/_/login-success` | `/_/oauth-success` | `/_/private-beta` | `/_/sandbox` | `/_/test` | `/_sitemap` | `/admin` | `/admin/jobs` | `/ai` | `/auth` | `/sub-window`
      DynamicRoutes: `/${OneRouter.SingleRoutePart<T>}` | `/${OneRouter.SingleRoutePart<T>}./${OneRouter.SingleRoutePart<T>}` | `/${OneRouter.SingleRoutePart<T>}/${OneRouter.SingleRoutePart<T>}` | `/${OneRouter.SingleRoutePart<T>}/${OneRouter.SingleRoutePart<T>}/settings` | `/${OneRouter.SingleRoutePart<T>}/${OneRouter.SingleRoutePart<T>}/thread/${OneRouter.SingleRoutePart<T>}` | `/${OneRouter.SingleRoutePart<T>}/activity/${string}` | `/(chat)/${OneRouter.SingleRoutePart<T>}` | `/(chat)/${OneRouter.SingleRoutePart<T>}./${OneRouter.SingleRoutePart<T>}` | `/(chat)/${OneRouter.SingleRoutePart<T>}/${OneRouter.SingleRoutePart<T>}` | `/(chat)/${OneRouter.SingleRoutePart<T>}/${OneRouter.SingleRoutePart<T>}/settings` | `/(chat)/${OneRouter.SingleRoutePart<T>}/${OneRouter.SingleRoutePart<T>}/thread/${OneRouter.SingleRoutePart<T>}` | `/(chat)/${OneRouter.SingleRoutePart<T>}/activity/${string}` | `/(chat)/private/${OneRouter.SingleRoutePart<T>}` | `/(chat)/user/${OneRouter.SingleRoutePart<T>}` | `/_./${OneRouter.SingleRoutePart<T>}` | `/_/docs/${OneRouter.SingleRoutePart<T>}` | `/private/${OneRouter.SingleRoutePart<T>}` | `/user/${OneRouter.SingleRoutePart<T>}`
      DynamicRouteTemplate: `/(chat)/[serverId]` | `/(chat)/[serverId]./[appInstallId]` | `/(chat)/[serverId]/[channelId]` | `/(chat)/[serverId]/[channelId]/settings` | `/(chat)/[serverId]/[channelId]/thread/[messageId]` | `/(chat)/[serverId]/activity/[...focused]` | `/(chat)/private/[privateChatId]` | `/(chat)/user/[username]` | `/[serverId]` | `/[serverId]./[appInstallId]` | `/[serverId]/[channelId]` | `/[serverId]/[channelId]/settings` | `/[serverId]/[channelId]/thread/[messageId]` | `/[serverId]/activity/[...focused]` | `/_./[appId]` | `/_/docs/[slug]` | `/private/[privateChatId]` | `/user/[username]`
      IsTyped: true
    }
  }
}