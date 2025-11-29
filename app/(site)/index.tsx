import { H1, H2, Paragraph, XStack, YStack, styled } from 'tamagui'
import { InfoCard } from '~/features/site/ui/InfoCard'
import { CircleNotchIcon } from '~/interface/icons/phosphor/CircleNotchIcon'
import { DatabaseIcon } from '~/interface/icons/phosphor/DatabaseIcon'
import { DeviceTabletIcon } from '~/interface/icons/phosphor/DeviceTabletIcon'
import { FolderOpenIcon } from '~/interface/icons/phosphor/FolderOpenIcon'
import { StackIcon } from '~/interface/icons/phosphor/StackIcon'
import { TriangleIcon } from '~/interface/icons/phosphor/TriangleIcon'

const Hero = styled(H1, {
  size: '$8',
  fontWeight: '800',

  $sm: {
    size: '$9',
    fontWeight: '800',
  },

  $md: {
    size: '$10',
    fontWeight: '800',
  },
})

export function IndexPage() {
  return (
    <YStack gap="$4" py="$10">
      <YStack items="center">
        <Hero>Build better</Hero>
        <Hero>cross-platform apps</Hero>

        <H2
          size="$4"
          color="$color11"
          maxW={650}
          mt="$5"
          text="center"
          $md={{ size: '$6' }}
        >
          A modern framework for building web and native applications with&nbsp;React.
          Fast, flexible, and built for the future.
        </H2>
      </YStack>

      <YStack gap="$4" mt="$4" $md={{ mt: '$8' }}>
        <XStack flexWrap="wrap" columnGap="$5" rowGap="$1" mb="$8">
          <InfoCard title="Typed FS Routing" Icon={FolderOpenIcon}>
            Typed file-system routing with nested layouts and groups for organized
            navigation.
          </InfoCard>
          <InfoCard title="Routing Modes" Icon={StackIcon}>
            Flexible rendering with SPA, SSR, or SSG modes for any page.
          </InfoCard>
          <InfoCard title="Loaders" Icon={CircleNotchIcon}>
            Type-safe data loaders make it simple to fetch and manage your data.
          </InfoCard>
          <InfoCard title="Web + Native" Icon={DeviceTabletIcon}>
            Build for web with React, or native with React Native, or target both
            platforms at once.
          </InfoCard>
          <InfoCard title="Modern Build System" Icon={TriangleIcon}>
            Powered by modern tooling for fast development and optimized production
            builds.
          </InfoCard>
          <InfoCard title="Real-time Sync" Icon={DatabaseIcon}>
            Built-in support for real-time data synchronization and offline-first
            capabilities.
          </InfoCard>
        </XStack>
      </YStack>

      <YStack gap="$3" items="center" mt="$6">
        <Paragraph text="center" size="$5" color="$color11">
          Get started in minutes with our comprehensive documentation and examples.
        </Paragraph>
      </YStack>
    </YStack>
  )
}
