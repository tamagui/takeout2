import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion'

const FONT =
  "'Inter', -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif"

export const ShipFasterScene: React.FC = () => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  // first line entrance
  const line1Spring = spring({
    frame: Math.max(0, frame - 10),
    fps,
    config: { damping: 20, stiffness: 180 },
    durationInFrames: 25,
  })
  const line1Y = interpolate(line1Spring, [0, 1], [20, 0])
  const line1Opacity = interpolate(line1Spring, [0, 1], [0, 1], {
    extrapolateRight: 'clamp',
  })

  // second line entrance
  const line2Spring = spring({
    frame: Math.max(0, frame - 35),
    fps,
    config: { damping: 20, stiffness: 180 },
    durationInFrames: 25,
  })
  const line2Y = interpolate(line2Spring, [0, 1], [20, 0])
  const line2Opacity = interpolate(line2Spring, [0, 1], [0, 1], {
    extrapolateRight: 'clamp',
  })

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#050505',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 8,
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
            transform: `translateY(${line1Y}px)`,
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
            transform: `translateY(${line2Y}px)`,
          }}
        >
          ship everywhere.
        </div>
      </div>
    </AbsoluteFill>
  )
}
