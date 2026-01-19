import { YStack, styled } from 'tamagui'

const GradientOrb = styled(YStack, {
  position: 'absolute',
  rounded: 1000,
  pointerEvents: 'none',
  // gpu acceleration for better perf
  style: {
    willChange: 'transform',
    transform: 'translateZ(0)',
  },
})

export function GrainBackground() {
  return (
    <YStack
      position={'absolute' as any}
      t={-100}
      l={0}
      r={0}
      height="calc(100vh + 100px)"
      overflow="hidden"
      z={0}
      pointerEvents="none"
    >
      {/* gradient orbs using radial gradients instead of blur filter */}
      <GradientOrb
        width={800}
        height={800}
        t={-300}
        l={-200}
        style={{
          background:
            'radial-gradient(circle, rgba(230, 218, 193, 0.1) 0%, transparent 70%)',
        }}
      />
      <GradientOrb
        width={600}
        height={600}
        t={300}
        r={-200}
        style={{
          background: 'radial-gradient(circle, var(--blue10) 0%, transparent 70%)',
          opacity: 0.06,
        }}
      />
      <GradientOrb
        width={500}
        height={500}
        b={-100}
        l="40%"
        style={{
          background:
            'radial-gradient(circle, rgba(230, 218, 193, 0.05) 0%, transparent 70%)',
        }}
      />

      {/* grain texture overlay using svg filter */}
      <YStack
        className="grain-overlay"
        fullscreen
        t={-60}
        b={0}
        opacity={0.15}
        $theme-light={{
          opacity: 0.1,
          filter: 'invert(1)',
        }}
        z={-1}
        pointerEvents="none"
        style={{
          imageRendering: 'pixelated',
        }}
      />
    </YStack>
  )
}
