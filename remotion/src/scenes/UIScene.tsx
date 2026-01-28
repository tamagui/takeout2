import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion'

import { TamaguiLogoWeb } from '../components/TamaguiLogoWeb'

const FONT =
  "'Inter', -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif"
const COLOR = '#ECD20A'

const FEATURES = ['Optimizing Compiler', 'Motion Driver', '32% Smaller']

export const UIScene: React.FC = () => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  // logo entrance
  const logoSpring = spring({
    frame,
    fps,
    config: { damping: 20, stiffness: 200 },
    durationInFrames: 28,
  })
  const logoScale = interpolate(logoSpring, [0, 1], [0.2, 1])
  const logoOpacity = interpolate(logoSpring, [0, 1], [0, 1], {
    extrapolateRight: 'clamp',
  })
  const logoRotation = interpolate(logoSpring, [0, 1], [-15, 0])

  // title entrance
  const titleSpring = spring({
    frame: Math.max(0, frame - 16),
    fps,
    config: { damping: 20, stiffness: 200 },
    durationInFrames: 22,
  })
  const titleX = interpolate(titleSpring, [0, 1], [-60, 0])
  const titleOpacity = interpolate(titleSpring, [0, 1], [0, 1], {
    extrapolateRight: 'clamp',
  })

  // version badge
  const badgeSpring = spring({
    frame: Math.max(0, frame - 26),
    fps,
    config: { damping: 15, stiffness: 200 },
    durationInFrames: 16,
  })
  const badgeScale = interpolate(badgeSpring, [0, 1], [0, 1])

  // subtitle
  const subOpacity = interpolate(frame, [36, 50], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.quad),
  })
  const subY = interpolate(frame, [36, 50], [12, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.quad),
  })

  // background glow
  const bgGlow = interpolate(frame, [0, 40], [0, 0.5], {
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.quad),
  })

  // float
  const floatY = frame > 30 ? Math.sin((frame - 30) * 0.02) * 3 : 0

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
        {/* logo */}
        <div
          style={{
            transform: `scale(${logoScale}) rotate(${logoRotation}deg)`,
            opacity: logoOpacity,
            filter: `drop-shadow(0 0 20px ${COLOR}40)`,
          }}
        >
          <TamaguiLogoWeb size={190} />
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
              fontSize: 62,
              fontFamily: FONT,
              fontWeight: 800,
              color: '#ffffff',
              letterSpacing: -1,
            }}
          >
            TAMAGUI
          </span>
          <span
            style={{
              fontSize: 22,
              fontFamily: FONT,
              fontWeight: 700,
              color: COLOR,
              background: `${COLOR}20`,
              border: `1px solid ${COLOR}50`,
              borderRadius: 8,
              padding: '4px 14px',
              transform: `scale(${badgeScale})`,
            }}
          >
            v2
          </span>
        </div>

        {/* subtitle */}
        <div
          style={{
            fontSize: 26,
            fontFamily: FONT,
            fontWeight: 400,
            color: '#a0a0a0',
            letterSpacing: 2,
            textTransform: 'uppercase',
            opacity: subOpacity,
            transform: `translateY(${subY}px)`,
          }}
        >
          Cross-Platform Styling
        </div>

        {/* feature chips */}
        <div style={{ display: 'flex', gap: 14, marginTop: 10 }}>
          {FEATURES.map((feature, i) => {
            const chipDelay = 56 + i * 10
            const chipSpring = spring({
              frame: Math.max(0, frame - chipDelay),
              fps,
              config: { damping: 20, stiffness: 200 },
              durationInFrames: 20,
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
                  padding: '10px 22px',
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
                    fontSize: 17,
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
