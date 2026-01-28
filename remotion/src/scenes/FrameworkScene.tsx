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

const FONT =
  "'Inter', -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif"
const COLOR = '#F5CA05'

const FEATURES = ['Web + Native', 'Single Vite Plugin', 'Metro Mode']

export const FrameworkScene: React.FC = () => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  // hero image entrance
  const heroSpring = spring({
    frame,
    fps,
    config: { damping: 20, stiffness: 200 },
    durationInFrames: 30,
  })
  const heroScale = interpolate(heroSpring, [0, 1], [0.3, 1])
  const heroOpacity = interpolate(heroSpring, [0, 1], [0, 1], {
    extrapolateRight: 'clamp',
  })

  // title entrance
  const titleSpring = spring({
    frame: Math.max(0, frame - 15),
    fps,
    config: { damping: 20, stiffness: 200 },
    durationInFrames: 20,
  })
  const titleX = interpolate(titleSpring, [0, 1], [-80, 0])
  const titleOpacity = interpolate(titleSpring, [0, 1], [0, 1], {
    extrapolateRight: 'clamp',
  })

  // version badge
  const badgeSpring = spring({
    frame: Math.max(0, frame - 25),
    fps,
    config: { damping: 15, stiffness: 200 },
    durationInFrames: 15,
  })
  const badgeScale = interpolate(badgeSpring, [0, 1], [0, 1])

  // subtitle
  const subOpacity = interpolate(frame, [35, 48], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.quad),
  })
  const subY = interpolate(frame, [35, 48], [15, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.quad),
  })

  // background glow
  const bgGlow = interpolate(frame, [0, 40], [0, 0.6], {
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.quad),
  })

  // gentle float after entrance
  const floatY = frame > 30 ? Math.sin((frame - 30) * 0.025) * 3 : 0

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
            ${COLOR}${Math.round(bgGlow * 12).toString(16).padStart(2, '0')} 0%,
            transparent 70%)`,
        }}
      />

      {/* content */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 20,
          transform: `translateY(${floatY}px)`,
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
              width: 220,
              height: 220,
              objectFit: 'contain',
            }}
          />
        </div>

        {/* title row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            transform: `translateX(${titleX}px)`,
            opacity: titleOpacity,
          }}
        >
          <span
            style={{
              fontSize: 64,
              fontFamily: FONT,
              fontWeight: 800,
              color: '#ffffff',
              letterSpacing: -1,
            }}
          >
            ONE
          </span>
          <span
            style={{
              fontSize: 20,
              fontFamily: FONT,
              fontWeight: 700,
              color: COLOR,
              background: `${COLOR}20`,
              border: `1px solid ${COLOR}50`,
              borderRadius: 8,
              padding: '4px 12px',
              transform: `scale(${badgeScale})`,
            }}
          >
            v1
          </span>
        </div>

        {/* subtitle */}
        <div
          style={{
            fontSize: 24,
            fontFamily: FONT,
            fontWeight: 400,
            color: '#a0a0a0',
            letterSpacing: 2,
            textTransform: 'uppercase',
            opacity: subOpacity,
            transform: `translateY(${subY}px)`,
          }}
        >
          The React Framework
        </div>

        {/* feature chips */}
        <div
          style={{
            display: 'flex',
            gap: 12,
            marginTop: 8,
          }}
        >
          {FEATURES.map((feature, i) => {
            const chipDelay = 50 + i * 10
            const chipSpring = spring({
              frame: Math.max(0, frame - chipDelay),
              fps,
              config: { damping: 20, stiffness: 200 },
              durationInFrames: 18,
            })
            const chipScale = interpolate(chipSpring, [0, 1], [0.7, 1])
            const chipOpacity = interpolate(chipSpring, [0, 1], [0, 1], {
              extrapolateRight: 'clamp',
            })

            return (
              <div
                key={feature}
                style={{
                  display: 'inline-flex',
                  padding: '8px 20px',
                  borderRadius: 50,
                  background: `${COLOR}12`,
                  border: `1px solid ${COLOR}30`,
                  transform: `scale(${chipScale})`,
                  opacity: chipOpacity,
                }}
              >
                <span
                  style={{
                    color: COLOR,
                    fontSize: 16,
                    fontWeight: 500,
                    fontFamily: FONT,
                    letterSpacing: 1,
                  }}
                >
                  {feature}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </AbsoluteFill>
  )
}
