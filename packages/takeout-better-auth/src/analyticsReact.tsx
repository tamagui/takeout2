import { useEffect, type ReactNode } from 'react'
import type { AppAnalyticsClient } from './analytics'

export function AppAnalyticsProvider({
  client,
  children,
}: {
  client: AppAnalyticsClient
  children: ReactNode
}) {
  useEffect(() => {
    void client.captureAppOpen()
  }, [client])
  return children
}
