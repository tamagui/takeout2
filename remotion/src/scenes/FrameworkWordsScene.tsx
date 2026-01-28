import {
  AbsoluteFill,
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

const COLOR_FRAMEWORK = '#F5CA05'
const COLOR_UI = '#ECD20A'
const COLOR_DATA = '#4ECDC4'

const WORDS = [
  { text: 'framework.', color: COLOR_FRAMEWORK, delay: 15 },
  { text: 'ui.', color: COLOR_UI, delay: 30 },
  { text: 'data.', color: COLOR_DATA, delay: 45 },
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

export const FrameworkWordsScene: React.FC = () => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  // orbital rotation speed
  const orbitAngle = frame * 0.006

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#050505',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
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
        const radius = logo.orbitRadius
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
          interpolate(lightUp, [0, 0.6], [dimOpacity, litOpacity]) * entrance

        // filter: dim = grayscale, lit = colorful
        const isLit = lightUp > 0.1
        const filter = isLit
          ? `grayscale(${1 - lightUp})`
          : 'grayscale(1) brightness(1.5)'

        return (
          <div
            key={logo.id}
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              transform: `translate(${x}px, ${y}px) translate(-50%, -50%)`,
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
          display: 'flex',
          gap: 36,
          alignItems: 'baseline',
          zIndex: 20,
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
              }}
            >
              {text}
            </span>
          )
        })}
      </div>
    </AbsoluteFill>
  )
}
