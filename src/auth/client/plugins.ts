import type { BetterAuthClientPlugin } from 'better-auth'
import {
  adminClient,
  magicLinkClient,
  emailOTPClient,
  phoneNumberClient,
} from 'better-auth/client/plugins'

export const plugins = [
  adminClient(),
  magicLinkClient(),
  emailOTPClient(),
  phoneNumberClient(),
] satisfies BetterAuthClientPlugin[]
