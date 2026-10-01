import { memo, useEffect, useRef, useState } from 'react'
import { Paragraph, styled, XStack, YStack, type TamaguiElement } from 'tamagui'

const TerminalContainer = styled(YStack, {
  bg: '#0d0d0d',
  rounded: 16,
  overflow: 'hidden',
  borderWidth: 1,
  borderColor: 'rgba(255,255,255,0.1)',
  width: '100%',
  maxW: 520,
  boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
  display: 'none md:flex',
})

const TerminalHeader = styled(XStack, {
  bg: '#1a1a1a',
  pointerEvents: 'none',
  px: 18,
  py: 7,
  items: 'center',
  gap: 8,
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

const TerminalDots = memo(function TerminalDots() {
  return (
    <XStack gap={8}>
      <TerminalDot bg="#ff5f57" />
      <TerminalDot bg="#ffbd2e" />
      <TerminalDot bg="#28ca42" />
    </XStack>
  )
})

const HistoryEntry = memo(function HistoryEntry({
  command,
  output,
}: {
  command: string
  output: string[]
}) {
  return (
    <YStack opacity={0.5} mb={12} gap={4}>
      <XStack>
        <Paragraph
          fontFamily="takeout-mono"
          fontSize={13}
          color="#22c55e"
          mr={8}
          style={{ lineHeight: 1.7 }}
        >
          $
        </Paragraph>
        <Paragraph
          fontFamily="takeout-mono"
          fontSize={13}
          color="#e5e5e5"
          style={{ lineHeight: 1.7 }}
        >
          {command}
        </Paragraph>
      </XStack>
      {output.map((line, j) => (
        <Paragraph
          key={j}
          fontFamily="takeout-mono"
          fontSize={13}
          color="#888"
          style={{ lineHeight: 1.7 }}
        >
          {line}
        </Paragraph>
      ))}
    </YStack>
  )
})

const steps: CommandStep[] = [
  {
    command: 'bun install',
    output: [
      '  Installing dependencies...',
      '  Auth and live sync configured',
      '  Ready to dev',
    ],
  },
  {
    command: 'bun dev',
    output: [
      '  Starting development server...',
      '  Web: http://localhost:4200',
      '  Native: One Metro server',
      '  Ready to develop',
    ],
  },
  {
    command: 'bun run build',
    output: [
      '  Building for production...',
      '  Bundling web + native targets...',
      '  Optimizing assets...',
      '  Cloudflare worker built',
    ],
  },
]

export function HeroTerminal() {
  const [currentStep, setCurrentStep] = useState(0)
  const [typedCommand, setTypedCommand] = useState('')
  const [showOutput, setShowOutput] = useState(false)
  const [outputLines, setOutputLines] = useState<string[]>([])
  const [history, setHistory] = useState<{ command: string; output: string[] }[]>([])
  const contentRef = useRef<TamaguiElement>(null)

  useEffect(() => {
    if (contentRef.current instanceof HTMLElement) {
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
              setShowOutput(false)
              setOutputLines([])

              resetTimeout = setTimeout(() => {
                if (cancelled) return
                setCurrentStep((prev) => {
                  if (prev + 1 >= steps.length) {
                    setHistory([])
                    return 0
                  }
                  return prev + 1
                })
              }, 600)
            }, 1800)
          }
        }, 120)
      }
    }, 45)

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
          fontFamily="takeout-mono"
          flex={1}
          textAlign="center"
          mr={32}
          select="none"
        >
          takeout-cli
        </Paragraph>
      </TerminalHeader>

      <YStack
        ref={contentRef}
        className="terminal-content"
        p={18}
        height={TERMINAL_HEIGHT}
        overflow="scroll"
        gap={4}
      >
        {history.map((entry, i) => (
          <HistoryEntry key={i} command={entry.command} output={entry.output} />
        ))}

        {!!typedCommand && (
          <YStack gap={4}>
            <XStack items="center">
              <Paragraph fontFamily="takeout-mono" fontSize={13} color="#22c55e" mr={8}>
                $
              </Paragraph>
              <Paragraph fontFamily="takeout-mono" fontSize={13} color="#e5e5e5">
                {typedCommand}
              </Paragraph>
              {!showOutput && (
                <YStack
                  className="terminal-cursor"
                  width={8}
                  height={16}
                  bg="#e5e5e5"
                  ml={4}
                />
              )}
            </XStack>
          </YStack>
        )}

        {outputLines.map((line, i) => (
          <Paragraph key={i} fontFamily="takeout-mono" fontSize={13} color="#888">
            {line}
          </Paragraph>
        ))}

        {!typedCommand && history.length === 0 && (
          <XStack items="center">
            <Paragraph fontFamily="takeout-mono" fontSize={13} color="#22c55e" mr={8}>
              $
            </Paragraph>
            <YStack className="terminal-cursor" width={8} height={16} bg="#e5e5e5" />
          </XStack>
        )}
      </YStack>
    </TerminalContainer>
  )
}
