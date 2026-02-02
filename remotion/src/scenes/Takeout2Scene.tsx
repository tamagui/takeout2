import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion'

const FONT = "'Inter', -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif"

export const Takeout2Scene: React.FC = () => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  // logo entrance
  const logoSpring = spring({
    frame: Math.max(0, frame - 10),
    fps,
    config: { damping: 20, stiffness: 200 },
    durationInFrames: 30,
  })
  const logoScale = interpolate(logoSpring, [0, 1], [0.6, 1])
  const logoOpacity = interpolate(logoSpring, [0, 1], [0, 1], {
    extrapolateRight: 'clamp',
  })

  // title entrance
  const titleSpring = spring({
    frame: Math.max(0, frame - 30),
    fps,
    config: { damping: 20, stiffness: 180 },
    durationInFrames: 25,
  })
  const titleY = interpolate(titleSpring, [0, 1], [20, 0])
  const titleOpacity = interpolate(titleSpring, [0, 1], [0, 1], {
    extrapolateRight: 'clamp',
  })

  // background glow
  const bgGlow = interpolate(frame, [10, 60], [0, 0.5], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.quad),
  })

  // subtle float for logo only, starts after animations settle
  const floatY = frame > 70 ? Math.sin((frame - 70) * 0.018) * 2 : 0

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#050505',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      {/* background glow */}
      <div
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          background: `radial-gradient(ellipse 50% 50% at 50% 45%,
            rgba(78, 205, 196, ${bgGlow * 0.12}) 0%,
            rgba(168, 85, 247, ${bgGlow * 0.06}) 40%,
            transparent 70%)`,
        }}
      />

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 24,
        }}
      >
        {/* logo with float */}
        <div
          style={{
            opacity: logoOpacity,
            transform: `scale(${logoScale}) translateY(${floatY}px)`,
          }}
        >
          <Img
            src={staticFile('logo.png')}
            style={{
              width: 180,
              height: 180,
              objectFit: 'contain',
            }}
          />
        </div>

        {/* takeout 2 text - no float, stable */}
        <div
          style={{
            fontSize: 56,
            fontFamily: FONT,
            fontWeight: 700,
            color: '#ffffff',
            letterSpacing: -1,
            opacity: titleOpacity,
            transform: `translateY(${titleY}px)`,
          }}
        >
          Takeout 2
        </div>
      </div>
    </AbsoluteFill>
  )
}
