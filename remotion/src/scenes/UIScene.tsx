import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion'

import { TamaguiLogoWeb } from '../components/TamaguiLogoWeb'

const FONT = "'Inter', -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif"
const COLOR = '#ECD20A'

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

  // version text
  const versionOpacity = interpolate(frame, [36, 50], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.quad),
  })
  const versionY = interpolate(frame, [36, 50], [10, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.quad),
  })

  // background glow
  const bgGlow = interpolate(frame, [0, 40], [0, 0.5], {
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
          gap: 20,
          transform: 'translateY(0px)',
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

        {/* title */}
        <span
          style={{
            fontSize: 62,
            fontFamily: FONT,
            fontWeight: 800,
            color: '#ffffff',
            letterSpacing: -1,
            transform: `translateX(${titleX}px)`,
            opacity: titleOpacity,
          }}
        >
          Tamagui
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
          Version 2
        </div>
      </div>
    </AbsoluteFill>
  )
}
