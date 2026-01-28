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

const TITLE_FONT =
  "'Inter', -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif"
const GRID_SIZE = 64

const COLOR_FRAMEWORK = '#F5CA05'
const COLOR_UI = '#ECD20A'
const COLOR_DATA = '#4ECDC4'

const WORDS = [
  { text: 'framework.', color: COLOR_FRAMEWORK, delay: 80 },
  { text: 'ui.', color: COLOR_UI, delay: 100 },
  { text: 'data.', color: COLOR_DATA, delay: 120 },
]

// orbital logo definitions
const LOGOS: Array<{
  id: string
  type: 'component' | 'image'
  Logo?: React.FC<{ size?: number; color?: string }>
  imgSrc?: string
  logoSize: number
  orbitRadius: number
  orbitAngleOffset: number
  lightUpFrame: number
}> = [
  {
    id: 'one',
    type: 'component',
    Logo: OneLogoWeb,
    logoSize: 60,
    orbitRadius: 400,
    orbitAngleOffset: 0,
    lightUpFrame: 30,
  },
  {
    id: 'tamagui',
    type: 'component',
    Logo: TamaguiLogoWeb,
    logoSize: 60,
    orbitRadius: 400,
    orbitAngleOffset: (Math.PI * 2) / 6,
    lightUpFrame: 50,
  },
  {
    id: 'zero',
    type: 'component',
    Logo: ZeroLogoWeb,
    logoSize: 60,
    orbitRadius: 400,
    orbitAngleOffset: (2 * Math.PI * 2) / 6,
    lightUpFrame: 70,
  },
  {
    id: 'react',
    type: 'image',
    imgSrc: 'react.svg',
    logoSize: 50,
    orbitRadius: 400,
    orbitAngleOffset: (3 * Math.PI * 2) / 6,
    lightUpFrame: 90,
  },
  {
    id: 'vite',
    type: 'image',
    imgSrc: 'vite.svg',
    logoSize: 48,
    orbitRadius: 400,
    orbitAngleOffset: (4 * Math.PI * 2) / 6,
    lightUpFrame: 110,
  },
  {
    id: 'claude',
    type: 'image',
    imgSrc: 'claude.svg',
    logoSize: 48,
    orbitRadius: 400,
    orbitAngleOffset: (5 * Math.PI * 2) / 6,
    lightUpFrame: 130,
  },
]

// convergence timing
const CONVERGE_START = 150
const CONVERGE_END = 200
const JUST_WORKED_DELAY = 180

export const LogoOrbitScene: React.FC = () => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  // orbital rotation speed
  const orbitAngle = frame * 0.006

  // grid drift
  const gridDrift = frame * 0.08

  // convergence factor — logos drift toward center
  const convergeFactor = interpolate(
    frame,
    [CONVERGE_START, CONVERGE_END],
    [1, 0.08],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.inOut(Easing.quad),
    }
  )

  // logos shrink as they converge
  const convergeScale = interpolate(
    frame,
    [CONVERGE_START, CONVERGE_END],
    [1, 0.5],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.inOut(Easing.quad),
    }
  )

  // logos fade after convergence
  const logosFade = interpolate(
    frame,
    [CONVERGE_END - 10, CONVERGE_END + 10],
    [1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  )

  // "just worked." text
  const justWorkedSpring = spring({
    frame: Math.max(0, frame - JUST_WORKED_DELAY),
    fps,
    config: { damping: 20, stiffness: 140 },
    durationInFrames: 35,
  })
  const justWorkedScale = interpolate(justWorkedSpring, [0, 1], [0.85, 1])
  const justWorkedY = interpolate(justWorkedSpring, [0, 1], [25, 0])
  const justWorkedBlur = interpolate(justWorkedSpring, [0, 1], [5, 0])

  // "framework. ui. data." fade out before "just worked."
  const wordsFade = interpolate(
    frame,
    [CONVERGE_START, CONVERGE_START + 25],
    [1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  )

  return (
    <AbsoluteFill
      style={{
        background:
          'linear-gradient(180deg, #050505 0%, #0e0e0e 40%, #0a0a0a 100%)',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      {/* grain */}
      <svg
        style={{ position: 'absolute', width: 0, height: 0 }}
        aria-hidden="true"
      >
        <defs>
          <filter id="grain-orbit">
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
          filter: 'url(#grain-orbit)',
          opacity: 0.04,
          mixBlendMode: 'overlay',
        }}
      />

      {/* perspective grid */}
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

      {/* vignette */}
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

      {/* orbiting logos */}
      {LOGOS.map((logo, i) => {
        // entrance fade
        const entranceStart = 5 + i * 5
        const entrance = spring({
          frame: Math.max(0, frame - entranceStart),
          fps,
          config: { damping: 22, stiffness: 160 },
          durationInFrames: 30,
        })

        // orbital position
        const angle = orbitAngle + logo.orbitAngleOffset
        const radius = logo.orbitRadius * convergeFactor
        const x = Math.cos(angle) * radius
        const y = Math.sin(angle) * radius * 0.45 // elliptical orbit

        // light-up: goes from dim ghost to bright
        const lightUp = interpolate(
          frame,
          [logo.lightUpFrame, logo.lightUpFrame + 15, logo.lightUpFrame + 40],
          [0, 1, 0.6],
          { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
        )

        // base opacity
        const dimOpacity = 0.15
        const litOpacity = 0.8
        const currentOpacity =
          interpolate(lightUp, [0, 0.6], [dimOpacity, litOpacity]) *
          entrance *
          logosFade

        // filter: dim = grayscale+bright, lit = colorful with glow
        const isLit = lightUp > 0.1
        const filter = isLit
          ? `drop-shadow(0 0 ${12 * lightUp}px rgba(255,255,255,${0.3 * lightUp})) grayscale(${1 - lightUp})`
          : 'grayscale(1) brightness(1.5)'

        return (
          <div
            key={logo.id}
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              transform: `translate(${x}px, ${y}px) translate(-50%, -50%) scale(${convergeScale})`,
              opacity: currentOpacity,
              filter,
              zIndex: Math.round(y) + 500,
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

      {/* "framework. ui. data." text */}
      <div
        style={{
          position: 'absolute',
          display: 'flex',
          gap: 36,
          alignItems: 'baseline',
          zIndex: 20,
          opacity: wordsFade,
        }}
      >
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

      {/* "just worked." text */}
      {frame >= JUST_WORKED_DELAY - 5 && (
        <div
          style={{
            position: 'absolute',
            zIndex: 30,
          }}
        >
          <div
            style={{
              fontSize: 64,
              fontFamily: TITLE_FONT,
              fontWeight: 700,
              color: '#ffffff',
              letterSpacing: -1.5,
              opacity: justWorkedSpring,
              transform: `translateY(${justWorkedY}px) scale(${justWorkedScale})`,
              filter: `blur(${justWorkedBlur}px)`,
              textAlign: 'center',
            }}
          >
            just worked.
          </div>
        </div>
      )}
    </AbsoluteFill>
  )
}
