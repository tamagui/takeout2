import { expoClient } from '@better-auth/expo/client'

export function platformClient() {
  // nothing on web
  return {
    id: `platform`,
  } as any as ReturnType<typeof expoClient>
}
