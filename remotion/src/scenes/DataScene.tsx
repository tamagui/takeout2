import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion'

import { ZeroLogoWeb } from '../components/ZeroLogoWeb'

const FONT =
  "'Inter', -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif"
const COLOR = '#4ECDC4'

export const DataScene: React.FC = () => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  // logo entrance with rotation
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
  const logoRotation = interpolate(logoSpring, [0, 1], [180, 0])

  // title
  const titleSpring = spring({
    frame: Math.max(0, frame - 14),
    fps,
    config: { damping: 20, stiffness: 200 },
    durationInFrames: 20,
  })
  const titleScale = interpolate(titleSpring, [0, 1], [0.8, 1])
  const titleOpacity = interpolate(titleSpring, [0, 1], [0, 1], {
    extrapolateRight: 'clamp',
  })

  // subtitle
  const subOpacity = interpolate(frame, [28, 42], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.quad),
  })
  const subY = interpolate(frame, [28, 42], [12, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.quad),
  })

  // feature line
  const featOpacity = interpolate(frame, [50, 65], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  // background glow
  const bgGlow = interpolate(frame, [0, 35], [0, 0.6], {
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.quad),
  })

  // subtle sync pulse on logo
  const pulse =
    frame > 30 ? 1 + Math.sin((frame - 30) * 0.06) * 0.03 : 1

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
            ${COLOR}${Math.round(bgGlow * 15).toString(16).padStart(2, '0')} 0%,
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
        }}
      >
        {/* logo */}
        <div
          style={{
            transform: `scale(${logoScale * pulse}) rotate(${logoRotation}deg)`,
            opacity: logoOpacity,
            filter: `drop-shadow(0 0 25px ${COLOR}50)`,
          }}
        >
          <ZeroLogoWeb size={190} color={COLOR} />
        </div>

        {/* title */}
        <span
          style={{
            fontSize: 68,
            fontFamily: FONT,
            fontWeight: 800,
            color: '#ffffff',
            letterSpacing: 3,
            transform: `scale(${titleScale})`,
            opacity: titleOpacity,
          }}
        >
          ZERO
        </span>

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
          Real-Time Sync Engine
        </div>

        {/* feature line */}
        <div
          style={{
            fontSize: 17,
            fontFamily: FONT,
            fontWeight: 500,
            color: COLOR,
            letterSpacing: 3,
            textTransform: 'uppercase',
            opacity: featOpacity,
            marginTop: 6,
          }}
        >
          Relations · Permissions · Type-Safe
        </div>
      </div>
    </AbsoluteFill>
  )
}
