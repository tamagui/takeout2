import { isWeb, styled, YStack } from 'tamagui'

const GradientOrb = styled(YStack, {
  position: 'absolute',
  rounded: 1000,
  pointerEvents: 'none',
  style: {
    willChange: 'transform',
    transform: 'translateZ(0)',
  },
})

export const MARKETING_CSS = `
/* terminal scrollbar hide */
.terminal-content {
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.terminal-content::-webkit-scrollbar {
  display: none;
}

/* terminal cursor blink - css animation avoids react re-renders */
@keyframes cursor-blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
}

.terminal-cursor {
  animation: cursor-blink 1s step-end infinite;
}

/* grain texture overlay - svg filter is more efficient than png */
.grain-overlay {
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  background-repeat: repeat;
  background-size: 200px 200px;
}
`

export function HomeBackground() {
  if (!isWeb) return null

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: MARKETING_CSS }} />

      {/* grain texture - fullscreen fixed */}
      <YStack
        className="grain-overlay"
        position="absolute"
        inset={0}
        opacity={0.3}
        filter="dark:invert(1)"
        z={0}
        pointerEvents="none"
      />

      {/* gradient orbs - absolute, scroll with page */}
      <YStack position="absolute" inset={0} z={0} pointerEvents="none" overflow="hidden">
        <GradientOrb
          width={1200}
          height={1200}
          t={-300}
          l={-200}
          style={{
            background:
              'radial-gradient(circle, rgba(100, 100, 100, 0.08) 0%, transparent 70%)',
          }}
        />
        <GradientOrb
          width={800}
          height={800}
          t={300}
          r={-200}
          style={{
            background: 'radial-gradient(circle, var(--blue-10) 0%, transparent 70%)',
            opacity: 0.048,
          }}
        />
        <GradientOrb
          width={500}
          height={500}
          b={-100}
          l="40%"
          opacity={0.25}
          style={{
            background:
              'radial-gradient(circle, rgba(230, 218, 193, 0.04) 0%, transparent 70%)',
          }}
        />
      </YStack>
    </>
  )
}
