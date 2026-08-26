import { usePathname } from 'one'
import { html, YStack, styled } from 'tamagui'

const GradientOrb = styled(html.div, {
  position: 'absolute',
  rounded: 1000,
  pointerEvents: 'none',
  style: {
    willChange: 'transform',
    transform: 'translateZ(0)',
  },
})

export function HomeBackground() {
  const pathname = usePathname()

  // only show on homepage and web
  if (pathname !== '/' || process.env.VITE_NATIVE) {
    return null
  }

  return (
    <>
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
          w={1200}
          h={1200}
          t={-300}
          l={-200}
          style={{
            background:
              'radial-gradient(circle, rgba(100, 100, 100, 0.08) 0%, transparent 70%)',
          }}
        />
        <GradientOrb
          w={800}
          h={800}
          t={300}
          r={-200}
          style={{
            background: 'radial-gradient(circle, var(--blue10) 0%, transparent 70%)',
            opacity: 0.048,
          }}
        />
        <GradientOrb
          w={500}
          h={500}
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
