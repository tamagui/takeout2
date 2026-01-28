import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion'

import { OneLogoWeb } from '../components/OneLogoWeb'
import { TakeoutGhostWeb } from '../components/TakeoutGhostWeb'
import { TamaguiLogoWeb } from '../components/TamaguiLogoWeb'
import { ZeroLogoWeb } from '../components/ZeroLogoWeb'

const FONT =
  "'Inter', -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif"

const COLOR_FRAMEWORK = '#F5CA05'
const COLOR_UI = '#ECD20A'
const COLOR_DATA = '#4ECDC4'

// lissajous orbital paths - each logo gets unique frequency ratios
const FLOATING_LOGOS = [
  {
    Logo: TakeoutGhostWeb,
    baseX: -300,
    baseY: -140,
    freqA: 1,
    freqB: 2,
    phase: 0,
    ampX: 40,
    ampY: 30,
    logoSize: 85,
  },
  {
    Logo: OneLogoWeb,
    baseX: 320,
    baseY: -120,
    freqA: 3,
    freqB: 2,
    phase: Math.PI / 3,
    ampX: 35,
    ampY: 28,
    logoSize: 75,
  },
  {
    Logo: TamaguiLogoWeb,
    baseX: -260,
    baseY: 160,
    freqA: 2,
    freqB: 3,
    phase: Math.PI / 2,
    ampX: 30,
    ampY: 35,
    logoSize: 75,
  },
  {
    Logo: ZeroLogoWeb,
    baseX: 280,
    baseY: 150,
    freqA: 1,
    freqB: 3,
    phase: Math.PI,
    ampX: 38,
    ampY: 25,
    logoSize: 75,
  },
]

const WORDS = [
  { text: 'framework.', color: COLOR_FRAMEWORK, delay: 90 },
  { text: 'ui.', color: COLOR_UI, delay: 115 },
  { text: 'data.', color: COLOR_DATA, delay: 140 },
]

export const OpeningScene: React.FC = () => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  // "what if..." typewriter
  const whatIfText = 'what if...'
  const typeSpeed = 4 // frames per char
  const typeStart = 15
  const visibleChars = Math.min(
    whatIfText.length,
    Math.max(0, Math.floor((frame - typeStart) / typeSpeed))
  )
  const displayedWhatIf = whatIfText.slice(0, visibleChars)
  const whatIfDone = visibleChars >= whatIfText.length

  // "what if..." opacity
  const whatIfOpacity = interpolate(frame, [typeStart, typeStart + 8], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  // "just worked." entrance after the 3 words
  const justWorkedDelay = 170
  const justWorkedSpring = spring({
    frame: Math.max(0, frame - justWorkedDelay),
    fps,
    config: { damping: 200 },
    durationInFrames: 30,
  })
  const justWorkedY = interpolate(justWorkedSpring, [0, 1], [20, 0])
  const justWorkedOpacity = interpolate(justWorkedSpring, [0, 1], [0, 1], {
    extrapolateRight: 'clamp',
  })

  // background glow builds as words appear
  const bgGlow = interpolate(frame, [90, 180], [0, 0.4], {
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
            rgba(168, 85, 247, ${bgGlow * 0.12}) 0%,
            rgba(78, 205, 196, ${bgGlow * 0.08}) 40%,
            transparent 70%)`,
        }}
      />

      {/* floating logos layer - lissajous curves */}
      {FLOATING_LOGOS.map(
        ({ Logo, baseX, baseY, freqA, freqB, phase, ampX, ampY, logoSize }, i) => {
          const t = frame * 0.008 + phase

          // lissajous orbital path
          const floatX = Math.sin(freqA * t) * ampX
          const floatY = Math.sin(freqB * t) * ampY

          // subtle rotation following path
          const rotation = Math.sin(t * 0.5) * 6

          // scale breathing
          const scaleBreath = 1 + Math.sin(t * 0.3) * 0.06

          // fade in gently
          const logoFadeIn = interpolate(frame, [20 + i * 8, 50 + i * 8], [0, 0.2], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          })

          // brighten when corresponding word appears (logos 1-3 match words 0-2)
          const wordDelay = WORDS[i - 1]?.delay
          let brightBoost = 0
          if (wordDelay !== undefined) {
            brightBoost = interpolate(
              frame,
              [wordDelay, wordDelay + 12, wordDelay + 40],
              [0, 0.35, 0.08],
              { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
            )
          }

          // first logo (takeout ghost) brightens with "what if..."
          if (i === 0 && whatIfDone) {
            brightBoost = Math.max(
              brightBoost,
              interpolate(frame, [55, 65, 85], [0, 0.25, 0.08], {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
              })
            )
          }

          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                transform: `translate(${baseX + floatX}px, ${baseY + floatY}px) translate(-50%, -50%) rotate(${rotation}deg) scale(${scaleBreath})`,
                opacity: logoFadeIn + brightBoost,
                filter:
                  brightBoost > 0.05
                    ? `drop-shadow(0 0 15px rgba(255,255,255,0.4)) grayscale(0.3)`
                    : 'grayscale(1) brightness(1.5)',
              }}
            >
              <Logo size={logoSize} />
            </div>
          )
        }
      )}

      {/* text layer */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 28,
          zIndex: 1,
        }}
      >
        {/* "what if..." */}
        <div
          style={{
            fontSize: 76,
            fontFamily: FONT,
            fontWeight: 300,
            color: '#ffffff',
            letterSpacing: -1,
            opacity: whatIfOpacity,
            fontStyle: 'italic',
          }}
        >
          {displayedWhatIf}
        </div>

        {/* "framework. ui. data." */}
        <div style={{ display: 'flex', gap: 36, alignItems: 'baseline' }}>
          {WORDS.map(({ text, color, delay }) => {
            const wordSpring = spring({
              frame: Math.max(0, frame - delay),
              fps,
              config: { damping: 20, stiffness: 200 },
              durationInFrames: 22,
            })
            const wordScale = interpolate(wordSpring, [0, 1], [0.8, 1])
            const wordOpacity = interpolate(wordSpring, [0, 1], [0, 1], {
              extrapolateRight: 'clamp',
            })

            const glowIntensity = interpolate(
              frame,
              [delay, delay + 10, delay + 30],
              [0, 1, 0.3],
              { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
            )

            return (
              <span
                key={text}
                style={{
                  fontSize: 42,
                  fontFamily: FONT,
                  fontWeight: 600,
                  color,
                  letterSpacing: 1,
                  transform: `scale(${wordScale})`,
                  opacity: wordOpacity,
                  textShadow: `0 0 ${22 * glowIntensity}px ${color}80`,
                }}
              >
                {text}
              </span>
            )
          })}
        </div>

        {/* "just worked." */}
        <div
          style={{
            fontSize: 58,
            fontFamily: FONT,
            fontWeight: 700,
            color: '#ffffff',
            letterSpacing: -1,
            opacity: justWorkedOpacity,
            transform: `translateY(${justWorkedY}px)`,
          }}
        >
          just worked.
        </div>
      </div>
    </AbsoluteFill>
  )
}
