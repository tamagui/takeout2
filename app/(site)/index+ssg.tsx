import { Paragraph, Separator, YStack, styled } from 'tamagui'

import { Link } from '~/interface/app/Link'
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
    <YStack gap="$4" py="$12">
      <YStack items="center">
        <Hero>Build better cross-platform apps</Hero>

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
          Takeout is a better starting point for building cross-platform applications
          with&nbsp;React and React&nbsp;Native.
        </H3>
      </YStack>

      <Separator my="$6" mx={100} opacity={0.5} />

      <YStack gap="$5" maxW={550} self="center">
        <Paragraph size="$6">
          Takeout is a{' '}
          <Link href="https://www.youtube.com/watch?v=HHTYHm6qLFY" target="_blank">
            long-term effort
          </Link>{' '}
          to bring more Rails-like elegance to cross-platform React and React Native,
          aimed at creating a performant, cohesive, simple, and DRY stack that's been
          enabled by recent exciting frontend technologies.
        </Paragraph>

        <Paragraph size="$6">
          We think Takeout achieves something for the first time - the ability to ship
          first-class web <em>and</em> native experiences, even with large amounts of
          shared code.
        </Paragraph>

        <Paragraph size="$6">
          But what do we mean "first-class"? Here's an example: this entire site is part a
          a native and web app built with Takeout, and this homepage shares all code with
          the rest of the app - routing, styling, UI, framework - yet achieves a 100
          Lighthouse perfomrance score, server rendered to static content and utilizing
          advanced media queries, dark and light mode, and spring animations, all without
          a single layout shift or flicker as it hydrates and hands off to fully dynamic
          client-side routing.
        </Paragraph>

        <Paragraph size="$6">
          Takeout avoids NIH and pedantism by leveraging a few great third party
          libraries. It also lets you unplug the pieces you don't want.
        </Paragraph>

        <Paragraph size="$6">
          React is great when you put in enough effort. Takeout is our take on baking that
          effort into something cohesive. When we announced{' '}
          <Link href="https://onestack.dev" target="_blank">
            One
          </Link>{' '}
          about a year ago we came out against RSC, instead claiming that sync engines and
          simpler server rendering were the future of frontend. Today, Takeout realizes
          this long-held and consistent vision.
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
          A huge obstacle to building truly great cross-platform apps is the
          bundler/framework. While Expo Router is well designed, its choice of Metro means
          it struggles to ship great web experiences. One does something simple - it ports
          Expo Router to Vite, then it adds a few features we think make for great
          websites like loaders and render modes.
        </Paragraph>

        <Paragraph size="$6">
          One lets you server render or statically generate <em>some</em> pages, while
          keeping others client-only. Add in loaders, routing, API routes, a Hono
          production server, and lots of nice configuration to make React Native packages
          behave well on Vite, and you have a universal stack that actually makes it easy
          to both get amazing Lighthouse scores on some routes, while saving the server
          rendering complexity on others.
        </Paragraph>

        <Paragraph size="$6">
          When One launched, it ambitously aimed to make Vite work standalone as a new
          bundler for React Native. We then realized that was a bit ambitious - the React
          Native ecosystem has incredibly (ahem) <em>diverse</em> package publishing
          standards, our team is small, and the undertaking is large. We still liked Vite
          as a clearly superior bundler, especially for web, but we wanted to both de-risk
          One and improve it's native compatibility. So, <b>introducing Metro-mode</b>.
          You get the configuration simplicity of Vite, unified configuration and FS
          routes of One, but can optionally have Vite{' '}
          <em>run Metro for you in the background</em> to serve your native app. It gives
          you the assurance of a tried-and-true bundler, and lets us focus on both
          shipping features, and more carefully implementing a proper native bundler with
          Rolldown for a future version of One.
        </Paragraph>

        <H4 mt="$2" size="$5" fontWeight="bold">
          Zero
        </H4>

        <Paragraph size="$6">
          When we{' '}
          <Link target="_blank" href="https://rocicorp.com">
            launched One just over a year ago
          </Link>{' '}
          we also announced we were working with the Zero team to make it a first class
          integration. It's taken a bit longer than hoped to get something truly
          production ready, but it's worth the wait.
        </Paragraph>

        <Paragraph size="$6">
          Zero is revolutionary technology, in our opinion the biggest step-change in
          frontend since React itself. The worst part of frontend, for a long time, has
          been{' '}
          <em>
            how do you get data to the client, keep it up to date with the server, and
            mutate it simply and instantly
          </em>
          . Zero does just that in a truly incredible way. You could think of Zero as
          "Firebase but OSS, runs on Postgres, with types, relations, a schema, and
          optimistic mutations".
        </Paragraph>

        <Paragraph size="$6">
          We spent the last year deploying it to production across multiple apps,
          re-writing everything a few times, and then finding some simple abstractions
          between the apps. We then pulled what we could into a shared library. That
          library is{' '}
          <Link href="https://github.com/tamagui/takeout3/blob/main/packages/over-zero/readme.md">
            <b>over-zero</b>
          </Link>
          . It's small, but makes Zero setup and integration with auth a lot simpler,
          including a little CLI that can generate code to keep things DRY.
        </Paragraph>

        <H4 mt="$2" size="$5" fontWeight="bold">
          Tamagui
        </H4>

        <Paragraph size="$6">
          We still like Tamagui because of its deep investment in making both web and
          native performant and platform-native, alongside the fact it's got the richest
          amount of features while maintaining inline, typed styles.
        </Paragraph>

        <Paragraph size="$6">
          We've spent this year fixing what was most broken with Tamagui - stability,
          docs, ease of setup, and LLM-friendliness, and are releasing
          <Link href="https://tamagui.dev/blog/version-two">Version 2</Link> alongside
          Takeout 2.
        </Paragraph>

        <Paragraph size="$6">
          Tamagui is a real secret weapon, especially in the Takeout repo where we've
          included a ton of interface pieces we've designed over the last few years.
          Because the style engine and component kit were designed to be great on both web
          and native from the start, you get advanced features like container queries,
          nesting themes, and swappable spring animation drivers that are super fast
          everywhere.
        </Paragraph>

        <H4 mt="$2" size="$5" fontWeight="bold">
          Agents / Harness
        </H4>

        <Paragraph size="$6">
          Our goal was to be able to point a coding agent at a vanilla Takeout repo get an
          entire custom app into production with just simple, natural prompts.
        </Paragraph>

        <Paragraph size="$6">
          Takeout does this a few ways, but mainly{' '}
          <b>a lot of documentation provided at the right time and place</b>, an
          incredibly <b>well-structured, DRY codebase</b>, plus a lot of nice{' '}
          <b>glue and scripts</b> to link it all together.
        </Paragraph>

        <Paragraph size="$6">
          We also are introducing the `takeout` CLI that acts as a central point of
          interface for your agent - it list and prints both package and repo docs, and
          lists and runs package and repo scripts. The scripting organization and
          implementation alone accounts for a huge part of what makes Takeout great, as
          it's robust and also easily usable by your agent.
        </Paragraph>

        <H4 mt="$2" size="$5" fontWeight="bold">
          All the rest
        </H4>

        <Paragraph size="$6">
          Of course there's much more to making a complete app. Some notable highlights:
        </Paragraph>

        <Paragraph size="$6">
          We abstracted packages `helpers`, `hooks`, `postgres` and `scripts` with a bunch
          of things we found ourselves using across multiple projects.
        </Paragraph>

        <Paragraph size="$6">
          We found <b>Better Auth</b> to be great, and we've built a better-auth-utils
          package and harnessing to link it to Zero and One.
        </Paragraph>

        <Paragraph size="$6">
          And of course we brought in some of our favorite <b>Expo dependencies</b> to
          make native UI and functionality much better.
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
