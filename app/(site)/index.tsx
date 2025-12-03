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
          Takeout is the result of years of effort to bring <em>Rails-like elegance</em>{' '}
          to modern cross-platform React and React Native projects. We wanted to bring the
          DRY, simple, cohesive parts of Rails to React, while avoiding the
          overly-abstracted, NIH, magical parts.
        </Paragraph>

        <Paragraph size="$6">
          We think Takeout represents the first time you can ship world-class{' '}
          <b>web and native</b> experiences, even with large amounts of shared code. By
          world-class, we mean you won't sacrifice one of the usual suspects: simplicity,
          performance, or user experience.
        </Paragraph>

        <Paragraph size="$6">
          Takeout is a "take it or leave it" stack that leverages best-in-class third
          party libraries, letting you unplug any part. It's a bit experimental, it puts
          together a few newer libraries to achieve{' '}
          <Link href="https://www.youtube.com/watch?v=HHTYHm6qLFY" target="_blank">
            a vision we've had for a decade
          </Link>
          .
        </Paragraph>

        <Paragraph size="$6">
          What makes React great is the fundamental model and the ecosystem. The worst
          parts as we see it came mostly down to dealing with data, picking from a
          thousand options, and then the extensive time it takes to refine everything once
          you do pick your stack.
        </Paragraph>

        <Paragraph size="$6">
          Takeout is a cutting edge stack with a couple suprisingly great libraries and
          few strong opinions that solve the above problems.
        </Paragraph>

        <SepHeading>Goals</SepHeading>

        <Paragraph size="$6">
          We can save a lot of time in the next section by first establishing the goals of
          Takeout.
        </Paragraph>

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
          Expo Router to Vite, then it adds a few features we think are necessary.
        </Paragraph>

        <Paragraph size="$6">
          When One launched it ambitously aimed to make Vite work as the bundler for
          Native, but we realized it was too hard a sell - a small team supporting a new
          platform with an ecosystem famous for terrible publishing practices. So, to fix
          that, <b>One introduces Metro-mode</b> - get the beautiful configuration
          simplicity of Vite, but have it optionally run Metro for native for the proven
          track record. It lets us focus on shipping features, and greatly de-risks the
          framework.
        </Paragraph>

        <Paragraph size="$6">
          One lets you server render or statically generate <em>some</em> pages, while
          keeping others client-only. Add in powerful, typed loaders and routing, API
          routes, an included Hono production server, and smart configuration to make
          React Native behave well on Vite, and you have the only universal stack that
          lets you get amazing Lighthouse scores on the routes you need it and simple
          client-side apps wherever else.
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
          Zero is revolutionary technology, in our opinion the biggest step change in
          frontend since React itself. The biggest, hairiest problem in frontend has been{' '}
          <em>how do you get data to the client, keep it up to date, and mutate it</em> in
          a simple, fast manner. Zero does just that. The shortest description of it is if
          Firebase was OSS, ran on top of Postgres, supported relations, and automatically
          handled optimistic mutations.
        </Paragraph>

        <Paragraph size="$6">
          We spent the last year deploying it to production across multiple apps,
          re-writing everything a few times, finding the right abstractions between the
          apps, and then pulling it out into a library and this repo. The library is{' '}
          <b>over-zero</b>. It's small, but helps a ton in setting up a nice Zero setup,
          and includes a little CLI that can generate a lot of glue code you'd normally
          have to write.
        </Paragraph>

        <H4 mt="$2" size="$5" fontWeight="bold">
          Tamagui
        </H4>

        <Paragraph size="$6">
          No other universal styling solution has the deep investment in making both web
          and native performant, feature-complete, platform-native, and easy to use like
          Tamagui.
        </Paragraph>

        <Paragraph size="$6">
          We'd venture that even if your team is intimately familiar with Tailwind, you'd
          not only ship a better universal app with Tamagui, but you'd even do it faster
          in the short-term. A bold claim, but -
        </Paragraph>

        <Paragraph size="$6">
          First, Tamagui is actually great with LLMs. It's been around for 5 years, and
          we've invested recently into auto-generating great prompts to much success.
        </Paragraph>

        <Paragraph size="$6">
          Second, Tamagui simply has a ton of vertically integrated investment. We
          designed the style engine for both platforms from the start, including advanced
          features like media queries, container queries, themes, and more that either
          break, don't work at all, or don't support server rendering.
        </Paragraph>

        <Paragraph size="$6">
          Building on that, the component library also was designed from the start to work
          well, and adapt to both native and web. The team has spent countless nights
          hammering at arcane issues (thanks, Safari), and we think it shows when you're
          actually in the weeds building real apps. The Takeout repo has incredibly
          elegant Dialogs, Sheets, Tooltips, etc.
        </Paragraph>

        <Paragraph size="$6">
          And finally, we think that{' '}
          <em>
            generating and learning style syntax is easy, what's hard is the stuff you run
            into on month 2 - sharing animations performantly, flicker-free server
            rendering, complex components
          </em>
          and Tamagui has deep vertically integrated investment into getting the low-level
          stuff right.
        </Paragraph>

        <Paragraph size="$6">
          Tamagui 2 is out and it's a big improvement in every way - more aligned to web
          and native, less sharp edges, simpler usage and setup, more components, better
          docs, and better performance.
        </Paragraph>

        <H4 mt="$2" size="$5" fontWeight="bold">
          Agents / Harnessing
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
          For 10 years with React, and 6 years with React Native, I've loved the model,
          but never loved the stack. I can now finally say, with Takeout, I love the big
          picture. <b>I hope you and your team do too</b>.
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
