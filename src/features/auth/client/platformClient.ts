import type { BetterAuthClientPlugin } from 'better-auth'

export function platformClient() {
  // nothing on web
  return {
    id: `platform`,
  } satisfies BetterAuthClientPlugin
}
