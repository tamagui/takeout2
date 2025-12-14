import { Paragraph, Separator, YStack, styled } from 'tamagui'

import { HeadInfo } from '~/interface/app/HeadInfo'
import { Link } from '~/interface/app/Link'
import { TechLogos } from '~/interface/home/TechLogos'
import { H2, H3, H4, SepHeading } from '~/interface/text/Headings'

const Hero = styled(H2, {
  size: '$8',
  fontWeight: '800',
  maxW: 650,
  text: 'center',

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
    <YStack gap="$4" py="$8">
      <HeadInfo
        title="Takeout"
        description="A better starting point for building cross-platform applications with React and React Native."
      />
      <YStack items="center">
        <Hero>A new way to build apps</Hero>

        <H3
          color="$color11"
          maxW={620}
          mt="$5"
          size="$7"
          $md={{
            text: 'center',
          }}
        >
          Takeout is a better starting point for building cross-platform applications
          with&nbsp;React and React&nbsp;Native.
        </H3>

        <Separator my="$6" self="stretch" mx={100} opacity={0.5} />

        <TechLogos />

        <Separator my="$6" self="stretch" mx={100} opacity={0.5} />
      </YStack>

      <YStack gap="$5" maxW={550} self="center">
        <Paragraph size="$6">
          Takeout is a{' '}
          <Link href="https://www.youtube.com/watch?v=HHTYHm6qLFY" target="_blank">
            long-term effort
          </Link>{' '}
          to bring more Rails-like elegance to cross-platform React and React Native. It
          uses exciting developments in frontend tech, alongside a lot of elbow grease, to
          give you a performant and platform-native experience, with simple, DRY
          code—unlike anything before.
        </Paragraph>

        <Paragraph size="$6">
          Takeout avoids reinventing the wheel by leveraging a few great third-party
          libraries. It also lets you unplug the pieces you don't want.
        </Paragraph>

        <Paragraph size="$6">
          React can be great - with enough effort. When we announced{' '}
          <Link href="https://onestack.dev" target="_blank">
            One
          </Link>{' '}
          about a year ago we did so because we had a vision - simpler code, better UX.
          Today, Takeout realizes this vision.
        </Paragraph>

        <Paragraph size="$6">
          <b>For the first time,</b> you can share this much code across web, iOS, and
          Android—and still get great performance while fully leveraging platform-native
          primitives. One set of routes, one styling system, one UI kit, one framework.
          Same helpers, hooks, and data layer everywhere.
        </Paragraph>

        <Paragraph size="$6">
          Hit Lighthouse 100 without breaking a sweat, just like this very page does.
          Choose SSG or SSR for pages that need SEO, or just use SPA mode where it doesn't
          matter. No layout shifts, no hydration flicker—just typed inline styles, media
          queries, dark mode, spring animations, and more.
        </Paragraph>

        <SepHeading>Goals</SepHeading>

        <ul>
          <li style={{ marginBottom: 20 }}>
            <div>
              <Paragraph size="$6">
                <b>Universal</b> — Target iOS, Android, and Web using React and React
                Native <em>with shared code</em>. You don't have to share it all, and you
                don't have to target every platform - but you can, effectively, with ease.
              </Paragraph>
            </div>
          </li>

          <li style={{ marginBottom: 20 }}>
            <div>
              <Paragraph size="$6">
                <b>DRY and simple</b> — A single repo, bundler, framework, router, and set
                of routes. A single way to do styling, UI, data. All of your backend,
                frontend, and infrastructure in code, in one place, without a monorepo. A
                solid suite of hooks and helpers. And data that is simple to use,
                typesafe, syncs in realtime and mutates optimistically, all without any
                glue code - with rich querying, relations, permissions, schema and
                migrations.
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
                <b>Low risk</b> — Every library chosen aims to maximize for: OSS, popular,
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
          One ports Expo Router to Vite, adding loaders and render modes for great
          websites. Server render or statically generate some pages, keep others
          client-only—all from the same file-system routes, with API routes and a Hono
          production server included.
        </Paragraph>

        <Paragraph size="$6">
          With the new <b>Metro-mode</b>, you get Vite's simplicity for web while
          optionally running Metro in the background for native—best of both worlds, with
          Rolldown-based native bundling on the roadmap.
        </Paragraph>

        <H4 mt="$2" size="$5" fontWeight="bold">
          Zero
        </H4>

        <Paragraph size="$6">
          Zero is the biggest step-change in frontend since React itself. It solves the
          hardest part: getting data to the client, keeping it in sync, and mutating it
          instantly. It's like Firebase if it was OSS, ran on Postgres and had relations,
          nice types, schemas, and optimistic mutations.
        </Paragraph>

        <Paragraph size="$6">
          Our{' '}
          <Link href="https://github.com/tamagui/takeout3/blob/main/packages/over-zero/readme.md">
            <b>over-zero</b>
          </Link>{' '}
          library makes it even easier to use and integrates auth, plus adds a CLI to
          generate boilerplate code.
        </Paragraph>

        <H4 mt="$2" size="$5" fontWeight="bold">
          Tamagui
        </H4>

        <Paragraph size="$6">
          Tamagui still offers the best balance of performance on web and native, with the
          largest featureset of any style library, and most robust UI kit, theme system,
          and ecosystem.
        </Paragraph>

        <Paragraph size="$6">
          <Link href="https://tamagui.dev/blog/version-two">Version 2</Link> ships
          alongside Takeout with some new components, improved stability and docs, and a
          lot of nice AI integration and simplifications.
        </Paragraph>

        <H4 mt="$2" size="$5" fontWeight="bold">
          Agents
        </H4>

        <Paragraph size="$6">
          Our goal was simple - you can point a coding agent at Takeout and get an entire
          app into production just by prompting. Beyond extensive docs, we built a Takeout
          CLI that organizes docs and scripts into a self-documenting structure.
        </Paragraph>

        <H4 mt="$2" size="$5" fontWeight="bold">
          And more
        </H4>

        <Paragraph size="$6">
          Shared packages for helpers, hooks, postgres, and scripts. <b>Better Auth</b>{' '}
          integration with Zero and One. Our favorite <b>Expo dependencies</b> for better
          native UI and functionality. <b>Uncloud</b> and <b>SST</b> for production.
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
