import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion'

const TITLE_FONT =
  "'Inter', -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif"
const GRID_SIZE = 64

export const TakeoutJustWorkedScene: React.FC = () => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const gridDrift = frame * 0.08

  // text entrance
  const textSpring = spring({
    frame: Math.max(0, frame - 20),
    fps,
    config: { damping: 20, stiffness: 140 },
    durationInFrames: 35,
  })
  const textScale = interpolate(textSpring, [0, 1], [0.85, 1])
  const textY = interpolate(textSpring, [0, 1], [25, 0])
  const textBlur = interpolate(textSpring, [0, 1], [5, 0])

  return (
    <AbsoluteFill
      style={{
        background: 'linear-gradient(180deg, #050505 0%, #0e0e0e 40%, #0a0a0a 100%)',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      {/* grain */}
      <svg style={{ position: 'absolute', width: 0, height: 0 }} aria-hidden="true">
        <defs>
          <filter id="grain-justworked">
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
          filter: 'url(#grain-justworked)',
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

      {/* "takeout just worked?" text */}
      <div
        style={{
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
            opacity: textSpring,
            transform: `translateY(${textY}px) scale(${textScale})`,
            filter: `blur(${textBlur}px)`,
            textAlign: 'center',
          }}
        >
          takeout just worked?
        </div>
      </div>
    </AbsoluteFill>
  )
}
