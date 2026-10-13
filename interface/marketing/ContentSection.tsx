import { H1, H2, H3, H4, Paragraph, styled, Text, XStack, YStack } from 'tamagui'
import { Link } from '~/interface/app/Link'
import { OneLogo, TamaguiLogo } from './TakeoutIcons'
import { Em, GradientText, InlineLink, Strong } from './Typography'

const SectionContainer = styled(YStack, {
  maxW: 680,
  self: 'center',
  width: '100%',
  px: 18,
})

const SectionHeading = styled(H2, {
  fontFamily: 'takeout-heading',
  size: '6',
  fontWeight: '600',
  color: 'color-10',
})

const ContentParagraph = styled(Paragraph, {
  fontFamily: 'takeout-body',
  size: '7',
  color: 'color-10',
})

const GoalTitle = styled(H4, {
  fontFamily: 'takeout-heading',
  size: '9',
  fontWeight: '200',
})

const TechTitle = styled(H3, {
  fontFamily: 'takeout-heading',
  size: '7',
  fontWeight: '700',
})

const CodeInline = styled(Text, {
  fontFamily: 'takeout-mono',
  bg: 'color-3',
  render: 'code',
  px: 7,
  py: 2,
  rounded: 7,
  color: 'color-11',
})

const SectionDivider = styled(XStack, {
  items: 'center',
  gap: 18,
  my: 46,
})

const DividerLine = styled(YStack, {
  flex: 1,
  height: 1,
  bg: 'color-3',
  mx: 32,
})

const GoalItem = styled(YStack, {
  gap: 7,
  pl: 18,
  borderLeftWidth: 2,
  ml: -2,
  borderLeftColor: 'color-5',
})

const SubGoalItem = styled(YStack, {
  gap: 2,
  pl: 18,
  mt: 13,
})

const TechCard = styled(YStack, {
  gap: 13,
  p: 24,
  bg: 'color-2',
  rounded: 16,
  borderWidth: 0.5,
  borderColor: 'color-4',
})

const LogoWrapper = styled(YStack, {
  width: 40,
  height: 40,
  rounded: 9,
  items: 'center',
  justify: 'center',
})

const ContentTitle = styled(H1, {
  style: { textWrap: 'balance' },
  fontFamily: 'takeout-heading',
  size: '9 md:12',
  fontWeight: '800',
  color: 'color',
  text: 'center',
})

export function ContentSection() {
  return (
    <SectionContainer gap={32}>
      {/* title */}
      <ContentTitle>
        <GradientText>Ultra high quality</GradientText> apps on every platform shipped{' '}
        <GradientText>faster than slop</GradientText>
      </ContentTitle>

      {/* tldr */}
      <ContentParagraph color="color">
        Takeout is the result of a many-year effort to create{' '}
        <Strong>
          a new stack, with some new frontend tech that dramatically simplifies
          cross-platform development
        </Strong>
        . It makes three things simpler and faster than before: framework, data, and UI.
      </ContentParagraph>

      <ContentParagraph>
        One 2 handles routes and rendering. Tamagui 3 shares UI across web and React
        Native. Better Auth handles sign-in, and Drizzle defines the SQLite schema.
        Durable Zero brings Zero's client and query model to Cloudflare Durable Objects.
      </ContentParagraph>

      <ContentParagraph>
        The backend runs on Cloudflare Workers. SQLite lives in a Durable Object, Durable
        Zero runs in its own Durable Object, and R2 stores uploads. The demo you can sign
        into here runs on this stack, deployed from GitHub Actions.
      </ContentParagraph>

      {/* goals section */}
      <SectionDivider>
        <DividerLine />
        <SectionHeading>Goals</SectionHeading>
        <DividerLine />
      </SectionDivider>

      <YStack gap={46}>
        <GoalItem>
          <GoalTitle>Universal</GoalTitle>
          <ContentParagraph>
            Target iOS, Android, Web and Desktop using React and React Native with fully
            shared code <Em>that feels native and runs fast</Em>. You don't have to share
            everything, you don't have to target every platform - but you can, with ease.
          </ContentParagraph>
        </GoalItem>

        <GoalItem>
          <GoalTitle>DRY and simple</GoalTitle>
          <ContentParagraph>
            A single repo, <CodeInline>package.json</CodeInline>, bundler, framework, and
            router. A single set of routes, hooks, and helpers. A single way to do
            styling, UI, and data. All of your backend, frontend, and infrastructure,
            defined in code, deployed with a push. Data queried and mutated quickly,
            safely, simply, and optimistically, with no glue.
          </ContentParagraph>
        </GoalItem>

        <GoalItem>
          <GoalTitle>Truly native</GoalTitle>
          <ContentParagraph>
            A top-tier experience on every platform, served from a single Vite app and
            file system route setup:
          </ContentParagraph>

          <SubGoalItem>
            <ContentParagraph>
              A <Strong>website</Strong> with great Lighthouse scores, all the latest CSS
              features, and perfectly hydrated static or server rendered pages (even when
              using spring animations, media queries, and light/dark mode, etc).
            </ContentParagraph>
          </SubGoalItem>

          <SubGoalItem>
            <ContentParagraph>
              A <Strong>web app</Strong> that can be client-only and look and feel great
              despite having fully shared code with a performant site.
            </ContentParagraph>
          </SubGoalItem>

          <SubGoalItem>
            <ContentParagraph>
              And of course, <Strong>100% native UI on iOS and Android</Strong>. One 2
              exposes SwiftUI, Jetpack Compose, native navigation, Liquid Glass, and
              Material components, with direct access to native APIs.
            </ContentParagraph>
          </SubGoalItem>
        </GoalItem>

        <GoalItem>
          <GoalTitle>Fast, both ways</GoalTitle>
          <ContentParagraph>
            Fast in both development speed and runtime performance.
          </ContentParagraph>
        </GoalItem>

        <GoalItem>
          <GoalTitle>Low risk</GoalTitle>
          <ContentParagraph>
            Run locally with SQLite, then deploy the same app to Cloudflare. Your schema,
            queries, mutations, and permissions stay in one repository. The framework, UI,
            auth, and sync libraries are open source.
          </ContentParagraph>
        </GoalItem>

        <GoalItem>
          <GoalTitle>AI-native</GoalTitle>
          <ContentParagraph>
            Point a coding agent at Takeout and prompt an entire app into production in
            hours. Project instructions, typed routes, a shared UI package, and agent{' '}
            <CodeInline>skills</CodeInline> give agents a cohesive app to work on.
          </ContentParagraph>
        </GoalItem>
      </YStack>

      {/* in the box section */}
      <SectionDivider>
        <DividerLine />
        <SectionHeading>In the box</SectionHeading>
        <DividerLine />
      </SectionDivider>

      <YStack gap={24}>
        <TechCard>
          <XStack items="center" gap={13}>
            <LogoWrapper bg="rgba(245, 202, 5, 0.15)">
              <OneLogo size={24} />
            </LogoWrapper>
            <Link href="https://onestack.dev" target="_blank">
              <TechTitle color="color">One</TechTitle>
            </Link>
          </XStack>

          <ContentParagraph>
            One 2 brings file-based routes, loaders, static generation, and server
            rendering to Vite. Share routes and app code across web and React Native, with
            Metro handling native builds.
          </ContentParagraph>

          <ContentParagraph>
            One 2 gives you access to any native API through React Native and native
            modules. Built-in features include cameras, maps, notifications, haptics, and
            secure storage. On iOS, that extends to purchases, background tasks, widgets,
            and Live Activities.
          </ContentParagraph>
          <ContentParagraph>
            Use platform UI directly, share app logic, and add your own native code
            wherever your product needs it.{' '}
            <Link href="https://onestack.dev/docs/native-overview" target="_blank">
              <InlineLink fontWeight="600">Explore One 2's native features</InlineLink>
            </Link>
            .
          </ContentParagraph>
        </TechCard>

        <TechCard>
          <XStack items="center" gap={13}>
            <LogoWrapper bg="rgba(236, 210, 10, 0.15)">
              <TamaguiLogo size={24} />
            </LogoWrapper>
            <Link href="https://tamagui.dev" target="_blank">
              <TechTitle color="color">Tamagui</TechTitle>
            </Link>
          </XStack>

          <ContentParagraph>
            Tamagui just gives you{' '}
            <Strong color="color-11">
              so much good stuff in a vertically integrated package
            </Strong>
            , it's hard to beat. With version three, a lot of hard work is finally paying
            off.
          </ContentParagraph>

          <ContentParagraph>
            Native feels amazing, and web catches up with all the latest styling features.
            It's also <Strong color="color-11">great for LLMs</Strong>, and generates
            customized skills.
          </ContentParagraph>

          <ContentParagraph>
            <Link href="https://tamagui.dev/docs/intro/introduction" target="_blank">
              <InlineLink fontWeight="600">Read the Tamagui documentation</InlineLink>
            </Link>{' '}
            with too much to list.
          </ContentParagraph>
        </TechCard>

        <TechCard>
          <TechTitle color="var(--blue-11)">Durable Zero</TechTitle>
          <ContentParagraph>
            <Strong color="color">Zero, adapted to Cloudflare Durable Objects.</Strong>{' '}
            Durable Zero uses Zero's client and query model. Our Rust sync engine,
            packaged as{' '}
            <Link href="https://github.com/natew/orez" target="_blank">
              <InlineLink fontWeight="600">orez-lite</InlineLink>
            </Link>
            , runs as WebAssembly in a Cloudflare Durable Object. It syncs live queries
            from the application database to clients and supports optimistic mutations.
          </ContentParagraph>

          <ContentParagraph>
            The Zero client and our <Strong>on-zero</Strong> helpers give the app typed
            queries, shared mutations, and permissions. Drizzle owns the SQLite schema;
            Durable Zero connects it to the UI.
          </ContentParagraph>
        </TechCard>

        <TechCard>
          <TechTitle>Cloudflare, SQLite, and R2</TechTitle>
          <ContentParagraph>
            A Worker serves the site and API. A SQLite Durable Object owns application
            data, a second Worker hosts Durable Zero, and R2 stores images and uploads.
            GitHub Actions builds and deploys both workers when you push to main.
          </ContentParagraph>
        </TechCard>

        <TechCard>
          <TechTitle>Better Auth and Drizzle</TechTitle>
          <ContentParagraph>
            Better Auth handles email and password sign-in, sessions, and the demo login.
            Drizzle defines tables and migrations in TypeScript. Both use the same
            application SQLite database, alongside the feed and comments.
          </ContentParagraph>
        </TechCard>
      </YStack>

      {/* fin section */}
      <SectionDivider>
        <DividerLine />
      </SectionDivider>

      <YStack gap={18}>
        <ContentParagraph>
          We built Takeout for ourselves, much like Tamagui and One. They're passion
          projects born out of stubbornly wanting better things. We hope you enjoy this
          somewhat early version of our new stack.
        </ContentParagraph>

        <ContentParagraph>
          -{' '}
          <Link href="https://x.com/natebirdman" target="_blank">
            <InlineLink>Nate</InlineLink>
          </Link>
        </ContentParagraph>
      </YStack>
    </SectionContainer>
  )
}
