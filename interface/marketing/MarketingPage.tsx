import { useUserScheme } from 'one'
import { Theme, YStack } from 'tamagui'
import { HomeBackground } from './HomeBackground'
import { SiteFooter } from './SiteFooter'
import { SiteHeader } from './SiteHeader'
import type { ReactNode } from 'react'

export function MarketingPage({ children }: { children: ReactNode }) {
  const { value } = useUserScheme()
  return (
    <Theme name={value === 'dark' ? 'dark_takeout' : 'light_takeout'}>
      <YStack position="relative" minH="100vh" width="100%" bg="background">
        <HomeBackground />
        <SiteHeader />
        <YStack
          render="main"
          width="100%"
          minW={340}
          maxW="md:920px lg:1120px xl:1200px"
          mx="auto"
          px={18}
          py={88}
        >
          {children}
        </YStack>
        <SiteFooter />
      </YStack>
    </Theme>
  )
}
