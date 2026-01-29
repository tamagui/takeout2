import { YStack } from 'tamagui'

import { HeadInfo } from '~/interface/app/HeadInfo'
import { ContentSection } from '~/interface/landing/ContentSection'
import { HeroSection } from '~/interface/landing/HeroSection'
import { HomeBackground } from '~/interface/landing/HomeBackground'

const ogImageUrl = `${process.env.ONE_SERVER_URL}/og.jpg`

export function IndexPage() {
  return (
    <YStack position="relative">
      <HeadInfo
        title="Takeout"
        description="The production-ready starter for building real-time, cross-platform apps with React and React Native."
        openGraph={{
          images: [{ url: ogImageUrl, width: 1200, height: 630 }],
        }}
      />

      <HeroSection />

      <ContentSection />
    </YStack>
  )
}
