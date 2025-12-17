import { H1, Paragraph, Separator, YStack, styled } from 'tamagui'

import { CodeInline } from '~/features/docs'
import { HeadInfo } from '~/interface/app/HeadInfo'
import { Link } from '~/interface/app/Link'
import { TechLogos } from '~/interface/home/TechLogos'
import { H3, H4, SepHeading } from '~/interface/text/Headings'

const Hero = styled(H1, {
  size: '$9',
  fontWeight: '800',
  maxW: 550,
  text: 'center',

  $sm: {
    size: '$10',
    fontWeight: '800',
  },

  $md: {
    size: '$11',
    fontWeight: '800',
  },
})

export function IndexPage() {
  return (
    <YStack gap="$4" py="$8">
      <HeadInfo
        title="Takeout"
        description="A better starting point for building cross-platform applications with React and React Native."
      />
      <YStack items="center">
        <Hero>Ultra high quality apps, shipped faster than slop</Hero>

        <H3
          color="$color11"
          maxW={620}
          mt="$5"
          size="$7"
          fontWeight="400"
          $md={{
            text: 'center',
          }}
        >
          Takeout makes the best possible all-in-one React&nbsp;and&nbsp;React&nbsp;Native
          stack as easy to use as possible.
        </H3>

        <YStack width="100%" my="$2">
          <Separator my="$5" self="stretch" mx={100} opacity={0.5} />
          <TechLogos />
          <Separator my="$5" self="stretch" mx={100} opacity={0.5} />
        </YStack>
      </YStack>

      <YStack gap="$5" maxW={550} self="center">
        <Paragraph size="$6">
          <strong>TL;DR:</strong> Takeout is{' '}
          <strong>
            an extremely robust stack that builds on two brand new technologies in
            frontend development
          </strong>
          , alongside a few years of effort, to achieve a truly world-class stack for
          apps.
        </Paragraph>

        <Paragraph size="$6">
          Today, we're releasing Takeout 2 RC 1. Takeout aims to bring more Rails-like
          cohesion to cross-platform React and React Native, using exciting developments
          in frontend tech, alongside a lot of elbow grease, to finally bring together
          great DX and UX into a simple, fun to work with repo.
        </Paragraph>

        <Paragraph size="$6">
          <b>
            For the first time you can share as much UI, routing, and data code as you
            want across web, iOS, and Android, and still get incredible performance and
            native-feel everywhere.
          </b>
        </Paragraph>

        <Paragraph size="$6">
          That includes getting 100 performance scores on Lighthouse, just like this very
          page, something only possible due to years of dogged persistance building out
          our libraries{' '}
          <Link href="https://tamagui.dev" target="_blank">
            Tamagui
          </Link>{' '}
          and{' '}
          <Link href="https://onestack.dev" target="_blank">
            One
          </Link>
          , and it's just the start of what makes Takeout special.
        </Paragraph>

        <SepHeading>Goals</SepHeading>

        <ul>
          <li style={{ marginBottom: 20 }}>
            <div>
              <Paragraph size="$6">
                <b>Universal</b> — Target iOS, Android, Web and Desktop using React and
                React Native <em>with shared code that runs fast</em>. You don't have to
                share it all, and you don't have to target every platform - but you can,
                effectively, with ease.
              </Paragraph>
            </div>
          </li>

          <li style={{ marginBottom: 20 }}>
            <div>
              <Paragraph size="$6">
                <b>DRY and simple</b> — A single repo, package.json, bundler, framework,
                and router, a single set of routes, hooks, and helpers, and a single way
                to do styling, UI, and data. All of your backend, frontend, and
                infrastructure lives in code and deploys with a push. And data that is
                incredible simple to work with, typesafe, realtime, and optimistically
                mutated for free with without any glue code.
              </Paragraph>
            </div>
          </li>

          <li style={{ marginBottom: 20 }}>
            <div>
              <Paragraph size="$6">
                <b>Platform-native</b> — A top-tier experience on every platform, served
                from a single Vite app and file system route setup:
              </Paragraph>
            </div>

            <ul>
              <li style={{ marginTop: 15 }}>
                <div>
                  <Paragraph size="$6">
                    A <b>website</b> with great Lighthouse scores using all the latest CSS
                    features and perfectly hydrated static or server rendered pages even
                    when using animations, media queries, and light/dark mode.
                  </Paragraph>
                </div>
              </li>

              <li style={{ marginTop: 15 }}>
                <div>
                  <Paragraph size="$6">
                    A <b>web app</b> that can be client-only, no server fuss, great
                    performance and fully shared code.
                  </Paragraph>
                </div>
              </li>

              <li style={{ marginTop: 15 }}>
                <div>
                  <Paragraph size="$6">
                    And of course, <b>native iOS and Android apps</b> with native UI and
                    navigation, leveraging Liquid Glass and Material UI.
                  </Paragraph>
                </div>
              </li>
            </ul>
          </li>

          <li style={{ marginBottom: 20 }}>
            <div>
              <Paragraph size="$6">
                <b>Fast, both ways</b> — Fast in both development speed and runtime
                performance (highly relevant below).
              </Paragraph>
            </div>
          </li>

          <li>
            <div>
              <Paragraph size="$6">
                <b>Low risk</b> — Self host or deploy to the cloud easily. Runs on
                Postgres. Every library chosen to ensure it's OSS-first, popular,
                type-safe, fast, single-purpose, well-maintained, and well-documented.
              </Paragraph>
            </div>
          </li>
        </ul>

        <SepHeading>In the box</SepHeading>

        <H4 mt="$2" size="$5" fontWeight="bold">
          One
        </H4>

        <Paragraph size="$6">
          Vite simply mogs any other bundler for web, and we love how fast and flexible it
          is. One ports Expo Router to Vite, adding tons of great stuff like loaders and
          render modes (which are required for great web performance). Server render or
          statically generate some pages, keep others client-only, all from the same
          routing definitions. Plus API routes and a Hono production server for free.
        </Paragraph>

        <Paragraph size="$6">
          With the new <b>Metro-mode</b>, you get Vite's simplicity for web while
          optionally running Metro in the background for native — the best of both worlds.
          One is now stable and we just release v1 RC1.
        </Paragraph>

        <H4 mt="$2" size="$5" fontWeight="bold">
          Zero
        </H4>

        <Paragraph size="$6">
          Zero is the biggest step-change in frontend since React itself. It solves the
          worst area of frontend development today: getting data to the client, keeping it
          in sync, and mutating it instantly. It's like Firebase if it was OSS, ran on
          Postgres, and had relations, types, schemas, and optimistic mutations.
        </Paragraph>

        <Paragraph size="$6">
          Our{' '}
          <Link href="https://github.com/tamagui/takeout3/blob/main/packages/over-zero/readme.md">
            <b>over-zero</b>
          </Link>{' '}
          library makes it even easier to use and integrates auth, plus adds a CLI to
          generate some of the boilerplate glue code, if you like.
        </Paragraph>

        <H4 mt="$2" size="$5" fontWeight="bold">
          Tamagui
        </H4>

        <Paragraph size="$6">
          Tamagui still offers the best balance of performance on web <em>and</em> native,
          with the largest featureset of any style library, beautifully typed and mergable
          inline styles, and the most robust UI kit, theme system, and ecosystem.
        </Paragraph>

        <Paragraph size="$6">
          <Link href="https://tamagui.dev/blog/version-two">
            Version 2 RC1 is out now
          </Link>{' '}
          and brings much needed test coverage, docs, and release guardrails, some new
          components, and a lot of nice AI integration improvements.
        </Paragraph>

        <H4 mt="$2" size="$5" fontWeight="bold">
          Agents
        </H4>

        <Paragraph size="$6">
          Our goal was simple - you can point a coding agent at Takeout and get an entire
          app into production just by prompting. We have a powerful new{' '}
          <CodeInline>takeout</CodeInline> CLI that works with a new well-structured and
          included scripts and docs system that makes one-shotting features and fixes the
          expectation.
        </Paragraph>

        <H4 mt="$2" size="$5" fontWeight="bold">
          And more
        </H4>

        <Paragraph size="$6">
          So much more. Tons of scripts, helpers, hooks, and libraries. <b>Better Auth</b>{' '}
          integration. Our favorite <b>native dependencies</b> for better native UI and
          functionality. And the choice to deploy with either <b>Uncloud</b> or <b>SST</b>{' '}
          out of the box.
        </Paragraph>

        <SepHeading>Fin</SepHeading>

        <Paragraph size="$6">
          We built Takeout for ourselves, much like Tamagui and One - passion projects
          born out of stubbornly wanting better things. We hope you enjoy this somewhat
          early version of our new stack.
        </Paragraph>

        <Paragraph size="$6">
          -{' '}
          <Link href="https://x.com/natebirdman" target="_blank">
            Nate
          </Link>
        </Paragraph>
      </YStack>

      {/* <Separator my="$6" mx={100} opacity={0.5} /> */}

      {/* <YStack gap="$4" mt="$4" $md={{ mt: '$8' }}>
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
      </YStack> */}

      {/* <YStack gap="$3" items="center" mt="$6">
        <Paragraph text="center" size="$5" color="$color11">
          Get started in minutes with our comprehensive documentation and examples.
        </Paragraph>
      </YStack> */}
    </YStack>
  )
}
