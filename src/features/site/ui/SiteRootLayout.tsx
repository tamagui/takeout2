import { usePathname } from 'one'
import { YStack } from 'tamagui'

import { PageMainContainer } from '~/interface/layout/PageContainer'

import { SiteFooter } from './SiteFooter'
import { SiteHeader } from './SiteHeader'

import type { ReactNode } from 'react'

export function SiteRootLayout({ children }: { children: ReactNode }) {
  const isLoggedIn = usePathname().startsWith('/home')

  return (
    <YStack flex={1} minH="100vh">
      {isLoggedIn ? null : <SiteHeader />}
      <PageMainContainer py={isLoggedIn ? 0 : '$12'}>{children}</PageMainContainer>
      {isLoggedIn ? null : <SiteFooter />}
    </YStack>
  )
}
