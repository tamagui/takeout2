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
const FRAMES_PER_WORD = 6 // super fast - 0.1s per word
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

  // current word animation - smoother, no harsh transitions
  const wordScale = interpolate(wordProgress, [0, 0.2, 0.8, 1], [0.85, 1.02, 1.02, 0.85], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.quad),
  })

  const wordOpacity = interpolate(wordProgress, [0, 0.12, 0.88, 1], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  const wordY = interpolate(wordProgress, [0, 0.2, 0.8, 1], [35, 0, 0, -35], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.quad),
  })

  // subtle blur only at edges
  const wordBlur = interpolate(wordProgress, [0, 0.15, 0.85, 1], [4, 0, 0, 4], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  // glow intensity based on word progress
  const glowIntensity = interpolate(wordProgress, [0, 0.3, 0.7, 1], [0.1, 0.4, 0.4, 0.1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  // outro animations
  const outroFrame = Math.max(0, frame - OUTRO_START)

  const logoSpring = spring({
    frame: outroFrame,
    fps,
    config: { damping: 14, stiffness: 120 },
    durationInFrames: 35,
  })

  const logoScale = interpolate(logoSpring, [0, 1], [0.2, 1])
  const logoOpacity = interpolate(logoSpring, [0, 0.4], [0, 1], {
    extrapolateRight: 'clamp',
  })
  const logoRotate = interpolate(logoSpring, [0, 1], [-20, 0])

  const titleSpring = spring({
    frame: Math.max(0, outroFrame - 12),
    fps,
    config: { damping: 18, stiffness: 150 },
    durationInFrames: 30,
  })
  const titleY = interpolate(titleSpring, [0, 1], [40, 0])
  const titleOpacity = titleSpring

  const urlSpring = spring({
    frame: Math.max(0, outroFrame - 28),
    fps,
    config: { damping: 200 },
    durationInFrames: 25,
  })
  const urlY = interpolate(urlSpring, [0, 1], [25, 0])
  const urlOpacity = urlSpring

  // background glow during outro
  const bgGlow = isOutro
    ? interpolate(outroFrame, [0, 50], [0, 0.5], {
        extrapolateRight: 'clamp',
        easing: Easing.out(Easing.quad),
      })
    : 0

  // shimmer on title
  const shimmerX = isOutro
    ? interpolate(outroFrame, [30, 70], [-300, 500], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
        easing: Easing.inOut(Easing.quad),
      })
    : -300

  // subtle float after settle
  const floatY = outroFrame > 70 ? Math.sin((outroFrame - 70) * 0.025) * 4 : 0

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
            fontFamily: FONT,
            fontWeight: 900,
            color: '#fff',
            letterSpacing: -4,
            opacity: wordOpacity,
            transform: `translateY(${wordY}px) scale(${wordScale})`,
            filter: `blur(${wordBlur}px)`,
            textShadow: `
              0 0 ${40 * glowIntensity}px ${currentFeature.color},
              0 0 ${80 * glowIntensity}px ${currentFeature.color}60,
              0 0 ${120 * glowIntensity}px ${currentFeature.color}30
            `,
            textTransform: 'uppercase',
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
            gap: 28,
          }}
        >
          {/* logo - only the logo floats */}
          <div
            style={{
              opacity: logoOpacity,
              transform: `scale(${logoScale}) rotate(${logoRotate}deg) translateY(${floatY}px)`,
              filter: `drop-shadow(0 0 40px rgba(236, 208, 10, 0.5))`,
            }}
          >
            <Img
              src={staticFile('logo.png')}
              style={{
                width: 200,
                height: 200,
                objectFit: 'contain',
              }}
            />
          </div>

          {/* title with shimmer */}
          <div
            style={{
              position: 'relative',
              opacity: titleOpacity,
              transform: `translateY(${titleY}px)`,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                fontSize: 88,
                fontFamily: FONT,
                fontWeight: 800,
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

          {/* url */}
          <div
            style={{
              opacity: urlOpacity,
              transform: `translateY(${urlY}px)`,
            }}
          >
            <div
              style={{
                fontSize: 36,
                fontFamily: FONT,
                fontWeight: 500,
                color: 'rgba(255,255,255,0.7)',
                letterSpacing: 2,
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
