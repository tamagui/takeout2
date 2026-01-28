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
import { TakeoutLogoWeb } from '../components/TakeoutLogoWeb'
import { TamaguiLogoWeb } from '../components/TamaguiLogoWeb'
import { ZeroLogoWeb } from '../components/ZeroLogoWeb'

const FONT =
  "'Inter', -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif"

const LOGOS = [
  { Logo: OneLogoWeb, startX: -220, color: '#F5CA05' },
  { Logo: TamaguiLogoWeb, startX: 0, color: '#ECD20A' },
  { Logo: ZeroLogoWeb, startX: 220, color: '#4ECDC4' },
]

export const IntoTheBoxScene: React.FC<{ tagline: string }> = ({ tagline }) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  // phase 1: logos enter in row (0-35)
  const rowEntrance = spring({
    frame,
    fps,
    config: { damping: 20, stiffness: 200 },
    durationInFrames: 30,
  })

  // phase 2: logos converge to center (45-85)
  const convergeProgress = interpolate(frame, [45, 85], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.quad),
  })

  // phase 3: box svg appears (70-95)
  const boxOpacity = interpolate(frame, [70, 95], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.quad),
  })
  const boxScale = spring({
    frame: Math.max(0, frame - 70),
    fps,
    config: { damping: 200 },
    durationInFrames: 35,
  })

  // phase 4: cross-fade svg box to logo.png (95-120)
  const svgFade = interpolate(frame, [95, 120], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
  const pngFade = interpolate(frame, [95, 120], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  // phase 5: logo.png settles
  const logoSettle = spring({
    frame: Math.max(0, frame - 105),
    fps,
    config: { damping: 200 },
    durationInFrames: 30,
  })
  const logoFinalScale = interpolate(logoSettle, [0, 1], [0.85, 1])

  // url text entrance
  const urlOpacity = interpolate(frame, [125, 145], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
  const urlY = interpolate(frame, [125, 145], [15, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.quad),
  })

  // tagline typewriter
  const typewriterStart = 140
  const charsPerFrame = 0.45
  const visibleChars = Math.min(
    tagline.length,
    Math.max(0, Math.floor((frame - typewriterStart) * charsPerFrame))
  )
  const displayedTagline = tagline.slice(0, visibleChars)
  const cursorVisible = frame > typewriterStart && frame % 16 < 10

  // background glow
  const bgGlow = interpolate(frame, [70, 130], [0, 0.5], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.quad),
  })

  // float after settle
  const floatY = frame > 130 ? Math.sin((frame - 130) * 0.018) * 2 : 0

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
            rgba(78, 205, 196, ${bgGlow * 0.12}) 0%,
            rgba(168, 85, 247, ${bgGlow * 0.06}) 40%,
            transparent 70%)`,
        }}
      />

      {/* content */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 18,
          transform: `translateY(${floatY}px)`,
        }}
      >
        {/* logo area */}
        <div
          style={{
            position: 'relative',
            width: 340,
            height: 220,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          {/* three tech logos converging */}
          {LOGOS.map(({ Logo, startX, color }, i) => {
            const currentX = interpolate(convergeProgress, [0, 1], [startX, 0])
            const currentScale = interpolate(convergeProgress, [0, 1], [1, 0.15])
            const currentOpacity = interpolate(
              convergeProgress,
              [0, 0.8, 1],
              [1, 0.6, 0]
            )

            const entryScale = interpolate(rowEntrance, [0, 1], [0.5, 1])
            const entryOpacity = interpolate(rowEntrance, [0, 1], [0, 1], {
              extrapolateRight: 'clamp',
            })

            return (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  transform: `translateX(${currentX}px) scale(${entryScale * currentScale})`,
                  opacity: entryOpacity * currentOpacity,
                  filter: `drop-shadow(0 0 10px ${color}60)`,
                }}
              >
                <Logo size={75} />
              </div>
            )
          })}

          {/* takeout box svg */}
          {boxOpacity > 0 && (
            <div
              style={{
                position: 'absolute',
                opacity: boxOpacity * svgFade,
                transform: `scale(${interpolate(boxScale, [0, 1], [0.6, 1])})`,
              }}
            >
              <TakeoutLogoWeb size={180} />
            </div>
          )}

          {/* logo.png */}
          {pngFade > 0 && (
            <div
              style={{
                position: 'absolute',
                opacity: pngFade,
                transform: `scale(${logoFinalScale})`,
              }}
            >
              <Img
                src={staticFile('logo.png')}
                style={{
                  width: 180,
                  height: 180,
                  objectFit: 'contain',
                }}
              />
            </div>
          )}
        </div>

        {/* url */}
        <div
          style={{
            fontSize: 24,
            fontFamily: FONT,
            fontWeight: 500,
            color: '#a0a0a0',
            letterSpacing: 2,
            opacity: urlOpacity,
            transform: `translateY(${urlY}px)`,
          }}
        >
          takeout.tamagui.dev
        </div>

        {/* tagline typewriter */}
        <div
          style={{
            fontSize: 30,
            fontFamily: FONT,
            fontWeight: 600,
            color: '#ffffff',
            letterSpacing: 1,
            minHeight: 40,
          }}
        >
          {displayedTagline}
          {cursorVisible && (
            <span style={{ color: '#4ECDC4', marginLeft: 2 }}>|</span>
          )}
        </div>
      </div>
    </AbsoluteFill>
  )
}
