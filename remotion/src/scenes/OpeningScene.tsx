import { loadFont } from '@remotion/fonts'
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

import { OneLogoWeb } from '../components/OneLogoWeb'
import { TamaguiLogoWeb } from '../components/TamaguiLogoWeb'
import { ZeroLogoWeb } from '../components/ZeroLogoWeb'

// load montserrat for titles
const montserratLoaded = Promise.all([
  loadFont({
    family: 'Montserrat',
    url: staticFile('fonts/Montserrat-Light.ttf'),
    weight: '300',
  }),
  loadFont({
    family: 'Montserrat',
    url: staticFile('fonts/Montserrat-LightItalic.ttf'),
    weight: '300',
    style: 'italic',
  }),
  loadFont({
    family: 'Montserrat',
    url: staticFile('fonts/Montserrat-SemiBold.ttf'),
    weight: '600',
  }),
  loadFont({
    family: 'Montserrat',
    url: staticFile('fonts/Montserrat-Bold.ttf'),
    weight: '700',
  }),
])

const TITLE_FONT = "'Montserrat', sans-serif"
const BODY_FONT =
  "'Inter', -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif"

const COLOR_FRAMEWORK = '#F5CA05'
const COLOR_UI = '#ECD20A'
const COLOR_DATA = '#4ECDC4'

// floating logos on lissajous orbital paths
const FLOATING_LOGOS: Array<{
  id: string
  type: 'component' | 'image'
  Logo?: React.FC<{ size?: number; color?: string }>
  imgSrc?: string
  baseX: number
  baseY: number
  freqA: number
  freqB: number
  phase: number
  ampX: number
  ampY: number
  logoSize: number
  wordIndex: number
}> = [
  {
    id: 'one',
    type: 'component',
    Logo: OneLogoWeb,
    baseX: -320,
    baseY: -130,
    freqA: 3,
    freqB: 2,
    phase: Math.PI / 3,
    ampX: 35,
    ampY: 28,
    logoSize: 65,
    wordIndex: 0,
  },
  {
    id: 'tamagui',
    type: 'component',
    Logo: TamaguiLogoWeb,
    baseX: 310,
    baseY: -110,
    freqA: 2,
    freqB: 3,
    phase: Math.PI / 2,
    ampX: 30,
    ampY: 35,
    logoSize: 65,
    wordIndex: 1,
  },
  {
    id: 'zero',
    type: 'component',
    Logo: ZeroLogoWeb,
    baseX: -280,
    baseY: 140,
    freqA: 1,
    freqB: 3,
    phase: Math.PI,
    ampX: 38,
    ampY: 25,
    logoSize: 65,
    wordIndex: 2,
  },
  {
    id: 'react',
    type: 'image',
    imgSrc: 'react.svg',
    baseX: 300,
    baseY: 150,
    freqA: 1,
    freqB: 2,
    phase: 0,
    ampX: 40,
    ampY: 30,
    logoSize: 55,
    wordIndex: -1,
  },
  {
    id: 'vite',
    type: 'image',
    imgSrc: 'vite.svg',
    baseX: 0,
    baseY: -230,
    freqA: 2,
    freqB: 1,
    phase: Math.PI / 4,
    ampX: 32,
    ampY: 38,
    logoSize: 50,
    wordIndex: -1,
  },
  {
    id: 'claude',
    type: 'image',
    imgSrc: 'claude.svg',
    baseX: -10,
    baseY: 230,
    freqA: 3,
    freqB: 4,
    phase: Math.PI / 6,
    ampX: 28,
    ampY: 32,
    logoSize: 50,
    wordIndex: -1,
  },
]

const WORDS = [
  { text: 'framework.', color: COLOR_FRAMEWORK, delay: 80 },
  { text: 'ui.', color: COLOR_UI, delay: 105 },
  { text: 'data.', color: COLOR_DATA, delay: 130 },
]

const GRID_SIZE = 64

export const OpeningScene: React.FC = () => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  // "what if..." typewriter
  const whatIfText = 'what if...'
  const typeSpeed = 4
  const typeStart = 15
  const visibleChars = Math.min(
    whatIfText.length,
    Math.max(0, Math.floor((frame - typeStart) / typeSpeed))
  )
  const displayedWhatIf = whatIfText.slice(0, visibleChars)
  const whatIfDone = visibleChars >= whatIfText.length

  const whatIfOpacity = interpolate(frame, [typeStart, typeStart + 8], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  // "just worked." entrance
  const justWorkedDelay = 165
  const justWorkedSpring = spring({
    frame: Math.max(0, frame - justWorkedDelay),
    fps,
    config: { damping: 200 },
    durationInFrames: 30,
  })
  const justWorkedY = interpolate(justWorkedSpring, [0, 1], [20, 0])

  // background glow
  const bgGlow = interpolate(frame, [80, 200], [0, 0.5], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.quad),
  })

  // grid drift
  const gridDrift = frame * 0.08

  return (
    <AbsoluteFill
      style={{
        background: 'linear-gradient(180deg, #050505 0%, #0e0e0e 40%, #0a0a0a 100%)',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      {/* grain texture overlay */}
      <svg style={{ position: 'absolute', width: 0, height: 0 }} aria-hidden="true">
        <defs>
          <filter id="grain-filter">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.65"
              numOctaves="3"
              stitchTiles="stitch"
            />
            <feColorMatrix type="saturate" values="0" />
          </filter>
        </defs>
      </svg>
      <div
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          filter: 'url(#grain-filter)',
          opacity: 0.04,
          mixBlendMode: 'overlay',
          zIndex: 0,
        }}
      />

      {/* animated perspective grid background */}
      <div
        style={{
          position: 'absolute',
          width: '200%',
          height: '200%',
          left: '-50%',
          top: '-50%',
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)
          `,
          backgroundSize: `${GRID_SIZE}px ${GRID_SIZE}px`,
          backgroundPosition: `${gridDrift}px ${gridDrift * 0.6}px`,
          transform: 'perspective(800px) rotateX(50deg) scale(1.6)',
          transformOrigin: 'center center',
        }}
      />

      {/* grid vignette mask */}
      <div
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          background: `radial-gradient(ellipse 55% 55% at 50% 50%,
            transparent 0%,
            rgba(10,10,10,0.6) 50%,
            #0a0a0a 75%)`,
        }}
      />

      {/* radial glow */}
      <div
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          background: `radial-gradient(ellipse 50% 45% at 50% 50%,
            rgba(168, 85, 247, ${bgGlow * 0.1}) 0%,
            rgba(78, 205, 196, ${bgGlow * 0.06}) 40%,
            transparent 70%)`,
        }}
      />

      {/* floating logos — lissajous curves */}
      {FLOATING_LOGOS.map((logo, i) => {
        const t = frame * 0.008 + logo.phase
        const floatX = Math.sin(logo.freqA * t) * logo.ampX
        const floatY = Math.sin(logo.freqB * t) * logo.ampY
        const rotation = Math.sin(t * 0.5) * 6
        const scaleBreath = 1 + Math.sin(t * 0.3) * 0.06

        // staggered fade in
        const fadeIn = interpolate(frame, [10 + i * 6, 40 + i * 6], [0, 0.2], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        })

        // brighten when word appears
        let brightBoost = 0
        if (logo.wordIndex >= 0) {
          const wordDelay = WORDS[logo.wordIndex]!.delay
          brightBoost = interpolate(
            frame,
            [wordDelay, wordDelay + 12, wordDelay + 40],
            [0, 0.5, 0.12],
            { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
          )
        }

        if (i === 0 && whatIfDone) {
          brightBoost = Math.max(
            brightBoost,
            interpolate(frame, [55, 65, 80], [0, 0.2, 0.05], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            })
          )
        }

        return (
          <div
            key={logo.id}
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              transform: `translate(${logo.baseX + floatX}px, ${logo.baseY + floatY}px) translate(-50%, -50%) rotate(${rotation}deg) scale(${scaleBreath})`,
              opacity: fadeIn + brightBoost,
              filter:
                brightBoost > 0.05
                  ? 'drop-shadow(0 0 15px rgba(255,255,255,0.4)) grayscale(0.3)'
                  : 'grayscale(1) brightness(1.5)',
            }}
          >
            {logo.type === 'component' && logo.Logo ? (
              <logo.Logo size={logo.logoSize} />
            ) : (
              <Img
                src={staticFile(logo.imgSrc!)}
                style={{
                  width: logo.logoSize,
                  height: logo.logoSize,
                  objectFit: 'contain',
                }}
              />
            )}
          </div>
        )
      })}

      {/* text layer */}
      <div
        style={{
          position: 'absolute',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 28,
          zIndex: 20,
        }}
      >
        {/* "what if..." */}
        <div
          style={{
            fontSize: 76,
            fontFamily: TITLE_FONT,
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
                  fontFamily: TITLE_FONT,
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
            fontFamily: TITLE_FONT,
            fontWeight: 700,
            color: '#ffffff',
            letterSpacing: -1,
            opacity: justWorkedSpring,
            transform: `translateY(${justWorkedY}px)`,
          }}
        >
          just worked.
        </div>
      </div>
    </AbsoluteFill>
  )
}
