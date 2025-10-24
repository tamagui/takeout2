import type { BetterAuthClientPlugin } from 'better-auth'
import { adminClient, magicLinkClient } from 'better-auth/client/plugins'

export const plugins = [
  adminClient(),
  magicLinkClient(),
] satisfies BetterAuthClientPlugin[]
