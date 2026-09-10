import { memo, useEffect, useRef, useState } from 'react'
import { html, Paragraph, Theme, View, XStack, YStack, styled } from 'tamagui'

import { Link } from '~/interface/app/Link'
import { ArrowRightIcon } from '~/interface/icons/phosphor/ArrowRightIcon'
import { CheckIcon } from '~/interface/icons/phosphor/CheckIcon'
import { CopyIcon } from '~/interface/icons/phosphor/CopyIcon'

import { Button } from '../buttons/Button'
import { Span, Strong } from '../text/Text'

const HeroTitle = styled(html.h1, {
  fontFamily: 'heading',
  color: 'color12',
  fontWeight: '800',
  maxW: 520,
  fontSize: '10 lg:12',
  lineHeight: '10 lg:12',
  m: 0,
})

const HeroSubtitle = styled(html.p, {
  fontFamily: 'body',
  color: 'color9',
  maxW: 490,
  textWrap: 'web:balance',
  fontSize: '6 xl:7',
  lineHeight: '6 xl:7',
  m: 0,
})

const HighlightText = styled(html.span, {
  backgroundImage: 'linear-gradient(90deg, red10 0%, orange11 100%)',
  color: 'transparent',
  backgroundClip: 'web:text',
})

const CommandBox = styled(XStack, {
  rounded: '6',
  px: '4',
  py: '3',
  bg: 'color3 hover:background-hover press:color5',
  items: 'center',
  flex: 1,
  mr: -20,
  gap: '3',
  overflow: 'hidden',
  cursor: 'pointer',
  borderWidth: 1,
  borderColor: 'color5 hover:color6',
  style: {
    transition: 'background-color 200ms ease, border-color 200ms ease',
  },
})

const TerminalContainer = styled(YStack, {
  bg: '#0d0d0d',
  rounded: '6',
  overflow: 'hidden',
  borderWidth: 1,
  borderColor: 'rgba(255,255,255,0.1)',
  w: '100%',
  maxW: 520,
  shadowColor: '#000',
  shadowRadius: 40,
  shadowOffset: { width: 0, height: 20 },
  shadowOpacity: 0.4,
  display: 'none md:flex',
})

const TerminalHeader = styled(XStack, {
  bg: '#1a1a1a',
  pointerEvents: 'none',
  px: '4',
  py: '2',
  items: 'center',
  gap: '2',
  borderBottomWidth: 1,
  borderBottomColor: 'rgba(255,255,255,0.1)',
})

const TerminalDot = styled(YStack, {
  w: 12,
  h: 12,
  rounded: 999,
})

const TERMINAL_HEIGHT = 260

interface CommandStep {
  command: string
  output: string[]
}

// memoized window dots to prevent re-renders
const TerminalDots = memo(function TerminalDots() {
  return (
    <XStack gap="2">
      <TerminalDot bg="#ff5f57" />
      <TerminalDot bg="#ffbd2e" />
      <TerminalDot bg="#28ca42" />
    </XStack>
  )
})

// memoized history entry to prevent re-renders
const HistoryEntry = memo(function HistoryEntry({
  command,
  output,
}: {
  command: string
  output: string[]
}) {
  return (
    <YStack opacity={0.5} mb="3" gap="1">
      <XStack>
        <Paragraph
          fontFamily="mono"
          fontSize={13}
          color="#22c55e"
          mr="2"
          lineHeight="22.1px"
        >
          $
        </Paragraph>
        <Paragraph fontFamily="mono" fontSize={13} color="#e5e5e5" lineHeight="22.1px">
          {command}
        </Paragraph>
      </XStack>
      {output.map((line, j) => (
        <Paragraph
          key={j}
          fontFamily="mono"
          fontSize={13}
          color="#888"
          lineHeight="22.1px"
        >
          {line}
        </Paragraph>
      ))}
    </YStack>
  )
})

const steps: CommandStep[] = [
  {
    command: 'bun create takeout',
    output: [
      '  Creating new Takeout app...',
      '  Installing dependencies...',
      '  Setting up Zero sync...',
      '  Configuring auth...',
      '  Done!',
    ],
  },
  {
    command: 'cd my-app && bun onboard',
    output: ['  (multi-step onboarding wizard 🧙‍♂️...)'],
  },
  {
    command: 'bun dev',
    output: [
      '  Starting development server...',
      '  Vite: http://localhost:5173',
      '  Expo: http://localhost:8081',
      '  Ready in 1.2s',
    ],
  },
  {
    command: 'bun ops release',
    output: [
      '  Building for production...',
      '  Running migrations...',
      '  Deploying...',
      '  Live at https://my-app.com',
    ],
  },
]

function HeroTerminal() {
  const [currentStep, setCurrentStep] = useState(0)
  const [typedCommand, setTypedCommand] = useState('')
  const [showOutput, setShowOutput] = useState(false)
  const [outputLines, setOutputLines] = useState<string[]>([])
  const [history, setHistory] = useState<{ command: string; output: string[] }[]>([])
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTo({
        top: contentRef.current.scrollHeight,
        behavior: 'smooth',
      })
    }
  }, [typedCommand, outputLines, history])

  useEffect(() => {
    const step = steps[currentStep]
    if (!step) return

    let charIndex = 0
    let outputInterval: ReturnType<typeof setInterval> | null = null
    let transitionTimeout: ReturnType<typeof setTimeout> | null = null
    let resetTimeout: ReturnType<typeof setTimeout> | null = null
    let cancelled = false

    setTypedCommand('')
    setShowOutput(false)
    setOutputLines([])

    const typeInterval = setInterval(() => {
      if (cancelled) return
      if (charIndex < step.command.length) {
        setTypedCommand(step.command.slice(0, charIndex + 1))
        charIndex++
      } else {
        clearInterval(typeInterval)
        setShowOutput(true)

        let lineIndex = 0
        outputInterval = setInterval(() => {
          if (cancelled) return
          if (lineIndex < step.output.length) {
            const line = step.output[lineIndex]!
            setOutputLines((prev) => [...prev, line])
            lineIndex++
          } else {
            if (outputInterval) clearInterval(outputInterval)

            transitionTimeout = setTimeout(() => {
              if (cancelled) return
              setHistory((prev) => [
                ...prev,
                { command: step.command, output: step.output },
              ])
              setTypedCommand('')
              setOutputLines([])
              setShowOutput(false)

              const nextStep = currentStep + 1
              if (nextStep < steps.length) {
                setCurrentStep(nextStep)
              } else {
                resetTimeout = setTimeout(() => {
                  if (cancelled) return
                  setHistory([])
                  setCurrentStep(0)
                }, 2800)
              }
            }, 1500)
          }
        }, 250)
      }
    }, 120)

    return () => {
      cancelled = true
      clearInterval(typeInterval)
      if (outputInterval) clearInterval(outputInterval)
      if (transitionTimeout) clearTimeout(transitionTimeout)
      if (resetTimeout) clearTimeout(resetTimeout)
    }
  }, [currentStep])

  return (
    <TerminalContainer>
      <TerminalHeader>
        <TerminalDots />
        <Paragraph
          fontSize={12}
          color="#999"
          fontFamily="mono"
          flex={1}
          text="center"
          mr="8"
          select="none"
        >
          takeout-cli
        </Paragraph>
      </TerminalHeader>

      <YStack
        ref={contentRef as any}
        className="terminal-content"
        p="4"
        height={TERMINAL_HEIGHT}
        overflow="scroll"
        gap="1"
      >
        {history.map((entry, i) => (
          <HistoryEntry key={i} command={entry.command} output={entry.output} />
        ))}

        {!!typedCommand && (
          <YStack gap="1">
            <XStack items="center">
              <Paragraph fontFamily="mono" fontSize={13} color="#22c55e" mr="2">
                $
              </Paragraph>
              <Paragraph fontFamily="mono" fontSize={13} color="#e5e5e5">
                {typedCommand}
              </Paragraph>
              {!showOutput && (
                <YStack className="terminal-cursor" w={8} h={16} bg="#e5e5e5" ml="1" />
              )}
            </XStack>
          </YStack>
        )}

        {outputLines.map((line, i) => (
          <Paragraph key={i} fontFamily="mono" fontSize={13} color="#888">
            {line}
          </Paragraph>
        ))}

        {!typedCommand && history.length === 0 && (
          <XStack items="center">
            <Paragraph fontFamily="mono" fontSize={13} color="#22c55e" mr="2">
              $
            </Paragraph>
            <YStack className="terminal-cursor" w={8} h={16} bg="#e5e5e5" />
          </XStack>
        )}
      </YStack>
    </TerminalContainer>
  )
}

const INSTALL_COMMAND = 'bun create takeout'

function PhoneMockup() {
  return (
    <YStack
      maxW="100%"
      maxH="100%"
      items="center"
      justify="center"
      self="center"
      aspectRatio="588 / 1176"
      x="0px lg:0px"
      y="0px lg:20px"
    >
      <svg width="0" height="0" style={{ position: 'absolute' }}>
        <defs>
          <clipPath id="iphone-screen-clip-1" clipPathUnits="objectBoundingBox">
            <rect x="0" y="0" width="1" height="1" rx="0.19" ry="0.081" />
          </clipPath>
          <clipPath
            id="iphone-screen-clip"
            clipPathUnits="objectBoundingBox"
            clipPath="url(#iphone-screen-clip-1)"
          >
            <rect x="0" y="0" width="1" height="1" rx="0.17" ry="0.088" />
          </clipPath>
        </defs>
      </svg>
      <YStack filter="drop-shadow(0 35px 50px rgba(0,0,0,0.6))">
        <YStack
          overflow="hidden"
          position="relative"
          w={286}
          h={593}
          clipPath="url(#iphone-screen-clip)"
          style={{
            WebkitClipPath: 'url(#iphone-screen-clip)',
          }}
        >
          <video
            autoPlay
            loop
            muted
            playsInline
            poster="/iphone-frame.webp"
            ref={(el) => {
              if (el) el.playbackRate = 1.3
            }}
            style={{
              position: 'absolute',
              top: -3,
              left: -6,
              width: 294 + 4,
              height: 588 + 12,
              objectFit: 'cover',
            }}
          >
            <source
              src="https://pub-836fc09a8b0e484f900cd6aa05105026.r2.dev/videos/appdemo2_h265.mp4"
              type="video/mp4; codecs=hvc1"
            />
            <source
              src="https://pub-836fc09a8b0e484f900cd6aa05105026.r2.dev/videos/appdemo2_h264.mp4"
              type="video/mp4"
            />
          </video>
        </YStack>
      </YStack>
    </YStack>
  )
}

function CopyCommand() {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(INSTALL_COMMAND)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // clipboard API unavailable, skip copy silently
    }
  }

  return (
    <CommandBox onPress={handleCopy} display="none sm:flex">
      <Paragraph fontFamily="mono" fontSize={14} color="color11">
        $
      </Paragraph>
      <Paragraph
        pr="4"
        flex={1}
        fontFamily="mono"
        fontSize={15}
        fontWeight="700"
        ellipsis
      >
        {INSTALL_COMMAND}
      </Paragraph>
      {copied ? (
        <CheckIcon size={18} color="color10" />
      ) : (
        <CopyIcon size={18} color="color10" />
      )}
    </CommandBox>
  )
}

const HeroContainer = styled(YStack, {
  style: {
    minHeight: 'max(90vh, 850px)',
  },
  items: 'center',
  gap: '8',
  px: '4',
  justify: 'center',
})

export function HeroSection() {
  return (
    <HeroContainer>
      <View
        gap="2"
        items="center"
        justify="space-between"
        maxW={1200}
        w="100%"
        pb="14"
        flexDirection="column md:row"
      >
        {/* left side - hero content */}
        <YStack
          scale="0.95 lg:1"
          transition="medium"
          gap="5"
          minW={320}
          maxW="640px max-sm:80%"
          items="flex-start"
          self="max-sm:center"
        >
          <YStack gap="1">
            <HeroTitle>
              The <Span display="max-xl:none">startup</Span> starter that{' '}
              <HighlightText fontStyle="italic">actually</HighlightText> delivers.
            </HeroTitle>
          </YStack>

          <HeroSubtitle>
            <Strong color="color11">
              Most starter kits <HighlightText fontWeight="700">suck</HighlightText>
            </Strong>
            . <Strong color="color11">Takeout sucks less.</Strong> We&nbsp;took
            novel&nbsp;tech, made it work well, then&nbsp;added CI/CD, IaC, UI, lots of
            “agent” stuff, and <Link href="/docs/changelog">a changelog</Link> —
            it's&nbsp;what we use for ourselves, and our{' '}
            <Link href="https://addeven.com">clients</Link>.
          </HeroSubtitle>

          <HeroSubtitle>
            It's the{' '}
            <Strong fontWeight="600" color="color11">
              fastest way to build something&nbsp;great
            </Strong>{' '}
            on both React Native and web.
          </HeroSubtitle>

          <XStack maxW="100%" gap="3" mt="2" items="center">
            <Link href="/docs/introduction">
              <Theme name="dark">
                <Button size="large" icon={ArrowRightIcon} iconAfter>
                  Docs
                </Button>
              </Theme>
            </Link>

            <CopyCommand />
          </XStack>

          <Paragraph size="6 lg:7" color="color9">
            Check the{' '}
            <Link href="https://tamagui.dev/takeout" target="_blank">
              <Span color="color12">pro version</Span>
            </Link>{' '}
            or the{' '}
            <Link href="https://github.com/tamagui/takeout-free" target="_blank">
              <Span color="color12">free one</Span>
            </Link>
            .
          </Paragraph>
        </YStack>

        {/* right side */}
        <YStack
          my="12"
          w={300}
          x="0px sm:20px lg:-50px"
          items="center"
          position="relative"
          minH={600}
          scale="1 sm:0.9 lg:1"
          y="0px sm:20px lg:20px"
        >
          <PhoneMockup />
          <YStack position="absolute" z={-1} x={-200} y={200} scale={0.8}>
            <HeroTerminal />
          </YStack>
        </YStack>
      </View>
    </HeroContainer>
  )
}
