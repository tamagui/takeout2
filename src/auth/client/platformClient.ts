import type { BetterAuthClientPlugin } from 'better-auth'

export function platformClient(): BetterAuthClientPlugin {
  // nothing on web
  return {
    id: `platform`,
  }
}
