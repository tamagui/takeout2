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

export const LogoRevealScene: React.FC = () => {
  const frame = useCurrentFrame()
  const { fps, width } = useVideoConfig()

  // logo entrance: smooth spring with slight overshoot
  const logoSpring = spring({
    frame,
    fps,
    config: { damping: 15, stiffness: 120 },
    durationInFrames: Math.round(1.5 * fps),
  })

  const logoScale = interpolate(logoSpring, [0, 1], [0.3, 1])
  const logoOpacity = interpolate(logoSpring, [0, 0.3], [0, 1], {
    extrapolateRight: 'clamp',
  })

  // 3d rotation entrance
  const logoRotateY = interpolate(logoSpring, [0, 1], [45, 0])
  const logoRotateZ = interpolate(logoSpring, [0, 1], [-5, 0])

  // glow builds
  const glowIntensity = interpolate(frame, [0.8 * fps, 2.5 * fps], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.quad),
  })

  // "takeout" text fades in below
  const textSpring = spring({
    frame,
    fps,
    config: { damping: 200 },
    delay: Math.round(1 * fps),
  })

  const textOpacity = textSpring
  const textY = interpolate(textSpring, [0, 1], [25, 0])

  // subtle float
  const floatPhase = Math.max(0, frame - 1.5 * fps)
  const floatY = floatPhase > 0 ? Math.sin(floatPhase * 0.025) * 4 : 0

  const logoSize = Math.min(width * 0.22, 260)

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#0a0a0a',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      {/* radial glow behind logo */}
      <div
        style={{
          position: 'absolute',
          width: 600,
          height: 600,
          borderRadius: '50%',
          background: `radial-gradient(circle,
            rgba(255,255,255,${0.15 * glowIntensity}) 0%,
            rgba(200,200,255,${0.05 * glowIntensity}) 40%,
            transparent 70%)`,
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -55%)',
        }}
      />

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 30,
          transform: `translateY(${floatY}px)`,
        }}
      >
        {/* logo image */}
        <div
          style={{
            opacity: logoOpacity,
            transform: `scale(${logoScale}) perspective(1000px) rotateY(${logoRotateY}deg) rotate(${logoRotateZ}deg)`,
            filter: `drop-shadow(0 0 ${25 * glowIntensity}px rgba(255,255,255,0.25))`,
          }}
        >
          <Img
            src={staticFile('logo.png')}
            style={{
              width: logoSize,
              height: logoSize,
              objectFit: 'contain',
            }}
          />
        </div>

        {/* "takeout" text */}
        <div
          style={{
            opacity: textOpacity,
            transform: `translateY(${textY}px)`,
            fontSize: Math.min(width * 0.04, 52),
            fontFamily: 'Inter, system-ui, sans-serif',
            fontWeight: 700,
            color: '#ffffff',
            letterSpacing: 10,
            textTransform: 'uppercase',
          }}
        >
          takeout
        </div>
      </div>
    </AbsoluteFill>
  )
}
