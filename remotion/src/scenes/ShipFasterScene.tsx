import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion'

const FONT = "'Inter', -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif"

export const ShipFasterScene: React.FC = () => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  // first line entrance - softer spring with slight bounce
  const line1Spring = spring({
    frame: Math.max(0, frame - 8),
    fps,
    config: { damping: 14, stiffness: 100, mass: 1 },
    durationInFrames: 35,
  })
  const line1Y = interpolate(line1Spring, [0, 1], [40, 0])
  const line1Opacity = interpolate(line1Spring, [0, 0.4], [0, 1], {
    extrapolateRight: 'clamp',
  })
  const line1Scale = interpolate(line1Spring, [0, 1], [0.92, 1])

  // second line entrance - staggered with matching feel
  const line2Spring = spring({
    frame: Math.max(0, frame - 28),
    fps,
    config: { damping: 14, stiffness: 100, mass: 1 },
    durationInFrames: 35,
  })
  const line2Y = interpolate(line2Spring, [0, 1], [40, 0])
  const line2Opacity = interpolate(line2Spring, [0, 0.4], [0, 1], {
    extrapolateRight: 'clamp',
  })
  const line2Scale = interpolate(line2Spring, [0, 1], [0.92, 1])

  // subtle breathing motion after lines settle
  const breatheStart = 80
  const breatheProgress = Math.max(0, frame - breatheStart)
  const breatheScale = breatheProgress > 0 ? 1 + Math.sin(breatheProgress * 0.03) * 0.008 : 1

  // background glow builds up
  const bgGlow = interpolate(frame, [0, 60], [0, 0.4], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.quad),
  })

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#050505',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      {/* subtle background glow */}
      <div
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          background: `radial-gradient(ellipse 60% 40% at 50% 50%,
            rgba(78, 205, 196, ${bgGlow * 0.08}) 0%,
            rgba(168, 85, 247, ${bgGlow * 0.04}) 50%,
            transparent 80%)`,
        }}
      />

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 8,
          transform: `scale(${breatheScale})`,
        }}
      >
        <div
          style={{
            fontSize: 52,
            fontFamily: FONT,
            fontWeight: 700,
            color: '#ffffff',
            letterSpacing: -1,
            opacity: line1Opacity,
            transform: `translateY(${line1Y}px) scale(${line1Scale})`,
          }}
        >
          ship faster.
        </div>
        <div
          style={{
            fontSize: 52,
            fontFamily: FONT,
            fontWeight: 700,
            color: '#ffffff',
            letterSpacing: -1,
            opacity: line2Opacity,
            transform: `translateY(${line2Y}px) scale(${line2Scale})`,
          }}
        >
          ship everywhere.
        </div>
      </div>
    </AbsoluteFill>
  )
}
