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
        <Hero>
          Ultra high quality apps, native on every platform, shipped faster than slop.
        </Hero>

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
          Takeout makes the best possible React and React&nbsp;Native stack as easy to use
          as possible.
        </H3>

        <YStack width="100%" my="$2">
          <Separator my="$5" self="stretch" mx={100} opacity={0.5} />
          <TechLogos />
          <Separator my="$5" self="stretch" mx={100} opacity={0.5} />
        </YStack>
      </YStack>

      <YStack gap="$5" maxW={550} self="center">
        <Paragraph size="$6">
          <strong>TL;DR:</strong> Takeout is a multi-year effort to create{' '}
          <strong>
            a new stack built around some new frontend technologies, aimed at dramatically
            simplifying cross-platform development
          </strong>
          . It makes three things much simpler and faster than before: framework, data,
          and UI.
        </Paragraph>

        <Paragraph size="$6">
          Today,{' '}
          <Link href="https://tamagui.dev/takeout">we're releasing Takeout 2 RC 1</Link>.
          Takeout aims to bring more Rails-like cohesion to cross-platform React and React
          Native, using exciting developments in frontend tech (and a lot of elbow grease)
          to finally deliver both great DX and UX into a cohesive setup.
        </Paragraph>

        <Paragraph size="$6">
          Achieve perfect Lighthouse performance scores with ease, just like this page
          does, thanks to our libraries{' '}
          <Link href="https://tamagui.dev" target="_blank">
            Tamagui
          </Link>{' '}
          and{' '}
          <Link href="https://onestack.dev" target="_blank">
            One
          </Link>
          , and then make your app come alive far easier than ever before with{' '}
          <Link href="https://zero.rocicorp.dev">Zero</Link>.
        </Paragraph>

        <SepHeading>Goals</SepHeading>

        <ul>
          <li style={{ marginBottom: 20 }}>
            <div>
              <Paragraph size="$6">
                <b>Universal</b> — Target iOS, Android, Web and Desktop using React and
                React Native with fully shared code{' '}
                <em>that feels native and runs fast</em>. You don't have to share
                everything, you don't have to target every platform - but you can, with
                ease.
              </Paragraph>
            </div>
          </li>

          <li style={{ marginBottom: 20 }}>
            <div>
              <Paragraph size="$6">
                <b>DRY and simple</b> — A single repo,{' '}
                <CodeInline>package.json</CodeInline>, bundler, framework, and router. A
                single set of routes, hooks, and helpers. A single way to do styling, UI,
                and data. All of your backend, frontend, and infrastructure, defined in
                code, deployed with a push. Data queried and mutated quickly, safely,
                simply, and optimistically, with no glue.
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
                    A <b>website</b> with great Lighthouse scores, all the latest CSS
                    features, and perfectly hydrated static or server rendered pages (even
                    when using spring animations, media queries, and light/dark mode,
                    etc).
                  </Paragraph>
                </div>
              </li>

              <li style={{ marginTop: 15 }}>
                <div>
                  <Paragraph size="$6">
                    A <b>web app</b> that can be client-only and look and feel great
                    despite having fully shared code with a performant site.
                  </Paragraph>
                </div>
              </li>

              <li style={{ marginTop: 15 }}>
                <div>
                  <Paragraph size="$6">
                    And of course, <b>native iOS and Android apps</b> with native UI and
                    navigation, Liquid Glass, Material UI, etc.
                  </Paragraph>
                </div>
              </li>
            </ul>
          </li>

          <li style={{ marginBottom: 20 }}>
            <div>
              <Paragraph size="$6">
                <b>Fast, both ways</b> — Fast in both development speed and runtime
                performance.
              </Paragraph>
            </div>
          </li>

          <li>
            <div>
              <Paragraph size="$6">
                <b>Low risk</b> — Self host or deploy to the cloud. Runs on Postgres.
                Unplug parts you don't like. Libraries chosen for being OSS, popular,
                single-purpose, and well maintained and documented.
              </Paragraph>
            </div>
          </li>
        </ul>

        <SepHeading>In the box</SepHeading>

        <H4 mt="$2">
          <Link href="https://onestack.dev" target="_blank">
            One
          </Link>
        </H4>

        <Paragraph size="$6">
          Vite simply mogs any other bundler for web, we love how fast and flexible it is.
          So, One ported Expo Router to Vite, and then added a ton of stuff needed for
          high performance web - especially loaders, and render modes. Server render or
          statically generate some pages, keep others client-only, all from the same
          routing definitions, route between them with perfect preloading. Plus, easy API
          routes and a Hono production server included.
        </Paragraph>

        <Paragraph size="$6">
          With the new <b>Metro-mode</b>, you get Vite's simplicity for web while
          optionally running Metro for native. One is now stable for production use, and{' '}
          <Link href="https://onestack.dev">
            <strong>we just released v1 RC1</strong>
          </Link>
          .
        </Paragraph>

        <H4 mt="$2">
          <Link href="https://zero.rocicorp.dev" target="_blank">
            Zero
          </Link>
        </H4>

        <Paragraph size="$6">
          Zero is the biggest step-change in frontend since React itself. It solves the
          worst area of frontend development today: data. Getting it to the client,
          keeping it in sync, and mutating it instantly. It's{' '}
          <strong>
            like Firebase if it was OSS and ran on Postgres, and had relations, types,
            schemas, and optimistic mutations out of the box
          </strong>
          .
        </Paragraph>

        <Paragraph size="$6">
          Our{' '}
          <Link href="https://github.com/tamagui/takeout3/blob/main/packages/over-zero/readme.md">
            <b>over-zero</b>
          </Link>{' '}
          library makes it even easier to use, and can generate some of the boilerplatey
          parts for you, if you like.
        </Paragraph>

        <H4 mt="$2">
          <Link href="https://tamagui.dev" target="_blank">
            Tamagui
          </Link>
        </H4>

        <Paragraph size="$6">
          Tamagui still offers the best balance of performance on web <em>and</em> native,
          with the largest featureset of any universal style library. It's typed and
          mergable inline styles, robust UI kit, theme system, and ecosystem make us
          incredible productive.
        </Paragraph>

        <Paragraph size="$6">
          <Link href="https://tamagui.dev/blog/version-two">
            <strong>Version 2 RC1 is out now</strong>
          </Link>{' '}
          with stability improvements, more tests, docs, and release guardrails, plus a
          few new components and features.
        </Paragraph>

        <H4 mt="$2" size="$5" fontWeight="bold">
          Agents
        </H4>

        <Paragraph size="$6">
          Our goal was simple - point a coding agent at Takeout and prompt an entire app
          into production in hours. We have a powerful new{' '}
          <CodeInline>takeout</CodeInline> CLI that work alongside some seriously
          well-structured scripts and docs that all together makes one-shotting features
          and fixes an expectation.
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
    </YStack>
  )
}
