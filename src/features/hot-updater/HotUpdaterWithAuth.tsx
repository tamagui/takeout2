import { useAuth } from '~/auth/client/authClient'
import type { AuthData } from '~/auth/types'
import { HotUpdaterProvider } from './HotUpdater'

export function HotUpdaterWithAuth({ children }: { children: React.ReactNode }) {
  const auth = useAuth()

  // Convert auth session to AuthData format
  const authData: AuthData | null = auth?.user
    ? {
        id: auth.user.id,
        email: auth.user.email,
        role: auth.user.role === 'admin' ? 'admin' : undefined,
      }
    : null

  return <HotUpdaterProvider authData={authData}>{children}</HotUpdaterProvider>
}
