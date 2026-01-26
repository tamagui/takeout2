import { useEffect, useRef, useState } from 'react'
import { H1, Paragraph, Text, XStack, YStack, styled } from 'tamagui'

import { Link } from '~/interface/app/Link'
import { OneLogo } from '~/interface/icons/logos/OneLogo'
import { TamaguiLogo } from '~/interface/icons/logos/TamaguiLogo'
import { ZeroLogo } from '~/interface/icons/logos/ZeroLogo'
import { ArrowRightIcon } from '~/interface/icons/phosphor/ArrowRightIcon'
import { CheckIcon } from '~/interface/icons/phosphor/CheckIcon'
import { CopyIcon } from '~/interface/icons/phosphor/CopyIcon'

import { ButtonSimple } from '../buttons/ButtonSimple'
import { Span, Strong } from '../text/Text'

const techLogos = [
  {
    name: 'One',
    href: 'https://onestack.dev',
    Logo: OneLogo,
    size: 24,
  },
  {
    name: 'Zero',
    href: 'https://zero.rocicorp.dev',
    Logo: ZeroLogo,
    size: 22,
  },
  {
    name: 'Tamagui',
    href: 'https://tamagui.dev',
    Logo: TamaguiLogo,
    size: 22,
  },
] as const

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
  rounded: '$5',
  px: '$4',
  py: '$3',
  bg: '$color3',
  items: 'center',
  flex: 1,
  mr: -50,
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

const steps: CommandStep[] = [
  {
    command: 'bunx create-takeout@latest my-app',
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
    setTypedCommand('')
    setShowOutput(false)
    setOutputLines([])

    const typeInterval = setInterval(() => {
      if (charIndex < step.command.length) {
        setTypedCommand(step.command.slice(0, charIndex + 1))
        charIndex++
      } else {
        clearInterval(typeInterval)
        setShowOutput(true)

        let lineIndex = 0
        const outputInterval = setInterval(() => {
          if (lineIndex < step.output.length) {
            const line = step.output[lineIndex]!
            setOutputLines((prev) => [...prev, line])
            lineIndex++
          } else {
            clearInterval(outputInterval)

            setTimeout(() => {
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
                setTimeout(() => {
                  setHistory([])
                  setCurrentStep(0)
                }, 2000)
              }
            }, 800)
          }
        }, 120)
      }
    }, 50)

    return () => clearInterval(typeInterval)
  }, [currentStep])

  return (
    <TerminalContainer>
      <TerminalHeader>
        <XStack gap="$2">
          <TerminalDot bg="#ff5f57" />
          <TerminalDot bg="#ffbd2e" />
          <TerminalDot bg="#28ca42" />
        </XStack>
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

      <div
        ref={contentRef}
        className="terminal-content"
        style={{
          padding: 16,
          height: TERMINAL_HEIGHT,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
        }}
      >
        {history.map((entry, i) => (
          <YStack key={i} opacity={0.5} mb="$3" gap="$1">
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
                {entry.command}
              </Paragraph>
            </XStack>
            {entry.output.map((line, j) => (
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
        ))}

        {typedCommand && (
          <YStack gap="$1">
            <XStack items="center">
              <Paragraph fontFamily="$mono" fontSize={13} color="#22c55e" mr="$2">
                $
              </Paragraph>
              <Paragraph fontFamily="$mono" fontSize={13} color="#e5e5e5">
                {typedCommand}
              </Paragraph>
              {!showOutput && <YStack width={8} height={16} bg="#e5e5e5" ml="$1" />}
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
            <YStack width={8} height={16} bg="#e5e5e5" />
          </XStack>
        )}
      </div>
    </TerminalContainer>
  )
}

const INSTALL_COMMAND = 'bunx create-takeout@latest'

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
      <Paragraph flex={1} ellipsis fontFamily="$mono" fontSize={14} color="$color12">
        {INSTALL_COMMAND}
      </Paragraph>
      {copied ? (
        <CheckIcon size={18} color={'$color10' as any} />
      ) : (
        <CopyIcon size={18} color={'$color10' as any} />
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
        gap="$8"
        items="center"
        justify="center"
        flexWrap="wrap"
        maxW={1200}
        width="100%"
        pb="$14"
        $md={{ flexWrap: 'nowrap', gap: '$12' }}
      >
        {/* left side - hero content */}
        <YStack
          gap="$5"
          flex={1}
          minW={300}
          maxW={520}
          items="flex-start"
          scale={0.9}
          $heightLG={{
            scale: 1,
          }}
        >
          <YStack gap="$1">
            <HeroTitle>
              The <Span $maxXL={{ display: 'none' }}>startup</Span> starter that{' '}
              <em>actually</em> gives you an{' '}
              <HighlightText render="span">edge</HighlightText>.
            </HeroTitle>
          </YStack>

          <HeroSubtitle>
            <Strong fontWeight="600" color="$color12">
              Most starter kits suck
            </Strong>
            . Takeout may not: novel tech, prod-tested, skills + MCPs, scalable IaC, and{' '}
            <Link href="/docs/changelog">updated often</Link> — it's&nbsp;what we use for
            ourselves and <Link href="https://addeven.com">our clients</Link>.
            <br />
            <br />
            It's the{' '}
            <Strong fontWeight="600" color="$color11">
              fast way to build a startup
            </Strong>{' '}
            with React Native and web.
          </HeroSubtitle>

          <XStack gap="$3" mt="$2" items="center">
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
          maxW={560}
          items="center"
          $md={{ items: 'flex-end' }}
          position="relative"
        >
          <HeroTerminal />
        </YStack>
      </XStack>
    </YStack>
  )
}
