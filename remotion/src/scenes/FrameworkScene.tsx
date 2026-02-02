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
const COLOR = '#F5CA05'

export const FrameworkScene: React.FC = () => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  // hero image entrance
  const heroSpring = spring({
    frame,
    fps,
    config: { damping: 20, stiffness: 200 },
    durationInFrames: 35,
  })
  const heroScale = interpolate(heroSpring, [0, 1], [0.3, 1])
  const heroOpacity = interpolate(heroSpring, [0, 1], [0, 1], {
    extrapolateRight: 'clamp',
  })

  // title entrance
  const titleSpring = spring({
    frame: Math.max(0, frame - 20),
    fps,
    config: { damping: 20, stiffness: 200 },
    durationInFrames: 24,
  })
  const titleX = interpolate(titleSpring, [0, 1], [-80, 0])
  const titleOpacity = interpolate(titleSpring, [0, 1], [0, 1], {
    extrapolateRight: 'clamp',
  })

  // version text
  const versionOpacity = interpolate(frame, [40, 55], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.quad),
  })
  const versionY = interpolate(frame, [40, 55], [10, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.quad),
  })

  // background glow
  const bgGlow = interpolate(frame, [0, 50], [0, 0.6], {
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
      {/* background glow */}
      <div
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          background: `radial-gradient(ellipse 50% 50% at 50% 45%,
            ${COLOR}${Math.round(bgGlow * 12)
              .toString(16)
              .padStart(2, '0')} 0%,
            transparent 70%)`,
        }}
      />

      {/* content */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 22,
          transform: 'translateY(0px)',
        }}
      >
        {/* hero ball image */}
        <div
          style={{
            transform: `scale(${heroScale})`,
            opacity: heroOpacity,
          }}
        >
          <Img
            src={staticFile('ball_circle.WEBP')}
            style={{
              width: 240,
              height: 240,
              objectFit: 'contain',
            }}
          />
        </div>

        {/* title */}
        <span
          style={{
            fontSize: 68,
            fontFamily: FONT,
            fontWeight: 800,
            color: '#ffffff',
            letterSpacing: -1,
            transform: `translateX(${titleX}px)`,
            opacity: titleOpacity,
          }}
        >
          One
        </span>

        {/* version text */}
        <div
          style={{
            fontSize: 22,
            fontFamily: FONT,
            fontWeight: 300,
            color: '#ffffff',
            letterSpacing: 2,
            opacity: versionOpacity,
            transform: `translateY(${versionY}px)`,
          }}
        >
          Version 1
        </div>
      </div>
    </AbsoluteFill>
  )
}
