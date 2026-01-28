import { memo, useEffect, useRef, useState } from 'react'
import { H1, Paragraph, Text, XStack, YStack, styled } from 'tamagui'

import { Link } from '~/interface/app/Link'
import { ArrowRightIcon } from '~/interface/icons/phosphor/ArrowRightIcon'
import { CheckIcon } from '~/interface/icons/phosphor/CheckIcon'
import { CopyIcon } from '~/interface/icons/phosphor/CopyIcon'

import { ButtonSimple } from '../buttons/ButtonSimple'
import { Span, Strong } from '../text/Text'

const HeroTitle = styled(H1, {
  letterSpacing: -1,
  color: '$color12',
  size: '$11',
  fontWeight: '800',

  $maxLG: {
    size: '$9',
    fontWeight: '800',
  },
})

const HeroSubtitle = styled(Paragraph, {
  color: '$color10',
  size: '$6',
  $xl: {
    size: '$7',
  },
  '$platform-web': {
    textWrap: 'balance',
  },
})

const HighlightText = styled(Text, {
  render: 'span',
  '$platform-web': {
    backgroundImage: 'linear-gradient(20deg, var(--yellow9) 0%, var(--red9) 100%)',
    backgroundClip: 'text',
    WebkitBackgroundClip: 'text',
    color: 'transparent',
  },
})

const CommandBox = styled(XStack, {
  rounded: '$6',
  px: '$4',
  py: '$3',
  bg: '$color3',
  items: 'center',
  flex: 1,
  mr: -20,
  gap: '$3',
  overflow: 'hidden',
  cursor: 'pointer',
  borderWidth: 1,
  borderColor: '$color5',
  style: {
    transition: 'background-color 200ms ease, border-color 200ms ease',
  },

  hoverStyle: {
    bg: '$color4',
    borderColor: '$color6',
  },

  pressStyle: {
    bg: '$color5',
  },
})

const TerminalContainer = styled(YStack, {
  bg: '#0d0d0d',
  rounded: '$6',
  overflow: 'hidden',
  borderWidth: 1,
  borderColor: 'rgba(255,255,255,0.1)',
  width: '100%',
  maxW: 560,
  shadowColor: '#000',
  shadowRadius: 40,
  shadowOffset: { width: 0, height: 20 },
  shadowOpacity: 0.4,
})

const TerminalHeader = styled(XStack, {
  bg: '#1a1a1a',
  pointerEvents: 'none',
  px: '$4',
  py: '$2',
  items: 'center',
  gap: '$2',
  borderBottomWidth: 1,
  borderBottomColor: 'rgba(255,255,255,0.1)',
})

const TerminalDot = styled(YStack, {
  width: 12,
  height: 12,
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
    <XStack gap="$2">
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
    <YStack opacity={0.5} mb="$3" gap="$1">
      <XStack>
        <Paragraph
          fontFamily="$mono"
          fontSize={13}
          color="#22c55e"
          mr="$2"
          style={{ lineHeight: '1.7' }}
        >
          $
        </Paragraph>
        <Paragraph
          fontFamily="$mono"
          fontSize={13}
          color="#e5e5e5"
          style={{ lineHeight: '1.7' }}
        >
          {command}
        </Paragraph>
      </XStack>
      {output.map((line, j) => (
        <Paragraph
          key={j}
          fontFamily="$mono"
          fontSize={13}
          color="#888"
          style={{ lineHeight: '1.7' }}
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
    command: 'bun run ci release',
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
                }, 2000)
              }
            }, 800)
          }
        }, 120)
      }
    }, 50)

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
          fontFamily="$mono"
          flex={1}
          text="center"
          mr="$8"
          select="none"
        >
          takeout-cli
        </Paragraph>
      </TerminalHeader>

      <YStack
        ref={contentRef as any}
        className="terminal-content"
        p="$4"
        height={TERMINAL_HEIGHT}
        overflow="scroll"
        gap="$1"
      >
        {history.map((entry, i) => (
          <HistoryEntry key={i} command={entry.command} output={entry.output} />
        ))}

        {!!typedCommand && (
          <YStack gap="$1">
            <XStack items="center">
              <Paragraph fontFamily="$mono" fontSize={13} color="#22c55e" mr="$2">
                $
              </Paragraph>
              <Paragraph fontFamily="$mono" fontSize={13} color="#e5e5e5">
                {typedCommand}
              </Paragraph>
              {!showOutput && (
                <YStack
                  className="terminal-cursor"
                  width={8}
                  height={16}
                  bg="#e5e5e5"
                  ml="$1"
                />
              )}
            </XStack>
          </YStack>
        )}

        {outputLines.map((line, i) => (
          <Paragraph key={i} fontFamily="$mono" fontSize={13} color="#888">
            {line}
          </Paragraph>
        ))}

        {!typedCommand && history.length === 0 && (
          <XStack items="center">
            <Paragraph fontFamily="$mono" fontSize={13} color="#22c55e" mr="$2">
              $
            </Paragraph>
            <YStack className="terminal-cursor" width={8} height={16} bg="#e5e5e5" />
          </XStack>
        )}
      </YStack>
    </TerminalContainer>
  )
}

const INSTALL_COMMAND = 'bun create takeout'

function CopyCommand() {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(INSTALL_COMMAND)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = INSTALL_COMMAND
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <CommandBox onPress={handleCopy} display="none" $sm={{ display: 'flex' }}>
      <Paragraph fontFamily="$mono" fontSize={14} color="$color11">
        $
      </Paragraph>
      <Paragraph pr="$4" flex={1} ellipsis fontFamily="$mono" fontWeight="700">
        {INSTALL_COMMAND}
      </Paragraph>
      {copied ? (
        <CheckIcon size={18} color="$color10" />
      ) : (
        <CopyIcon size={18} color="$color10" />
      )}
    </CommandBox>
  )
}

export function HeroSection() {
  return (
    <YStack
      items="center"
      gap="$8"
      px="$4"
      minH="calc(min(90vh, 900px))"
      justify="center"
    >
      <XStack
        gap="$2"
        items="center"
        justify="center"
        flexWrap="wrap"
        maxW={1200}
        width="100%"
        pb="$14"
        $lg={{ flexWrap: 'nowrap', gap: '$8' }}
      >
        {/* left side - hero content */}
        <YStack
          gap="$5"
          flex={1}
          minW={300}
          maxW={620}
          items="flex-start"
          scale={0.9}
          $heightLG={{
            scale: 1,
          }}
        >
          <YStack gap="$1">
            <HeroTitle>
              The <Span $maxXL={{ display: 'none' }}>startup</Span> stack that{' '}
              <em>actually</em> <HighlightText>cares.</HighlightText>
            </HeroTitle>
          </YStack>

          <HeroSubtitle>
            <Strong fontWeight="600" color="$color12">
              Most starter kits suck
            </Strong>
            . Takeout sucks less: novel&nbsp;tech 🤝 real-world experience, actual CI/CD
            with IaC, lots of "agent" stuff, and{' '}
            <Link href="/docs/changelog">constant updates</Link> — it's&nbsp;what we use
            for ourselves, and our <Link href="https://addeven.com">clients</Link>.
          </HeroSubtitle>
          <HeroSubtitle>
            It's the{' '}
            <Strong fontWeight="600" color="$color11">
              fast way to build a startup
            </Strong>{' '}
            on both React Native and web.
          </HeroSubtitle>

          <XStack maxW="100%" gap="$3" mt="$2" items="center">
            <Link href="/docs/introduction">
              <ButtonSimple theme="accent" size="large" icon={ArrowRightIcon} iconAfter>
                Docs
              </ButtonSimple>
            </Link>

            <CopyCommand />
          </XStack>

          <Paragraph size="$6" color="$color10">
            Check the{' '}
            <Link href="https://tamagui.dev/takeout" target="_blank">
              <Span color="$color12">pro version</Span>
            </Link>{' '}
            or{' '}
            <Link href="https://github.com/tamagui/takeout-free" target="_blank">
              <Span color="$color12">free one</Span>
            </Link>
            .
          </Paragraph>
        </YStack>

        {/* right side - terminal */}
        <YStack
          flex={1}
          minW={300}
          maxW={480}
          x={0}
          items="center"
          $md={{ x: 50 }}
          $lg={{ items: 'flex-end', x: 0 }}
          $sm={{
            mt: '$15',
          }}
          position="relative"
          transition="bouncy"
        >
          <YStack
            maxW="100%"
            maxH="100%"
            items="center"
            justify="center"
            self="center"
            aspectRatio="588 / 1176"
          >
            <svg width="0" height="0" style={{ position: 'absolute' }}>
              <defs>
                <clipPath id="iphone-screen-clip" clipPathUnits="objectBoundingBox">
                  <path d="M0.27,0 L0.73,0 C0.875,0 0.937,0.0095 0.9685,0.0425 C1,0.075 1,0.125 1,0.1675 L1,0.8325 C1,0.875 1,0.925 0.9685,0.9575 C0.937,0.9905 0.875,1 0.73,1 L0.27,1 C0.125,1 0.063,0.9905 0.0315,0.9575 C0,0.925 0,0.875 0,0.8325 L0,0.1675 C0,0.125 0,0.075 0.0315,0.0425 C0.063,0.0095 0.125,0 0.27,0 Z" />
                </clipPath>
              </defs>
            </svg>
            <YStack filter="drop-shadow(0 25px 50px rgba(0,0,0,0.8))">
              <YStack
                overflow="hidden"
                position="relative"
                style={{
                  width: 290,
                  height: 594,
                  clipPath: 'url(#iphone-screen-clip)',
                  WebkitClipPath: 'url(#iphone-screen-clip)',
                }}
              >
                <video
                  autoPlay
                  loop
                  muted
                  playsInline
                  style={{
                    position: 'absolute',
                    top: -1,
                    left: -3.5,
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

          {/* <HeroTerminal /> */}
        </YStack>
      </XStack>
    </YStack>
  )
}
