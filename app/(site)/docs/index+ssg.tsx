import { H1, H2, Paragraph, YStack } from 'tamagui'

import { HeadInfo } from '~/interface/app/HeadInfo'
import { Link } from '~/interface/app/Link'

export function DocsIndexPage() {
  return (
    <YStack gap="$4">
      <HeadInfo
        title="Documentation"
        description="Learn how to use and customize Takeout for building cross-platform applications."
      />
      <H1 size="$10" mb="$4">
        Documentation
      </H1>

      <Paragraph size="$6" lineHeight="$7" color="$color11" mb="$6">
        Welcome to the Takeout documentation. Learn how to use and customize your app.
      </Paragraph>

      <YStack gap="$6">
        <YStack gap="$3">
          <H2 size="$7">Getting Started</H2>
          <Paragraph size="$5" lineHeight="$6" color="$color11">
            New to Takeout? Start here to learn the basics and get up and running quickly.
          </Paragraph>
          <Link href="/docs/getting-started">
            <Paragraph color="$blue10" hoverStyle={{ color: '$blue11' }}>
              Read the Getting Started guide →
            </Paragraph>
          </Link>
        </YStack>

        <YStack gap="$3">
          <H2 size="$7">Installation</H2>
          <Paragraph size="$5" lineHeight="$6" color="$color11">
            Learn how to install and set up Takeout in your development environment.
          </Paragraph>
          <Link href="/docs/installation">
            <Paragraph color="$blue10" hoverStyle={{ color: '$blue11' }}>
              View installation instructions →
            </Paragraph>
          </Link>
        </YStack>

        <YStack gap="$3">
          <H2 size="$7">Architecture</H2>
          <Paragraph size="$5" lineHeight="$6" color="$color11">
            Understand how Takeout works under the hood.
          </Paragraph>
          <Link href="/docs/architecture">
            <Paragraph color="$blue10" hoverStyle={{ color: '$blue11' }}>
              Explore the architecture →
            </Paragraph>
          </Link>
        </YStack>
      </YStack>
    </YStack>
  )
}
