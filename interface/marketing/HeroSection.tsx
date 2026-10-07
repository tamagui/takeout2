import { useState } from 'react'
import { H1, Paragraph, styled, useTheme, View, XStack, YStack } from 'tamagui'
import { Link } from '~/interface/app/Link'
import { Button } from '~/interface/buttons/Button'
import { HeroTerminal } from './HeroTerminal'
import { PhoneMockup } from './PhoneMockup'
import { ArrowRightIcon, CheckIcon, CopyIcon } from './TakeoutIcons'
import { HighlightText, Span, Strong } from './Typography'

const HeroTitle = styled(H1, {
  style: { textWrap: 'balance' },
  letterSpacing: 0,
  color: 'color',
  size: '10 lg:12',
  fontWeight: '800',
  maxW: 520,
  fontFamily: 'takeout-heading',
})

const HeroSubtitle = styled(Paragraph, {
  color: 'color-9',
  size: '6 xl:7',
  maxW: 490,
  fontFamily: 'takeout-body',
  style: {
    textWrap: 'balance',
  },
})

const CommandBox = styled(XStack, {
  rounded: 16,
  px: 18,
  py: 13,
  bg: 'color-3 hover:color-4 press:color-5',
  items: 'center',
  flex: 1,
  mr: -20,
  gap: 13,
  overflow: 'hidden',
  cursor: 'pointer',
  borderWidth: 1,
  borderColor: 'color-5 hover:color-6',
})

const HeroSectionContainer = styled(YStack, {
  items: 'md:center',
  justify: 'md:center',
  width: '100%',
  px: 'md:18px',
  height: 'md:max(90vh,850px)',
  maxH: 'md:1000px',
})

const HeroContentRow = styled(View, {
  gap: 7,
  items: 'center',
  justify: 'space-between',
  maxW: 1200,
  width: '100%',
  pb: 116,
  flexDirection: 'column md:row',
})

const LeftContent = styled(YStack, {
  scale: '0.95 lg:1',
  gap: 24,
  minW: 320,
  maxW: '80% sm:640px',
  self: 'max-sm:center',
  items: 'flex-start',
})

const RightMockup = styled(YStack, {
  my: 88,
  minW: 300,
  maxW: 480,
  scale: 'sm:0.9 lg:1',
  x: '0 sm:20px lg:-50px',
  y: 'sm:20px',
  items: 'center',
  position: 'relative',
  z: 0,
  minH: 600,
})

const INSTALL_COMMAND = 'bun install'

function CopyCommand() {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(INSTALL_COMMAND)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // clipboard API unavailable
    }
  }

  return (
    <CommandBox onPress={handleCopy} display="none sm:flex">
      <Paragraph fontFamily="takeout-mono" fontSize={14} color="color-11">
        $
      </Paragraph>
      <Paragraph
        pr={16}
        flex={1}
        numberOfLines={1}
        ellipsizeMode="tail"
        fontFamily="takeout-mono"
        fontSize={15}
        lineHeight="22.25px"
        fontWeight="700"
      >
        {INSTALL_COMMAND}
      </Paragraph>
      {copied ? <CheckIcon size={18} /> : <CopyIcon size={18} />}
    </CommandBox>
  )
}

export function HeroSection() {
  const theme = useTheme()
  return (
    <HeroSectionContainer>
      <HeroContentRow>
        {/* left side - hero content */}
        <LeftContent>
          <YStack gap={2}>
            <HeroTitle>
              The <Span display="none xl:inline">startup</Span> starter that{' '}
              <HighlightText fontStyle="italic">actually</HighlightText> delivers.
            </HeroTitle>
          </YStack>

          <HeroSubtitle>
            <Strong color="color-11">
              Most starter kits <HighlightText fontWeight="700">suck</HighlightText>
            </Strong>
            . <Strong color="color-11">Takeout sucks less.</Strong> One 2 and Tamagui 3
            for web and React Native. Better Auth for sign-in. Drizzle and our Rust Lite
            Sync engine for live data. All wired up, with{' '}
            <Link href="/docs/intro">
              <Span color="color-11">the docs</Span>
            </Link>
            .
          </HeroSubtitle>

          <HeroSubtitle>
            Deploy to <Strong color="color-11">Cloudflare Workers</Strong>, with SQLite in
            a Durable Object and uploads in R2. One app, live across clients.
          </HeroSubtitle>

          <XStack maxW="100%" gap={13} mt={7} items="center">
            <Link href="/docs/intro" asChild>
              <Button
                render="a"
                bg="color"
                color="color-1"
                fontFamily="takeout-body"
                size="lg"
                iconAfter={
                  <ArrowRightIcon size={16} color={theme['color-1'].get('web')} />
                }
              >
                Docs
              </Button>
            </Link>

            <CopyCommand />
          </XStack>

          <Paragraph fontFamily="takeout-body" size="6 lg:7" color="color-9">
            Free and open source.
          </Paragraph>
        </LeftContent>

        {/* right side - phone and terminal */}
        <RightMockup>
          <PhoneMockup />
          <YStack position="absolute" z={-1} x={-200} y={200} scale={0.8}>
            <HeroTerminal />
          </YStack>
        </RightMockup>
      </HeroContentRow>
    </HeroSectionContainer>
  )
}
