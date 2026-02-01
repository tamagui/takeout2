import { H1, H2, H3, H4, Paragraph, styled, Text, XStack, YStack } from 'tamagui'

import { Link } from '~/interface/app/Link'
import { OneLogo } from '~/interface/icons/logos/OneLogo'
import { TamaguiLogo } from '~/interface/icons/logos/TamaguiLogo'
import { ZeroLogo } from '~/interface/icons/logos/ZeroLogo'
import { Em, InlineLink, Strong } from '~/interface/text/Text'

const SectionContainer = styled(YStack, {
  maxW: 680,
  self: 'center',
  width: '100%',
  px: '$4',
})

const SectionHeading = styled(H2, {
  size: '$6',
  fontWeight: '600',
  color: '$color10',
})

const ContentParagraph = styled(Paragraph, {
  size: '$7',
  color: '$color10',
})

const GoalTitle = styled(H4, {
  size: '$9',
  fontWeight: '200',
})

const TechTitle = styled(H3, {
  size: '$7',
  fontWeight: '700',
})

const CodeInline = styled(Text, {
  fontFamily: '$mono',
  bg: '$color3',
  render: 'code',
  px: '$2',
  py: '$1',
  rounded: '$3',
  color: '$color11',
})

const SectionDivider = styled(XStack, {
  items: 'center',
  gap: '$4',
  my: '$8',
})

const DividerLine = styled(YStack, {
  flex: 1,
  height: 1,
  bg: '$color3',
  mx: '$6',
})

const GoalItem = styled(YStack, {
  gap: '$2',
  pl: '$4',
  borderLeftWidth: 2,
  ml: -2,
  borderLeftColor: '$color5',
})

const SubGoalItem = styled(YStack, {
  gap: '$1',
  pl: '$4',
  mt: '$3',
})

const TechCard = styled(YStack, {
  gap: '$3',
  p: '$5',
  bg: '$color2',
  rounded: '$6',
  borderWidth: 0.5,
  borderColor: '$color4',
})

const LogoWrapper = styled(YStack, {
  width: 40,
  height: 40,
  rounded: '$4',
  items: 'center',
  justify: 'center',
})

const ContentTitle = styled(H1, {
  size: '$9',
  fontWeight: '800',
  color: '$color12',
  text: 'center',

  $md: {
    size: '$12',
  },
})

const GradientText = styled(Text, {
  fontWeight: '800',
  render: 'span',
  backgroundImage: 'linear-gradient(90deg, $red10 0%, $orange11 100%)',
  color: 'transparent',
  '$platform-web': {
    backgroundClip: 'text',
    WebkitBackgroundClip: 'text',
  },
})

export function ContentSection() {
  return (
    <SectionContainer gap="$6">
      {/* title */}
      <ContentTitle>
        <GradientText>Ultra high quality</GradientText> apps on every platform shipped{' '}
        <GradientText>faster than slop</GradientText>
      </ContentTitle>

      {/* tldr */}
      <ContentParagraph color="$color12">
        Takeout is the result of a many-year effort to create{' '}
        <Strong>
          a new stack, with some new frontend tech that dramatically simplifies
          cross-platform development
        </Strong>
        . It makes three things simpler and faster than before: framework, data, and UI.
      </ContentParagraph>

      <ContentParagraph>
        Today,{' '}
        <Link href="https://tamagui.dev/takeout" hideExternalIcon>
          <InlineLink fontWeight="600">we're releasing Takeout 2 RC 1</InlineLink>
        </Link>
        , bringing a more Rails-like cohesion to cross-platform React and React Native.
      </ContentParagraph>

      <ContentParagraph>
        Even when sharing a lot of code you can easily get 90+ Lighthouse performance
        scores, like this very page, thanks to our libraries{' '}
        <Link href="https://tamagui.dev" target="_blank" hideExternalIcon>
          <InlineLink>Tamagui</InlineLink>
        </Link>{' '}
        and{' '}
        <Link href="https://onestack.dev" target="_blank" hideExternalIcon>
          <InlineLink>One</InlineLink>
        </Link>
        . Then, make your app come alive better and easier than ever before with{' '}
        <Link href="https://zero.rocicorp.dev" target="_blank" hideExternalIcon>
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

      <YStack gap="$8">
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
            Self host or deploy to the cloud. Runs on Postgres. Unplug parts you don't
            like. Libraries chosen for being OSS, popular, single-purpose, and well
            maintained and documented.
          </ContentParagraph>
        </GoalItem>

        <GoalItem>
          <GoalTitle>AI-native</GoalTitle>
          <ContentParagraph>
            Point a coding agent at Takeout and prompt an entire app into production in
            hours. <Strong>Over 25 hand-written skills,</Strong> essential MCP
            integrations, integration tests, an amazing <CodeInline>takeout</CodeInline>{' '}
            CLI, and a ton of well-structured scripts make Claude Code amazing at
            one-shotting almost anything.
          </ContentParagraph>
        </GoalItem>
      </YStack>

      {/* in the box section */}
      <SectionDivider>
        <DividerLine />
        <SectionHeading>In the box</SectionHeading>
        <DividerLine />
      </SectionDivider>

      <YStack gap="$5">
        <TechCard>
          <XStack items="center" gap="$3">
            <LogoWrapper bg="rgba(245, 202, 5, 0.15)">
              <OneLogo size={24} />
            </LogoWrapper>
            <Link href="https://onestack.dev" target="_blank" hideExternalIcon>
              <TechTitle color="$color12">One</TechTitle>
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
            <Link href="https://onestack.dev/blog/version-one-rc1" hideExternalIcon>
              <InlineLink fontWeight="600">read our v1 RC1 releae post here</InlineLink>
            </Link>
            .
          </ContentParagraph>
        </TechCard>

        <TechCard>
          <XStack items="center" gap="$3">
            <LogoWrapper bg="rgba(236, 210, 10, 0.15)">
              <TamaguiLogo size={24} />
            </LogoWrapper>
            <Link href="https://tamagui.dev" target="_blank" hideExternalIcon>
              <TechTitle color="$color12">Tamagui</TechTitle>
            </Link>
          </XStack>

          <ContentParagraph>
            Tamagui just gives you{' '}
            <Strong color="$color11">
              so much good stuff in a vertically integrated package
            </Strong>
            , it's hard to beat. With version two, a lot of hard work is finally paying
            off.
          </ContentParagraph>

          <ContentParagraph>
            Native feels amazing, and web catches up with all the latest styling features.
            It's also <Strong color="$color11">great for LLMs</Strong>, and generates
            customized skills.
          </ContentParagraph>

          <ContentParagraph>
            <Link
              href="https://tamagui.dev/blog/version-two"
              target="_blank"
              hideExternalIcon
            >
              <InlineLink fontWeight="600">Version 2 RC1 is out now</InlineLink>
            </Link>{' '}
            with too much to list.
          </ContentParagraph>
        </TechCard>

        <TechCard>
          <XStack items="center" gap="$3">
            <LogoWrapper bg="rgba(59, 130, 246, 0.15)">
              <ZeroLogo size={24} />
            </LogoWrapper>
            <Link href="https://zero.rocicorp.dev" target="_blank" hideExternalIcon>
              <TechTitle color="$blue11">Zero</TechTitle>
            </Link>
          </XStack>

          <ContentParagraph>
            <Strong color="$color12">
              Zero solves the worst area of frontend development today
            </Strong>
            : getting data to the client, keeping it in sync, and mutating it instantly.
            It's{' '}
            <Strong>
              like Firebase, but open source, on Postgres, with relations, types, and
              optimistic mutations built in
            </Strong>
            .
          </ContentParagraph>

          <ContentParagraph>
            Our <CodeInline>on-zero</CodeInline>
            {/* <Link
              href="https://github.com/tamagui/takeout-free/blob/main/packages/on-zero/readme.md"
              target="_blank"
              hideExternalIcon
            >
              <InlineLink fontWeight="600">on-zero</InlineLink>
            </Link>{' '} */}{' '}
            library (repo coming) makes it feel like Rails, and auto generating
            boilerplate, gluing things together, giving you simple CRUD and permissions,
            and more.
          </ContentParagraph>
        </TechCard>

        <TechCard>
          <TechTitle>And a bunch of things we use</TechTitle>
          <ContentParagraph>
            This isn't just some thrown together starter, it's extracted from the stack
            we've always wanted, and we use it ourselves to start new projects.{' '}
            <Strong color="$color12">There's 50+ interface folders alone</Strong>. Plus
            the best libraries we can find, like{' '}
            <Strong color="$color12">Better Auth</Strong> for auth, or{' '}
            <Strong>Uncloud</Strong> and <Strong>SST</Strong> options for production.
          </ContentParagraph>
        </TechCard>
      </YStack>

      {/* fin section */}
      <SectionDivider>
        <DividerLine />
      </SectionDivider>

      <YStack gap="$4">
        <ContentParagraph>
          We built Takeout for ourselves, much like Tamagui and One. They're passion
          projects born out of stubbornly wanting better things. We hope you enjoy this
          somewhat early version of our new stack.
        </ContentParagraph>

        <ContentParagraph>
          -{' '}
          <Link href="https://x.com/natebirdman" target="_blank" hideExternalIcon>
            <InlineLink>Nate</InlineLink>
          </Link>
        </ContentParagraph>
      </YStack>
    </SectionContainer>
  )
}
