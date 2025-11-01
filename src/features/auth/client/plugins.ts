import type { BetterAuthClientPlugin } from 'better-auth'
import {
  adminClient,
  emailOTPClient,
  magicLinkClient,
  phoneNumberClient,
} from 'better-auth/client/plugins'
import { platformClient } from './platformClient'

export const plugins = [
  adminClient(),
  magicLinkClient(),
  emailOTPClient(),
  phoneNumberClient(),
  platformClient(),
] satisfies BetterAuthClientPlugin[]
