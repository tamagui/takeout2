import { YStack, styled } from 'tamagui'

const GradientOrb = styled(YStack, {
  position: 'absolute',
  rounded: 1000,
  pointerEvents: 'none',
})

export function GrainBackground() {
  return (
    <YStack
      position={'fixed' as any}
      t={0}
      l={0}
      r={0}
      b={0}
      overflow="hidden"
      z={0}
      pointerEvents="none"
    >
      {/* gradient orbs for aurora effect */}
      <GradientOrb
        width={800}
        height={800}
        t={-300}
        l={-200}
        bg="#e6dac1"
        opacity={0.1}
        style={{ filter: 'blur(150px)' }}
      />
      <GradientOrb
        width={600}
        height={600}
        t={300}
        r={-200}
        bg="$blue10"
        opacity={0.06}
        style={{ filter: 'blur(150px)' }}
      />
      <GradientOrb
        width={500}
        height={500}
        b={-100}
        l="40%"
        bg="#e6dac1"
        opacity={0.05}
        style={{ filter: 'blur(150px)' }}
      />

      {/* grain texture overlay */}
      <YStack
        className="grain-overlay"
        fullscreen
        t={-60}
        b={0}
        opacity={0.4}
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
    </YStack>
  )
}
