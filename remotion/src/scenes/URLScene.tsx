import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from 'remotion'

const FONT = "'Inter', -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif"

export const URLScene: React.FC = () => {
  const frame = useCurrentFrame()

  const urlOpacity = interpolate(frame, [10, 30], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
  const urlY = interpolate(frame, [10, 30], [15, 0], {
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
      <div
        style={{
          fontSize: 36,
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
    </AbsoluteFill>
  )
}
