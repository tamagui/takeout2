import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion'

const FONT = "'Inter', -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif"

// features to cycle through with colors
const FEATURES = [
  { text: 'Tamagui 2', color: '#ECD20A' },
  { text: 'One', color: '#F5CA05' },
  { text: 'Zero', color: '#4ECDC4' },
  { text: 'Uncloud', color: '#A855F7' },
  { text: 'SST', color: '#FF6B6B' },
  { text: 'AWS', color: '#FF9900' },
  { text: 'Better Auth', color: '#10B981' },
  { text: 'Bun', color: '#FBF0DF' },
  { text: 'Oxlint', color: '#6366F1' },
  { text: 'Drizzle', color: '#C5F74F' },
  { text: 'Expo', color: '#000020' },
  { text: 'TypeScript', color: '#3178C6' },
]

// frames per word - very fast for rapid effect
const FRAMES_PER_WORD = 8

type WordProps = {
  text: string
  color: string
  isActive: boolean
  progress: number
}

const AnimatedWord: React.FC<WordProps> = ({ text, color, isActive, progress }) => {
  // spring in/out
  const scale = interpolate(progress, [0, 0.3, 0.7, 1], [0.7, 1.05, 1.05, 0.7], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  const opacity = interpolate(progress, [0, 0.15, 0.85, 1], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  const y = interpolate(progress, [0, 0.2, 0.8, 1], [30, 0, 0, -30], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.quad),
  })

  const blur = interpolate(progress, [0, 0.2, 0.8, 1], [8, 0, 0, 8], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  // glow intensity
  const glow = interpolate(progress, [0.2, 0.5, 0.8], [0, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  if (!isActive) return null

  return (
    <div
      style={{
        position: 'absolute',
        fontSize: 140,
        fontFamily: FONT,
        fontWeight: 800,
        color: color,
        letterSpacing: -3,
        opacity,
        transform: `translateY(${y}px) scale(${scale})`,
        filter: `blur(${blur}px)`,
        textShadow: `
          0 0 ${40 * glow}px ${color}80,
          0 0 ${80 * glow}px ${color}40,
          0 0 ${120 * glow}px ${color}20
        `,
        whiteSpace: 'nowrap',
      }}
    >
      {text}
    </div>
  )
}

export const RapidTextIntroScene: React.FC = () => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  // intro fade
  const introOpacity = interpolate(frame, [0, 15], [0, 1], {
    extrapolateRight: 'clamp',
  })

  // calculate which word is active
  const cycleFrame = Math.max(0, frame - 20) // delay start
  const totalCycleFrames = FEATURES.length * FRAMES_PER_WORD
  const cycleProgress = cycleFrame / FRAMES_PER_WORD
  const currentIndex = Math.floor(cycleProgress) % FEATURES.length

  // progress within current word (0 to 1)
  const wordProgress = cycleProgress - Math.floor(cycleProgress)

  // top text spring
  const topSpring = spring({
    frame,
    fps,
    config: { damping: 200 },
    durationInFrames: 25,
  })
  const topY = interpolate(topSpring, [0, 1], [-30, 0])
  const topOpacity = topSpring

  // background pulse synced to word changes
  const pulseIntensity = interpolate(wordProgress, [0, 0.1, 0.5], [0.15, 0.08, 0.02], {
    extrapolateRight: 'clamp',
  })

  // current feature for bg color
  const currentFeature = FEATURES[currentIndex]

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#050505',
        justifyContent: 'center',
        alignItems: 'center',
        opacity: introOpacity,
      }}
    >
      {/* animated background glow */}
      <div
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          background: `radial-gradient(ellipse 60% 40% at 50% 50%,
            ${currentFeature?.color || '#fff'}${Math.round(pulseIntensity * 255)
              .toString(16)
              .padStart(2, '0')} 0%,
            transparent 70%)`,
          transition: 'background 0.1s',
        }}
      />

      {/* scan lines overlay */}
      <div
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          opacity: 0.03,
          backgroundImage: `repeating-linear-gradient(
            0deg,
            transparent,
            transparent 2px,
            rgba(255,255,255,0.1) 2px,
            rgba(255,255,255,0.1) 4px
          )`,
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 20,
        }}
      >
        {/* top label */}
        <div
          style={{
            fontSize: 28,
            fontFamily: FONT,
            fontWeight: 500,
            color: 'rgba(255,255,255,0.5)',
            letterSpacing: 8,
            textTransform: 'uppercase',
            opacity: topOpacity,
            transform: `translateY(${topY}px)`,
          }}
        >
          Built With
        </div>

        {/* cycling words container */}
        <div
          style={{
            position: 'relative',
            height: 180,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: 800,
          }}
        >
          {FEATURES.map((feature, i) => (
            <AnimatedWord
              key={feature.text}
              text={feature.text}
              color={feature.color}
              isActive={i === currentIndex && cycleFrame < totalCycleFrames}
              progress={wordProgress}
            />
          ))}
        </div>
      </div>
    </AbsoluteFill>
  )
}
