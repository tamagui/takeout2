import { YStack } from 'tamagui'

import { HeadInfo } from '~/interface/app/HeadInfo'
import { ContentSection, HeroSection } from '~/interface/landing'

export function IndexPage() {
  return (
    <YStack position="relative">
      <HeadInfo
        title="Takeout"
        description="The production-ready starter for building real-time, cross-platform apps with React and React Native."
      />

      <HeroSection />

      <ContentSection />
    </YStack>
  )
}
