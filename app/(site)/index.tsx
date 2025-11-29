import { H1, H2, H3, H4, Paragraph, Separator, XStack, YStack, styled } from 'tamagui'
import { InfoCard } from '~/features/site/ui/InfoCard'
import { Link } from '~/interface/app/Link'
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
    <YStack gap="$4" py="$12">
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
          Takeout is a better starting point for building cross-platform applications
          with&nbsp;React and React&nbsp;Native.
        </H2>
      </YStack>

      <Separator my="$6" mx={100} opacity={0.5} />

      <YStack gap="$5" maxW={550} self="center">
        <Paragraph size="$6">
          Takeout is the result of years of effort to try to bring{' '}
          <em>Rails-like simplicity</em> to modern React - including React Native. It
          makes shipping cross-platform apps dramatically easier, but it's also a great
          web-only or native-only stack.
        </Paragraph>

        <Paragraph size="$6">
          We think it represents the first time ever you can ship world-class{' '}
          <b>web and native</b> experiences with large amounts of shared code ‒ without
          sacrificing one of the usual suspects: simplicity, performance, or user
          experience.
        </Paragraph>

        <Paragraph size="$6">
          Unlike Rails, Takeout is a "take it or leave it" stack that leverages
          best-in-class third party libaries and lets you unplug any part. That said,{' '}
          <em>the hard part of modern React is</em> finding great libraries, gluing them
          together, and making them work well.
        </Paragraph>

        <XStack mt="$6" mb="$4" items="center" gap="$6">
          <H3 size="$3" color="$color10">
            Goals
          </H3>
          <Separator opacity={0.5} />
        </XStack>

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
                <b>DRY and simple</b> — A single router, bundler, framework, and set of
                routes. A single UI kit, data layer, and suite of utilities. A single repo
                infrastructure as code. No monorepo or mess. Data just works - no glue
                code, automatic syncing and optimistic mutations with simple permissions,
                schema and migrations.
              </Paragraph>
            </div>
          </li>

          <li style={{ marginBottom: 20 }}>
            <div>
              <Paragraph size="$6">
                <b>Platform-native</b> — Ship a top-tier experience on every platform. A{' '}
                <b>website</b> with great Lighthouse scores using all the latest CSS
                features and perfectly hydrated static or server rendered pages even when
                using animations, media queries, and light/dark mode.{' '}
                <b>But also a web app</b> that can be client-noly, no server fuss, great
                performance and fully shared code. And finally, of course,{' '}
                <b>native apps</b> with native UI, navigation, Liquid Glass and Material
                UI.
              </Paragraph>
            </div>
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
                <b>Low risk</b> — Every library chosen aims to maximize the stats:
                OSS-friendly, popular, type-safe, fast, powerful, and well-documented.
              </Paragraph>
            </div>
          </li>
        </ul>

        <XStack mt="$6" mb="$4" items="center" gap="$6">
          <H3 size="$3" color="$color10">
            In the box
          </H3>
          <Separator opacity={0.5} />
        </XStack>

        <H4 mt="$2" size="$5" fontWeight="bold">
          One
        </H4>

        <Paragraph size="$6">
          A huge obstacle to building truly great cross-platform apps is the
          bundler/framework. While Expo Router is well designed, Metro struggles with web.
          So One does something simple - port Expo Router to Vite. Then it adds a few
          features we think are necessary for great websites and webapps.
        </Paragraph>

        <Paragraph size="$6">
          You end up with a single set of typed file-system routes that Just Work™️ on
          native and web. And, One now <b>defaults to Metro</b> for native to remove the
          risk of a custom bundler and let us focus on shipping great features.
        </Paragraph>

        <Paragraph size="$6">
          Those features are many - server-render or statically generate <em>some</em>{' '}
          pages, while keeping others client-only for simplicity. Add in powerful, fully
          typed loaders to the simple per-page render modes (SSR, SSG, and SPA) and you
          finally don't have to sacrifice your Lighthouse score, or get a PhD in server
          components to ship great web experiences. Plus other goodies, like API routes
          and a built-in Hono production server.
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
          apps, and then pullng it out into a library and this repo. The library is{' '}
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
          break, don't work at all, or don't support server rendering .
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
          Tamagui 2 is out and it's an big improvement in every way - more aligned to web
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
          <b>a lot documentation provided at the right time and place</b>, an incredibly{' '}
          <b>well-structured, DRY codebase</b>, plus a lot of nice <b>glue and scripts</b>{' '}
          to link it all together.
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

        <XStack mt="$6" mb="$4" items="center" gap="$6">
          <H3 size="$3" color="$color10">
            Fin
          </H3>
          <Separator opacity={0.5} />
        </XStack>

        <Paragraph size="$6">I love this stack.</Paragraph>

        <Paragraph size="$6">
          That, my friends, is such a relief to finally say.
        </Paragraph>

        <Paragraph size="$6">
          For 10 years with React, and 6 years with React Native,{' '}
          <b>this was never even remotely true</b>.
        </Paragraph>

        <Paragraph size="$6">
          But I do seriously love this stack, nearly every inch of it. While it's still
          definitely in beta and there's many way to improve, the fundamentals and tech
          are exactly what I've dreamed of for so long.{' '}
          <b>I hope you and/or your team enjoy it and find it useful, too</b>.
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
