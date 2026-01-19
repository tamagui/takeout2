import { usePathname } from 'one'
import { YStack, styled } from 'tamagui'

const GradientOrb = styled(YStack, {
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
  if (pathname !== '/' || process.env.VITE_PLATFORM !== 'web') {
    return null
  }

  return (
    <>
      {/* grain texture - fullscreen fixed */}
      <YStack
        className="grain-overlay"
        position="absolute"
        t={0}
        l={0}
        r={0}
        b={0}
        opacity={0.15}
        $theme-light={{
          opacity: 0.1,
          filter: 'invert(1)',
        }}
        z={0}
        pointerEvents="none"
        style={{
          imageRendering: 'pixelated',
        }}
      />

      {/* gradient orbs - absolute, scroll with page */}
      <YStack
        position="absolute"
        t={0}
        l={0}
        r={0}
        height="100vh"
        z={0}
        pointerEvents="none"
      >
        <GradientOrb
          width={800}
          height={800}
          t={-300}
          l={-200}
          style={{
            background:
              'radial-gradient(circle, rgba(230, 218, 193, 0.08) 0%, transparent 70%)',
          }}
        />
        <GradientOrb
          width={600}
          height={600}
          t={300}
          r={-200}
          style={{
            background: 'radial-gradient(circle, var(--blue10) 0%, transparent 70%)',
            opacity: 0.048,
          }}
        />
        <GradientOrb
          width={500}
          height={500}
          b={-100}
          l="40%"
          style={{
            background:
              'radial-gradient(circle, rgba(230, 218, 193, 0.04) 0%, transparent 70%)',
          }}
        />
      </YStack>
    </>
  )
}
