import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion'

const HELLO = 'hello'
const TAKEOUT = 'takeout'

const HELLO_GRADIENT = { start: '#FF6B6B', end: '#FECA57' }
const TAKEOUT_GRADIENT = { start: '#4ECDC4', end: '#A855F7' }

const WordReveal: React.FC<{
  text: string
  gradient: { start: string; end: string }
  startFrame: number
  drawDuration: number
  fontSize: number
  fontFamily: string
}> = ({ text, gradient, startFrame, drawDuration, fontSize, fontFamily }) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  // smooth bezier progress for the clip reveal
  const revealProgress = interpolate(
    frame,
    [startFrame, startFrame + drawDuration],
    [0, 1],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    }
  )

  // glow peaks mid-draw then settles
  const glowIntensity = interpolate(
    frame,
    [startFrame, startFrame + drawDuration * 0.5, startFrame + drawDuration],
    [0, 1, 0.3],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  )

  // gentle scale-in
  const scaleSpring = spring({
    frame: Math.max(0, frame - startFrame),
    fps,
    config: { damping: 200 },
    durationInFrames: Math.round(drawDuration * 0.6),
  })
  const scale = interpolate(scaleSpring, [0, 1], [0.95, 1])

  // slight upward drift
  const translateY = interpolate(
    frame,
    [startFrame, startFrame + drawDuration],
    [10, 0],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.out(Easing.quad),
    }
  )

  // opacity entrance
  const opacity = interpolate(
    frame,
    [startFrame, startFrame + drawDuration * 0.15],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  )

  return (
    <div
      style={{
        transform: `scale(${scale}) translateY(${translateY}px)`,
        opacity,
      }}
    >
      <span
        style={{
          fontSize,
          fontFamily,
          fontWeight: 400,
          lineHeight: 1.3,
          background: `linear-gradient(90deg, ${gradient.start}, ${gradient.end})`,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          clipPath: `inset(0 ${(1 - revealProgress) * 100}% 0 0)`,
          filter: `drop-shadow(0 0 ${10 * glowIntensity}px ${gradient.start}80)`,
          whiteSpace: 'nowrap',
        }}
      >
        {text}
      </span>
    </div>
  )
}

export const HelloTakeoutScene: React.FC = () => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const fontSize = 110

  // timing (must finish before scene ends at 3s)
  const helloStart = Math.round(0.2 * fps)
  const helloDrawDuration = Math.round(1.2 * fps)
  const takeoutStart = Math.round(0.9 * fps)
  const takeoutDrawDuration = Math.round(1.4 * fps)

  // background glow builds up smoothly
  const bgGlow = interpolate(frame, [0, 2.5 * fps], [0, 0.7], {
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.quad),
  })

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#0a0a0a',
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
          background: `
            radial-gradient(ellipse 70% 60% at 50% 50%,
              rgba(78, 205, 196, ${bgGlow * 0.1}) 0%,
              rgba(168, 85, 247, ${bgGlow * 0.05}) 40%,
              transparent 70%)
          `,
        }}
      />

      {/* centered text */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: fontSize * 0.05,
        }}
      >
        <WordReveal
          text={HELLO}
          gradient={HELLO_GRADIENT}
          startFrame={helloStart}
          drawDuration={helloDrawDuration}
          fontSize={fontSize}
          fontFamily="PlaywriteAUTAS, cursive"
        />
        <WordReveal
          text={TAKEOUT}
          gradient={TAKEOUT_GRADIENT}
          startFrame={takeoutStart}
          drawDuration={takeoutDrawDuration}
          fontSize={fontSize}
          fontFamily="PlaywriteAUTAS, cursive"
        />
      </div>
    </AbsoluteFill>
  )
}
