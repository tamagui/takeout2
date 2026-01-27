import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion'

import { OneLogoWeb } from '../components/OneLogoWeb'
import { TamaguiLogoWeb } from '../components/TamaguiLogoWeb'
import { ZeroLogoWeb } from '../components/ZeroLogoWeb'

type TechCardProps = {
  name: string
  description: string
  Logo: React.FC<{ size?: number }>
  index: number
  totalCards: number
  cardColor: string
  accentColor: string
}

const TechCard: React.FC<TechCardProps> = ({
  name,
  description,
  Logo,
  index,
  totalCards,
  cardColor,
  accentColor,
}) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  // stagger with smooth spring (no bounce)
  const delay = Math.round(0.3 * fps) + index * Math.round(0.2 * fps)

  const entrance = spring({
    frame,
    fps,
    config: { damping: 200 },
    delay,
  })

  // slide from bottom
  const slideY = interpolate(entrance, [0, 1], [100, 0])
  const opacity = interpolate(entrance, [0, 0.3], [0, 1], {
    extrapolateRight: 'clamp',
  })
  const scale = interpolate(entrance, [0, 1], [0.85, 1])

  // gentle rotation on entry
  const rotateZ = interpolate(entrance, [0, 1], [(index - 1) * 4, 0])

  // gentle float after settled (very subtle, no rotation)
  const settleFrame = delay + Math.round(1 * fps)
  const settled = frame > settleFrame
  const floatY = settled ? Math.sin((frame - settleFrame) * 0.02 + index * 1.5) * 2 : 0

  // steady glow
  const glowPulse = interpolate(entrance, [0.5, 1], [0, 0.5], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  // logo fades in with card (no spin)
  const logoScale = interpolate(entrance, [0, 1], [0.7, 1])

  return (
    <div
      style={{
        opacity,
        transform: `translateY(${slideY + floatY}px) scale(${scale}) rotate(${rotateZ}deg)`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 16,
        padding: '36px 44px',
        borderRadius: 20,
        background: `linear-gradient(145deg, ${cardColor}15 0%, ${cardColor}05 100%)`,
        border: `1px solid ${cardColor}25`,
        boxShadow: `
          0 0 ${35 * glowPulse}px ${cardColor}18,
          0 8px 32px rgba(0,0,0,0.4),
          inset 0 1px 0 ${cardColor}15
        `,
        minWidth: 220,
      }}
    >
      <div
        style={{
          transform: `scale(${logoScale})`,
          filter: `drop-shadow(0 0 14px ${accentColor}50)`,
        }}
      >
        <Logo size={72} />
      </div>
      <div
        style={{
          fontSize: 26,
          fontWeight: 700,
          color: '#ffffff',
          fontFamily: 'Inter, system-ui, sans-serif',
          letterSpacing: 1,
        }}
      >
        {name}
      </div>
      <div
        style={{
          fontSize: 14,
          color: 'rgba(255,255,255,0.55)',
          fontFamily: 'Inter, system-ui, sans-serif',
          fontWeight: 400,
          letterSpacing: 3,
          textTransform: 'uppercase',
        }}
      >
        {description}
      </div>
    </div>
  )
}

const techStack = [
  {
    name: 'Tamagui',
    description: 'Design System',
    Logo: TamaguiLogoWeb,
    cardColor: '#ECD20A',
    accentColor: '#ECD20A',
  },
  {
    name: 'One',
    description: 'Universal Framework',
    Logo: OneLogoWeb,
    cardColor: '#F5CA05',
    accentColor: '#F5CA05',
  },
  {
    name: 'Zero',
    description: 'Sync Engine',
    Logo: ZeroLogoWeb,
    cardColor: '#4ECDC4',
    accentColor: '#4ECDC4',
  },
]

export const TechStackScene: React.FC = () => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  // title entrance
  const titleSpring = spring({
    frame,
    fps,
    config: { damping: 200 },
  })

  const titleOpacity = titleSpring
  const titleY = interpolate(titleSpring, [0, 1], [-20, 0])

  // subtle line under title
  const lineWidth = interpolate(frame, [0.3 * fps, 1 * fps], [0, 120], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.quad),
  })

  // background grid fade in
  const gridOpacity = interpolate(frame, [0, 1 * fps], [0, 0.03], {
    extrapolateRight: 'clamp',
  })

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#0a0a0a',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      {/* background grid pattern */}
      <div
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          opacity: gridOpacity,
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 50,
        }}
      >
        {/* title */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <div
            style={{
              opacity: titleOpacity,
              transform: `translateY(${titleY}px)`,
              fontSize: 22,
              fontWeight: 500,
              color: 'rgba(255,255,255,0.45)',
              fontFamily: 'Inter, system-ui, sans-serif',
              letterSpacing: 6,
              textTransform: 'uppercase',
            }}
          >
            Powered By
          </div>
          <div
            style={{
              width: lineWidth,
              height: 1,
              background:
                'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
            }}
          />
        </div>

        {/* cards */}
        <div
          style={{
            display: 'flex',
            gap: 36,
            alignItems: 'center',
          }}
        >
          {techStack.map((tech, i) => (
            <TechCard key={tech.name} {...tech} index={i} totalCards={techStack.length} />
          ))}
        </div>
      </div>
    </AbsoluteFill>
  )
}
