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

  // logo entrance - starts from bottom like the previous scene's text
  // this creates visual continuity with the ShipFasterScene
  const logoSpring = spring({
    frame: Math.max(0, frame - 5),
    fps,
    config: { damping: 12, stiffness: 80, mass: 1.2 },
    durationInFrames: 45,
  })
  const logoY = interpolate(logoSpring, [0, 1], [60, 0])
  const logoScale = interpolate(logoSpring, [0, 1], [0.7, 1])
  const logoOpacity = interpolate(logoSpring, [0, 0.3], [0, 1], {
    extrapolateRight: 'clamp',
  })
  // slight rotation for organic feel
  const logoRotation = interpolate(logoSpring, [0, 1], [-8, 0])

  // title entrance - follows logo with matching motion
  const titleSpring = spring({
    frame: Math.max(0, frame - 25),
    fps,
    config: { damping: 14, stiffness: 90, mass: 1 },
    durationInFrames: 40,
  })
  const titleY = interpolate(titleSpring, [0, 1], [35, 0])
  const titleOpacity = interpolate(titleSpring, [0, 0.35], [0, 1], {
    extrapolateRight: 'clamp',
  })
  const titleScale = interpolate(titleSpring, [0, 1], [0.9, 1])

  // background glow - starts earlier and more dramatic
  const bgGlow = interpolate(frame, [0, 50], [0, 0.6], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.quad),
  })

  // subtle float for logo only, starts after animations settle
  const floatStart = 65
  const floatProgress = Math.max(0, frame - floatStart)
  const floatY = floatProgress > 0 ? Math.sin(floatProgress * 0.02) * 4 : 0
  const floatRotate = floatProgress > 0 ? Math.sin(floatProgress * 0.015) * 1 : 0

  // breathing scale for the whole container
  const breatheScale = floatProgress > 0 ? 1 + Math.sin(floatProgress * 0.025) * 0.006 : 1

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
          background: `radial-gradient(ellipse 55% 55% at 50% 45%,
            rgba(78, 205, 196, ${bgGlow * 0.14}) 0%,
            rgba(168, 85, 247, ${bgGlow * 0.08}) 45%,
            transparent 75%)`,
        }}
      />

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 24,
          transform: `scale(${breatheScale})`,
        }}
      >
        {/* logo with float */}
        <div
          style={{
            opacity: logoOpacity,
            transform: `
              translateY(${logoY + floatY}px)
              scale(${logoScale})
              rotate(${logoRotation + floatRotate}deg)
            `,
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

        {/* takeout 2 text */}
        <div
          style={{
            fontSize: 56,
            fontFamily: FONT,
            fontWeight: 700,
            color: '#ffffff',
            letterSpacing: -1,
            opacity: titleOpacity,
            transform: `translateY(${titleY}px) scale(${titleScale})`,
          }}
        >
          Takeout 2
        </div>
      </div>
    </AbsoluteFill>
  )
}
