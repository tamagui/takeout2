import { loadFont } from '@remotion/google-fonts/InterTight'
import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion'

import { TakeoutBox3DCanvas } from './components/TakeoutBox3D'

const { fontFamily } = loadFont('normal', {
  weights: ['500', '700', '900'],
  subsets: ['latin'],
})

// all the features - rapid fire with accent colors
const FEATURES = [
  { text: 'One', color: '#F5CA05' },
  { text: 'Tamagui', color: '#ECD20A' },
  { text: 'Zero', color: '#4ECDC4' },
  { text: 'Uncloud', color: '#A855F7' },
  { text: 'SST', color: '#FF6B6B' },
  { text: 'AWS', color: '#FF9900' },
  { text: 'Better Auth', color: '#10B981' },
  { text: 'Bun', color: '#FBF0DF' },
  { text: 'Oxlint', color: '#6366F1' },
  { text: 'Drizzle', color: '#C5F74F' },
  { text: 'Expo', color: '#4630EB' },
  { text: 'TypeScript', color: '#3178C6' },
  { text: 'React Native', color: '#61DAFB' },
  { text: 'Vite', color: '#646CFF' },
  { text: 'PostgreSQL', color: '#336791' },
  { text: 'Reanimated', color: '#FF4154' },
  { text: 'Framer Motion', color: '#FF0055' },
  { text: 'Playwright', color: '#45BA4B' },
  { text: 'Vitest', color: '#6E9F18' },
  { text: 'PostHog', color: '#F9BD2B' },
  { text: 'Hono', color: '#FF5B11' },
  { text: 'Biome', color: '#60A5FA' },
]

const FPS = 60
const FRAMES_PER_WORD = 10
const INTRO_DELAY = 10
const CYCLE_FRAMES = FEATURES.length * FRAMES_PER_WORD
const OUTRO_START = INTRO_DELAY + CYCLE_FRAMES
const OUTRO_DURATION = Math.round(2.5 * FPS)

export const FEATURE_FLASH_DURATION = OUTRO_START + OUTRO_DURATION

export const FeatureFlash: React.FC = () => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  // phase detection
  const isCycling = frame >= INTRO_DELAY && frame < OUTRO_START
  const isOutro = frame >= OUTRO_START

  // cycling logic
  const cycleFrame = Math.max(0, frame - INTRO_DELAY)
  const wordIndex = Math.min(
    Math.floor(cycleFrame / FRAMES_PER_WORD),
    FEATURES.length - 1
  )
  const wordProgress = (cycleFrame % FRAMES_PER_WORD) / FRAMES_PER_WORD

  const currentFeature = FEATURES[wordIndex]

  // word animation - organic spring-like feel using bezier curves
  // entry: quick snap in with slight overshoot
  // exit: smooth fade out with upward drift
  const wordScale = interpolate(
    wordProgress,
    [0, 0.15, 0.25, 0.75, 1],
    [0.7, 1.06, 1, 1, 0.92],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.bezier(0.34, 1.56, 0.64, 1),
    }
  )

  // opacity with smooth bezier curve - faster in, gradual out
  const wordOpacity = interpolate(
    wordProgress,
    [0, 0.1, 0.7, 1],
    [0, 1, 1, 0],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.bezier(0.22, 1, 0.36, 1),
    }
  )

  // Y motion - spring up, settle, drift up on exit
  const wordY = interpolate(
    wordProgress,
    [0, 0.12, 0.22, 0.75, 1],
    [50, -8, 0, 0, -40],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.bezier(0.22, 1, 0.36, 1),
    }
  )

  // subtle rotation for organic feel
  const wordRotation = interpolate(
    wordProgress,
    [0, 0.15, 0.3, 0.85, 1],
    [-2, 1, 0, 0, 1.5],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }
  )

  // blur transitions - sharper in middle
  const wordBlur = interpolate(
    wordProgress,
    [0, 0.12, 0.8, 1],
    [6, 0, 0, 5],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }
  )

  // glow intensity - pulses with word
  const glowIntensity = interpolate(
    wordProgress,
    [0, 0.2, 0.5, 0.8, 1],
    [0.05, 0.5, 0.35, 0.3, 0.05],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }
  )

  // outro animations
  const outroFrame = Math.max(0, frame - OUTRO_START)

  // logo fades in with subtle rotation - no scale
  const logoSpring = spring({
    frame: outroFrame,
    fps,
    config: { damping: 14, stiffness: 100 },
    durationInFrames: 40,
  })
  const logoOpacity = interpolate(logoSpring, [0, 0.4], [0, 1], {
    extrapolateRight: 'clamp',
  })
  const logoRotation = interpolate(logoSpring, [0, 1], [-10, 0])

  // title and url just fade in - no movement
  const titleOpacity = interpolate(outroFrame, [5, 25], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.quad),
  })

  const urlOpacity = interpolate(outroFrame, [20, 40], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.quad),
  })

  // background glow during outro
  const bgGlow = isOutro
    ? interpolate(outroFrame, [0, 40], [0, 0.6], {
        extrapolateRight: 'clamp',
        easing: Easing.out(Easing.quad),
      })
    : 0

  // shimmer on title
  const shimmerX = isOutro
    ? interpolate(outroFrame, [20, 60], [-300, 500], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
        easing: Easing.inOut(Easing.quad),
      })
    : -300

  // subtle float for logo only after settle
  const floatStart = 60
  const floatProgress = Math.max(0, outroFrame - floatStart)
  const floatY = floatProgress > 0 ? Math.sin(floatProgress * 0.025) * 4 : 0
  const floatRotate = floatProgress > 0 ? Math.sin(floatProgress * 0.02) * 0.8 : 0

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#000',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      {/* colored background glow during cycling */}
      {isCycling && (
        <div
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            background: `radial-gradient(ellipse 60% 50% at 50% 50%,
              ${currentFeature.color}${Math.round(glowIntensity * 40).toString(16).padStart(2, '0')} 0%,
              transparent 60%)`,
          }}
        />
      )}

      {/* outro background glow */}
      {isOutro && (
        <div
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            background: `
              radial-gradient(ellipse 55% 45% at 50% 45%,
                rgba(236, 208, 10, ${bgGlow * 0.18}) 0%,
                transparent 55%),
              radial-gradient(ellipse 50% 40% at 35% 55%,
                rgba(78, 205, 196, ${bgGlow * 0.1}) 0%,
                transparent 45%),
              radial-gradient(ellipse 50% 40% at 65% 55%,
                rgba(168, 85, 247, ${bgGlow * 0.1}) 0%,
                transparent 45%)
            `,
          }}
        />
      )}

      {/* cycling words */}
      {isCycling && (
        <div
          style={{
            fontSize: 160,
            fontFamily,
            fontWeight: 700,
            color: '#fff',
            letterSpacing: -3,
            opacity: wordOpacity,
            transform: `translateY(${wordY}px) scale(${wordScale}) rotate(${wordRotation}deg)`,
            filter: `blur(${wordBlur}px)`,
            textShadow: `
              0 0 ${50 * glowIntensity}px ${currentFeature.color},
              0 0 ${100 * glowIntensity}px ${currentFeature.color}70,
              0 0 ${150 * glowIntensity}px ${currentFeature.color}40
            `,
          }}
        >
          {currentFeature.text}
        </div>
      )}

      {/* outro: logo + title + url */}
      {isOutro && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 24,
          }}
        >
          {/* 3D logo - fades in with rotation, floats after */}
          <div
            style={{
              opacity: logoOpacity,
              transform: `translateY(${floatY}px) rotate(${logoRotation + floatRotate}deg)`,
            }}
          >
            <TakeoutBox3DCanvas width={400} height={400} rotationSpeed={0.03} />
          </div>

          {/* title with shimmer - static position */}
          <div
            style={{
              position: 'relative',
              opacity: titleOpacity,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                fontSize: 88,
                fontFamily,
                fontWeight: 700,
                color: '#fff',
                letterSpacing: -2,
              }}
            >
              Takeout
            </div>
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: `linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)`,
                transform: `translateX(${shimmerX}px)`,
                width: 150,
              }}
            />
          </div>

          {/* url - static position */}
          <div
            style={{
              opacity: urlOpacity,
            }}
          >
            <div
              style={{
                fontSize: 36,
                fontFamily,
                fontWeight: 500,
                color: 'rgba(255,255,255,0.7)',
                letterSpacing: 1,
              }}
            >
              takeout.tamagui.dev
            </div>
          </div>
        </div>
      )}
    </AbsoluteFill>
  )
}
