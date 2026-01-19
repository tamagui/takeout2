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
  fontSize: 13,
  fontWeight: '600',
  letterSpacing: 2,
  color: '$color10',
  textTransform: 'uppercase',
})

const ContentParagraph = styled(Paragraph, {
  size: '$5',
  color: '$color11',
})

const GoalTitle = styled(H4, {
  size: '$6',
  fontWeight: '700',
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
  bg: '$color4',
})

const GoalItem = styled(YStack, {
  gap: '$2',
  pl: '$4',
  borderLeftWidth: 2,
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
  '$platform-web': {
    background: 'linear-gradient(135deg, #F97316 0%, #FB923C 50%, #FDBA74 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
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
      <ContentParagraph size="$6">
        <Strong fontWeight="700">TL;DR:</Strong> Takeout is the result of a many-year
        effort to create{' '}
        <Strong>
          a new stack, with some new frontend tech, that dramatically simplifies
          cross-platform development
        </Strong>
        . It specifically makes three things simpler and faster than before: framework,
        data, and UI.
      </ContentParagraph>

      <ContentParagraph size="$6">
        Today,{' '}
        <Link href="https://tamagui.dev/takeout" hideExternalIcon>
          <InlineLink fontWeight="600">we're releasing Takeout 2 RC 1</InlineLink>
        </Link>
        . Takeout aims to bring more Rails-like cohesion to cross-platform React and React
        Native while also improving the native-feel it can achieve.
      </ContentParagraph>

      <ContentParagraph size="$6">
        Even when sharing a lot of code you can get perfect Lighthouse performance scores
        with ease, like this very page does, thanks to our libraries{' '}
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
            Vite simply mogs any other bundler for web, we love how fast and flexible it
            is. So, One ported Expo Router to Vite, and then added a ton of stuff needed
            for high performance web - especially loaders, render modes, smart preloading
            and prefetching, and bundle size improvements. Server render or statically
            generate some pages, keep others client-only, all from the same routing
            definitions. Plus, easy API routes, great type generation, and a Hono
            production server included.
          </ContentParagraph>

          <ContentParagraph>
            With the new <Strong>Metro-mode</Strong>, you get Vite's simplicity for web
            while optionally running Metro for native. One is now stable for production
            use, and{' '}
            <Link href="https://onestack.dev" hideExternalIcon>
              <InlineLink fontWeight="600">we just released v1 RC1</InlineLink>
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
            Tamagui has the best balance of performance on web <Em>and</Em> native, the
            largest featureset of any universal style library, and is amazing with LLMs.
            It's typed and mergable inline styles, robust UI kit, theme system, and
            ecosystem make us incredible productive.
          </ContentParagraph>

          <ContentParagraph>
            <Link
              href="https://tamagui.dev/blog/version-two"
              target="_blank"
              hideExternalIcon
            >
              <InlineLink fontWeight="600">Version 2 RC1 is out now</InlineLink>
            </Link>{' '}
            with stability improvements, more tests, docs, and release guardrails, plus a
            few new components and features.
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
            Zero is the biggest step-change in frontend since React itself. It solves the
            worst area of frontend development today: data. Getting it to the client,
            keeping it in sync, and mutating it instantly. It's{' '}
            <Strong>
              like Firebase if it was OSS and ran on Postgres, and had relations, types,
              schemas, and optimistic mutations out of the box
            </Strong>
            .
          </ContentParagraph>

          <ContentParagraph>
            Our{' '}
            <Link
              href="https://github.com/tamagui/takeout2/blob/main/packages/over-zero/readme.md"
              target="_blank"
              hideExternalIcon
            >
              <InlineLink fontWeight="600">over-zero</InlineLink>
            </Link>{' '}
            library makes it even easier to use, and can generate some of the boilerplatey
            parts for you, if you like.
          </ContentParagraph>
        </TechCard>

        <TechCard>
          <TechTitle>Agents</TechTitle>
          <ContentParagraph>
            Our goal was simple - point a coding agent at Takeout and prompt an entire app
            into production in hours. We have a powerful new{' '}
            <CodeInline>takeout</CodeInline> CLI that work alongside some seriously
            well-structured scripts and docs that all together makes one-shotting features
            and fixes an expectation.
          </ContentParagraph>
        </TechCard>

        <TechCard>
          <TechTitle>And more</TechTitle>
          <ContentParagraph>
            So much more. Tons of scripts, helpers, hooks, and libraries.{' '}
            <Strong>Better Auth</Strong> integration. Our favorite{' '}
            <Strong>native dependencies</Strong> for better native UI and functionality.
            And the choice to deploy with either <Strong>Uncloud</Strong> or{' '}
            <Strong>SST</Strong> out of the box.
          </ContentParagraph>
        </TechCard>
      </YStack>

      {/* fin section */}
      <SectionDivider>
        <DividerLine />
        <SectionHeading>Fin</SectionHeading>
        <DividerLine />
      </SectionDivider>

      <YStack gap="$4">
        <ContentParagraph>
          We built Takeout for ourselves, much like Tamagui and One - passion projects
          born out of stubbornly wanting better things. We hope you enjoy this somewhat
          early version of our new stack.
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
