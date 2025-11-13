import { H1, H2, Paragraph, XStack, YStack } from 'tamagui'
import { DatabaseIcon } from '~/interface/icons/phosphor/DatabaseIcon'
import { StackIcon } from '~/interface/icons/phosphor/StackIcon'
import { FolderOpenIcon } from '~/interface/icons/phosphor/FolderOpenIcon'
import { CircleNotchIcon } from '~/interface/icons/phosphor/CircleNotchIcon'
import { DeviceTabletIcon } from '~/interface/icons/phosphor/DeviceTabletIcon'
import { TriangleIcon } from '~/interface/icons/phosphor/TriangleIcon'
import { InfoCard } from '~/features/site/components/InfoCard'

export function IndexPage() {
  return (
    <YStack gap="$6" py="$8">
      <YStack gap="$4" items="center">
        <H1 size="$10" fontWeight="700">
          Build Better Apps
        </H1>
        <H2 size="$7" color="$color11" maxW={700}>
          A modern framework for building web and native applications with React. Fast,
          flexible, and built for the future.
        </H2>
      </YStack>

      <YStack gap="$4" mt="$8">
        <XStack
          mx="$-8"
          flexWrap="wrap"
          columnGap="$5"
          rowGap="$1"
          mb="$8"
          $sm={{ mx: 0 }}
        >
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
          <InfoCard title="Modern Build System" Icon={ViteIcon}>
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

const ViteIcon = (props: any) => <TriangleIcon rotate="180deg" {...props} />
