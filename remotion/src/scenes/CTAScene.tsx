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

const CURSOR_BLINK_FRAMES = 16

const Cursor: React.FC<{ frame: number }> = ({ frame }) => {
  const opacity = interpolate(
    frame % CURSOR_BLINK_FRAMES,
    [0, CURSOR_BLINK_FRAMES / 2, CURSOR_BLINK_FRAMES],
    [1, 0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  )

  return <span style={{ opacity, color: '#4ECDC4', fontWeight: 300 }}>|</span>
}

export const CTAScene: React.FC<{
  tagline?: string
}> = ({ tagline = 'ship faster. ship everywhere.' }) => {
  const frame = useCurrentFrame()
  const { fps, width } = useVideoConfig()

  // logo entrance
  const logoSpring = spring({
    frame,
    fps,
    config: { damping: 200 },
    durationInFrames: Math.round(1 * fps),
  })

  const logoScale = interpolate(logoSpring, [0, 1], [0.6, 1])
  const logoOpacity = interpolate(logoSpring, [0, 0.3], [0, 1], {
    extrapolateRight: 'clamp',
  })

  // tagline typewriter (2 chars per frame)
  const typewriterStart = Math.round(0.7 * fps)
  const charFrames = 2
  const totalTypeFrames = tagline.length * charFrames
  const typedChars = Math.min(
    tagline.length,
    Math.max(0, Math.floor((frame - typewriterStart) / charFrames))
  )
  const displayedText = tagline.slice(0, typedChars)
  const typingDone = typedChars >= tagline.length

  // url fade in after typing
  const urlDelay = typewriterStart + totalTypeFrames + Math.round(0.4 * fps)
  const urlSpring = spring({
    frame,
    fps,
    config: { damping: 200 },
    delay: urlDelay,
  })

  const urlOpacity = urlSpring
  const urlY = interpolate(urlSpring, [0, 1], [15, 0])

  // background glow
  const pulseOpacity = interpolate(frame, [0, 2.5 * fps], [0, 0.12], {
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.quad),
  })

  // subtle float
  const floatPhase = Math.max(0, frame - 1.5 * fps)
  const floatY = floatPhase > 0 ? Math.sin(floatPhase * 0.02) * 3 : 0

  const logoSize = Math.min(width * 0.1, 120)

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#0a0a0a',
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
          background: `
            radial-gradient(ellipse at 35% 45%, rgba(78, 205, 196, ${pulseOpacity}) 0%, transparent 50%),
            radial-gradient(ellipse at 65% 55%, rgba(168, 85, 247, ${pulseOpacity}) 0%, transparent 50%)
          `,
        }}
      />

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 36,
          transform: `translateY(${floatY}px)`,
        }}
      >
        {/* logo */}
        <div
          style={{
            opacity: logoOpacity,
            transform: `scale(${logoScale})`,
            filter: 'drop-shadow(0 0 25px rgba(255,255,255,0.15))',
          }}
        >
          <Img
            src={staticFile('logo.png')}
            style={{
              width: logoSize,
              height: logoSize,
              objectFit: 'contain',
            }}
          />
        </div>

        {/* tagline with typewriter */}
        <div
          style={{
            fontSize: Math.min(width * 0.035, 44),
            fontFamily: 'Inter, system-ui, sans-serif',
            fontWeight: 600,
            color: '#ffffff',
            letterSpacing: 1.5,
            minHeight: 56,
          }}
        >
          <span>{displayedText}</span>
          {(!typingDone || frame < urlDelay) && <Cursor frame={frame} />}
        </div>

        {/* url */}
        <div
          style={{
            opacity: urlOpacity,
            transform: `translateY(${urlY}px)`,
            fontSize: Math.min(width * 0.018, 22),
            fontFamily: 'Inter, system-ui, sans-serif',
            fontWeight: 400,
            color: 'rgba(255,255,255,0.45)',
            letterSpacing: 5,
            textTransform: 'uppercase',
            padding: '10px 28px',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 8,
          }}
        >
          takeout.tamagui.dev
        </div>
      </div>
    </AbsoluteFill>
  )
}
