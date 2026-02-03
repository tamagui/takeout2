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

const FONT = "'Inter', -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif"

export const TakeoutRevealScene: React.FC = () => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  // logo entrance with bounce
  const logoSpring = spring({
    frame,
    fps,
    config: { damping: 12, stiffness: 100 },
    durationInFrames: 40,
  })

  const logoScale = interpolate(logoSpring, [0, 1], [0.3, 1])
  const logoOpacity = interpolate(logoSpring, [0, 0.3], [0, 1], {
    extrapolateRight: 'clamp',
  })
  const logoRotation = interpolate(logoSpring, [0, 1], [-15, 0])

  // title entrance
  const titleSpring = spring({
    frame: Math.max(0, frame - 15),
    fps,
    config: { damping: 20, stiffness: 180 },
    durationInFrames: 30,
  })
  const titleScale = interpolate(titleSpring, [0, 1], [0.8, 1])
  const titleOpacity = titleSpring
  const titleY = interpolate(titleSpring, [0, 1], [30, 0])

  // url entrance
  const urlSpring = spring({
    frame: Math.max(0, frame - 35),
    fps,
    config: { damping: 200 },
    durationInFrames: 25,
  })
  const urlOpacity = urlSpring
  const urlY = interpolate(urlSpring, [0, 1], [20, 0])

  // background glow builds up
  const bgGlow = interpolate(frame, [0, 60], [0, 0.6], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.quad),
  })

  // particles/sparkle effect - subtle dots
  const particleOpacity = interpolate(frame, [30, 60], [0, 0.4], {
    extrapolateRight: 'clamp',
  })

  // subtle float after animations settle
  const settleFrame = 80
  const floatY = frame > settleFrame ? Math.sin((frame - settleFrame) * 0.02) * 3 : 0

  // shimmer across title
  const shimmerX = interpolate(frame, [40, 90], [-200, 600], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.quad),
  })

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#050505',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      {/* multi-color gradient background */}
      <div
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          background: `
            radial-gradient(ellipse 50% 40% at 50% 40%,
              rgba(236, 208, 10, ${bgGlow * 0.15}) 0%,
              transparent 60%),
            radial-gradient(ellipse 60% 50% at 30% 60%,
              rgba(78, 205, 196, ${bgGlow * 0.08}) 0%,
              transparent 50%),
            radial-gradient(ellipse 60% 50% at 70% 60%,
              rgba(168, 85, 247, ${bgGlow * 0.08}) 0%,
              transparent 50%)
          `,
        }}
      />

      {/* particle dots */}
      <div
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          opacity: particleOpacity,
        }}
      >
        {Array.from({ length: 20 }).map((_, i) => {
          const x = 10 + (i * 37) % 80
          const y = 15 + (i * 53) % 70
          const size = 2 + (i % 3)
          const delay = i * 0.1
          const twinkle = Math.sin((frame - delay * fps) * 0.08 + i) * 0.5 + 0.5

          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: `${x}%`,
                top: `${y}%`,
                width: size,
                height: size,
                borderRadius: '50%',
                backgroundColor: 'rgba(255,255,255,0.6)',
                opacity: twinkle,
                filter: 'blur(0.5px)',
              }}
            />
          )
        })}
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 30,
          transform: `translateY(${floatY}px)`,
        }}
      >
        {/* logo */}
        <div
          style={{
            opacity: logoOpacity,
            transform: `scale(${logoScale}) rotate(${logoRotation}deg)`,
            filter: `drop-shadow(0 0 30px rgba(236, 208, 10, 0.4))`,
          }}
        >
          <Img
            src={staticFile('logo.png')}
            style={{
              width: 220,
              height: 220,
              objectFit: 'contain',
            }}
          />
        </div>

        {/* title with shimmer */}
        <div
          style={{
            position: 'relative',
            opacity: titleOpacity,
            transform: `scale(${titleScale}) translateY(${titleY}px)`,
          }}
        >
          <div
            style={{
              fontSize: 72,
              fontFamily: FONT,
              fontWeight: 800,
              color: '#ffffff',
              letterSpacing: -2,
            }}
          >
            Takeout
          </div>

          {/* shimmer overlay */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: `linear-gradient(
                90deg,
                transparent,
                rgba(255,255,255,0.3),
                transparent
              )`,
              transform: `translateX(${shimmerX}px)`,
              mixBlendMode: 'overlay',
            }}
          />
        </div>

        {/* url */}
        <div
          style={{
            opacity: urlOpacity,
            transform: `translateY(${urlY}px)`,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <div
            style={{
              fontSize: 32,
              fontFamily: FONT,
              fontWeight: 500,
              color: 'rgba(255,255,255,0.7)',
              letterSpacing: 1,
            }}
          >
            takeout.tamagui.dev
          </div>
        </div>
      </div>
    </AbsoluteFill>
  )
}
