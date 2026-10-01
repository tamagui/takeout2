import { H1, H2, H3, H4, Paragraph, styled, Text, XStack, YStack } from 'tamagui'

import { Link } from '~/interface/app/Link'
import { OneLogo, TamaguiLogo, ZeroLogo } from './TakeoutIcons'
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
        Takeout now uses{' '}
        <Link href="/docs/intro">
          <InlineLink fontWeight="600">the Contrast app template</InlineLink>
        </Link>
        , bringing the same app stack to React and React Native.
      </ContentParagraph>

      <ContentParagraph>
        Even when sharing a lot of code you can easily get 90+ Lighthouse performance
        scores, like this very page, thanks to our libraries{' '}
        <Link href="https://tamagui.dev" target="_blank">
          <InlineLink>Tamagui</InlineLink>
        </Link>{' '}
        and{' '}
        <Link href="https://onestack.dev" target="_blank">
          <InlineLink>One</InlineLink>
        </Link>
        . Then, make your app come alive better and easier than ever before with{' '}
        <Link href="https://zero.rocicorp.dev" target="_blank">
          <InlineLink>Zero</InlineLink>
        </Link>
        .
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
          <GoalTitle>Platform-native</GoalTitle>
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
              And of course, <Strong>native iOS and Android apps</Strong> with native UI
              and navigation, Liquid Glass, Material UI, etc.
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
            Self host or deploy to the cloud. Runs on SQLite with Orez Lite and Zero sync. Unplug parts you don't
            like. Libraries chosen for being OSS, popular, single-purpose, and well
            maintained and documented.
          </ContentParagraph>
        </GoalItem>

        <GoalItem>
          <GoalTitle>AI-native</GoalTitle>
          <ContentParagraph>
            Point a coding agent at Takeout and prompt an entire app into production in
            hours. Project instructions, typed routes, a shared UI package, and the{' '}
            <CodeInline>contrast</CodeInline> CLI give agents a cohesive app to work on.
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
            Vite is the best bundler for web. One ported Expo Router to Vite, then added a
            lot of stuff needed for high performance web: loaders, render modes, smart
            preloading and prefetching, and bundle size improvements. And a whole bunch
            more than that.
          </ContentParagraph>

          <ContentParagraph>
            The new <Strong>Metro-mode</Strong> gives you Vite's simplicity for web, and
            Metro's maturity on native. One is stable for production use, and{' '}
            <Link href="https://onestack.dev/blog/version-one-rc1">
              <InlineLink fontWeight="600">read our v1 RC1 releae post here</InlineLink>
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
            <Link
              href="https://tamagui.dev/docs/intro/introduction"
              target="_blank"
             
            >
              <InlineLink fontWeight="600">Read the Tamagui documentation</InlineLink>
            </Link>{' '}
            with too much to list.
          </ContentParagraph>
        </TechCard>

        <TechCard>
          <XStack items="center" gap={13}>
            <LogoWrapper bg="rgba(59, 130, 246, 0.15)">
              <ZeroLogo size={24} />
            </LogoWrapper>
            <Link href="https://zero.rocicorp.dev" target="_blank">
              <TechTitle color="var(--blue-11)">Zero</TechTitle>
            </Link>
          </XStack>

          <ContentParagraph>
            <Strong color="color">
              Zero solves the worst area of frontend development today
            </Strong>
            : getting data to the client, keeping it in sync, and mutating it instantly.
            It's{' '}
            <Strong>
              like Firebase, but open source, with relations, types, and
              optimistic mutations built in
            </Strong>
            .
          </ContentParagraph>

          <ContentParagraph>
            Our{' '}
            <Link
              href="https://github.com/natew/orez/tree/main/packages/on-zero"
              target="_blank"
             
            >
              <InlineLink fontWeight="600">on-zero</InlineLink>
            </Link>{' '}
            library makes it feel like Rails, auto-generating boilerplate, gluing things
            together, giving you simple CRUD and permissions, and more.
          </ContentParagraph>
        </TechCard>

        <TechCard>
          <TechTitle>And a bunch of things we use</TechTitle>
          <ContentParagraph>
            This isn't just some thrown together starter, it's extracted from the stack
            we've always wanted, and we use it ourselves to start new projects.{' '}
            <Strong color="color">The UI comes from contrast-ui</Strong>. Plus
            the best libraries we can find, like{' '}
            <Strong color="color">Better Auth</Strong> for auth, or{' '}
            <Strong>Cloudflare</Strong> workers for production.
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
