import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion'

import { OneLogoWeb } from '../components/OneLogoWeb'
import { RailsLogoWeb } from '../components/RailsLogoWeb'
import { TamaguiLogoWeb } from '../components/TamaguiLogoWeb'
import { ZeroLogoWeb } from '../components/ZeroLogoWeb'

const FONT =
  "'Inter', -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif"

const COLOR_FRAMEWORK = '#F5CA05'
const COLOR_UI = '#ECD20A'
const COLOR_DATA = '#4ECDC4'

const FLOATING_LOGOS = [
  { Logo: RailsLogoWeb, baseX: -320, baseY: -160, speed: 0.015, phase: 0, amp: 30 },
  { Logo: OneLogoWeb, baseX: 300, baseY: -130, speed: 0.012, phase: 1.5, amp: 25 },
  { Logo: TamaguiLogoWeb, baseX: -280, baseY: 170, speed: 0.018, phase: 3, amp: 22 },
  { Logo: ZeroLogoWeb, baseX: 260, baseY: 150, speed: 0.014, phase: 4.5, amp: 28 },
]

const WORDS = [
  { text: 'framework.', color: COLOR_FRAMEWORK, delay: 50 },
  { text: 'ui.', color: COLOR_UI, delay: 64 },
  { text: 'data.', color: COLOR_DATA, delay: 78 },
]

export const OpeningScene: React.FC = () => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  // main title entrance
  const titleSpring = spring({
    frame: Math.max(0, frame - 12),
    fps,
    config: { damping: 20, stiffness: 200 },
    durationInFrames: 25,
  })
  const titleScale = interpolate(titleSpring, [0, 1], [1.3, 1])
  const titleOpacity = interpolate(titleSpring, [0, 1], [0, 1], {
    extrapolateRight: 'clamp',
  })

  // background pulse on text appearance
  const bgPulse = interpolate(frame, [12, 30, 60], [0, 0.4, 0.15], {
    extrapolateLeft: 'clamp',
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
      {/* background radial glow */}
      <div
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          background: `radial-gradient(ellipse 60% 50% at 50% 50%,
            rgba(168, 85, 247, ${bgPulse * 0.15}) 0%,
            rgba(78, 205, 196, ${bgPulse * 0.08}) 40%,
            transparent 70%)`,
        }}
      />

      {/* floating logos layer */}
      {FLOATING_LOGOS.map(({ Logo, baseX, baseY, speed, phase, amp }, i) => {
        const floatX = Math.cos(frame * speed + phase) * amp
        const floatY = Math.sin(frame * speed * 0.8 + phase) * amp * 0.7

        // logos fade in gently
        const logoOpacity = interpolate(frame, [0, 20], [0, 0.18], {
          extrapolateRight: 'clamp',
        })

        // brighten when corresponding word appears
        const wordDelay = WORDS[i - 1]?.delay
        let brightBoost = 0
        if (wordDelay !== undefined) {
          brightBoost = interpolate(
            frame,
            [wordDelay, wordDelay + 10, wordDelay + 30],
            [0, 0.3, 0.05],
            { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
          )
        }

        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              transform: `translate(${baseX + floatX}px, ${baseY + floatY}px) translate(-50%, -50%)`,
              opacity: logoOpacity + brightBoost,
              filter: brightBoost > 0.05 ? `drop-shadow(0 0 12px rgba(255,255,255,0.3))` : 'none',
            }}
          >
            <Logo size={80} />
          </div>
        )
      })}

      {/* text layer */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 24,
          zIndex: 1,
        }}
      >
        {/* "three problems." */}
        <div
          style={{
            fontSize: 72,
            fontFamily: FONT,
            fontWeight: 700,
            color: '#ffffff',
            letterSpacing: -2,
            transform: `scale(${titleScale})`,
            opacity: titleOpacity,
          }}
        >
          three problems.
        </div>

        {/* "framework. ui. data." */}
        <div style={{ display: 'flex', gap: 32, alignItems: 'baseline' }}>
          {WORDS.map(({ text, color, delay }) => {
            const wordSpring = spring({
              frame: Math.max(0, frame - delay),
              fps,
              config: { damping: 20, stiffness: 200 },
              durationInFrames: 20,
            })
            const wordScale = interpolate(wordSpring, [0, 1], [0.8, 1])
            const wordOpacity = interpolate(wordSpring, [0, 1], [0, 1], {
              extrapolateRight: 'clamp',
            })

            // glow pulse
            const glowIntensity = interpolate(
              frame,
              [delay, delay + 8, delay + 25],
              [0, 1, 0.3],
              { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
            )

            return (
              <span
                key={text}
                style={{
                  fontSize: 40,
                  fontFamily: FONT,
                  fontWeight: 600,
                  color,
                  letterSpacing: 1,
                  transform: `scale(${wordScale})`,
                  opacity: wordOpacity,
                  textShadow: `0 0 ${20 * glowIntensity}px ${color}80`,
                }}
              >
                {text}
              </span>
            )
          })}
        </div>
      </div>
    </AbsoluteFill>
  )
}
