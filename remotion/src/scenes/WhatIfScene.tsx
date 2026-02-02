import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion'

const TITLE_FONT =
  "'Inter', -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif"
const GRID_SIZE = 64

export const WhatIfScene: React.FC = () => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  // grid drift
  const gridDrift = frame * 0.08

  // "What" entrance — smooth spring scale + slide up
  const whatDelay = 20
  const whatSpring = spring({
    frame: Math.max(0, frame - whatDelay),
    fps,
    config: { damping: 28, stiffness: 120 },
    durationInFrames: 45,
  })
  const whatScale = interpolate(whatSpring, [0, 1], [0.88, 1])
  const whatY = interpolate(whatSpring, [0, 1], [35, 0])
  const whatBlur = interpolate(whatSpring, [0, 1], [6, 0])

  // "if..." entrance — slightly delayed
  const ifDelay = 38
  const ifSpring = spring({
    frame: Math.max(0, frame - ifDelay),
    fps,
    config: { damping: 28, stiffness: 120 },
    durationInFrames: 45,
  })
  const ifScale = interpolate(ifSpring, [0, 1], [0.88, 1])
  const ifY = interpolate(ifSpring, [0, 1], [35, 0])
  const ifBlur = interpolate(ifSpring, [0, 1], [6, 0])

  // underline sweep from left to right
  const underlineDelay = 55
  const underlineProgress = interpolate(
    frame,
    [underlineDelay, underlineDelay + 30],
    [0, 1],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.out(Easing.quad),
    }
  )

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
          <filter id="grain-whatif">
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
          filter: 'url(#grain-whatif)',
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

      {/* "What if..." text */}
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: 20,
          zIndex: 10,
        }}
      >
        {/* "What" */}
        <span
          style={{
            fontSize: 86,
            fontFamily: TITLE_FONT,
            fontWeight: 300,
            color: '#ffffff',
            letterSpacing: -1,
            fontStyle: 'italic',
            opacity: whatSpring,
            transform: `translateY(${whatY}px) scale(${whatScale})`,
            filter: `blur(${whatBlur}px)`,
          }}
        >
          What
        </span>

        {/* "if..." */}
        <span
          style={{
            fontSize: 86,
            fontFamily: TITLE_FONT,
            fontWeight: 300,
            color: '#ffffff',
            letterSpacing: -1,
            fontStyle: 'italic',
            opacity: ifSpring,
            transform: `translateY(${ifY}px) scale(${ifScale})`,
            filter: `blur(${ifBlur}px)`,
          }}
        >
          if...
        </span>
      </div>

      {/* underline sweep */}
      <div
        style={{
          position: 'absolute',
          top: '54%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 200,
          height: 1,
          overflow: 'hidden',
          opacity: underlineProgress > 0 ? 0.3 : 0,
        }}
      >
        <div
          style={{
            width: '100%',
            height: '100%',
            background:
              'linear-gradient(90deg, transparent 0%, #ffffff 50%, transparent 100%)',
            transform: `scaleX(${underlineProgress})`,
            transformOrigin: 'left',
          }}
        />
      </div>
    </AbsoluteFill>
  )
}
