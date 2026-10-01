import { Theme, YStack } from 'tamagui'
import { ContentSection } from './ContentSection'
import { HeroSection } from './HeroSection'
import { HomeBackground } from './HomeBackground'
import { SiteFooter } from './SiteFooter'
import { SiteHeader } from './SiteHeader'

export function TakeoutWebsite() {
  return (
    <Theme name="takeout">
      <YStack position="relative" minH="100vh" width="100%" bg="background">
        <HomeBackground />
        <SiteHeader />
        <YStack render="main" width="100%" minW={340} maxW="md:920px lg:1120px xl:1200px" mx="auto" px={18} py={88}>
          <HeroSection />
          <ContentSection />
        </YStack>
        <SiteFooter />
      </YStack>
    </Theme>
  )
}

export default TakeoutWebsite
