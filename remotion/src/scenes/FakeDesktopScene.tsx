import {
  AbsoluteFill,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion'

const FONT =
  "'Inter', -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif"

type IconDef = {
  emoji: string
  label: string
}

// left column - content/feature demos to show in the video
const LEFT_ICONS: IconDef[] = [
  { emoji: '📝', label: 'home.tsx' },
  { emoji: '📁', label: 'Routing' },
  { emoji: '🎨', label: 'UI Kit' },
  { emoji: '🔄', label: 'Zero Sync' },
  { emoji: '⚡', label: 'Server Fns' },
  { emoji: '📱', label: 'Native App' },
  { emoji: '🎬', label: 'demo.mov' },
  { emoji: '✉️', label: 'Talk to us' },
  { emoji: '🚀', label: 'Sign up ↗' },
]

// right column - utility/info items
const RIGHT_ICONS: IconDef[] = [
  { emoji: '🏁', label: 'Why One?' },
  { emoji: '📦', label: 'Changelog' },
  { emoji: '📖', label: 'Getting Started' },
  { emoji: '🛍️', label: 'Templates' },
  { emoji: '💻', label: 'Contribute' },
  { emoji: '🗑️', label: 'Trash' },
]

const ICON_SPACING = 100
const START_Y = 35

const DesktopIcon: React.FC<{
  icon: IconDef
  y: number
  align: 'left' | 'right'
}> = ({ icon, y, align }) => {
  return (
    <div
      style={{
        position: 'absolute',
        ...(align === 'left' ? { left: 18 } : { right: 18 }),
        top: y,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        width: 100,
      }}
    >
      <div
        style={{
          fontSize: 46,
          lineHeight: 1,
          filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.12))',
        }}
      >
        {icon.emoji}
      </div>
      <div
        style={{
          marginTop: 6,
          fontSize: 13,
          fontFamily: FONT,
          fontWeight: 500,
          color: '#3a3530',
          textAlign: 'center',
          textShadow: '0 1px 2px rgba(255,255,255,0.5)',
          lineHeight: 1.2,
          whiteSpace: 'nowrap',
        }}
      >
        {icon.label}
      </div>
    </div>
  )
}

export const FAKE_DESKTOP_DURATION = 300

export const FakeDesktopScene: React.FC = () => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  // one logo entrance
  const logoEntrance = spring({
    frame: Math.max(0, frame - 15),
    fps,
    config: { damping: 14, stiffness: 80, mass: 1.1 },
    durationInFrames: 40,
  })
  const logoOpacity = interpolate(logoEntrance, [0, 0.3], [0, 1], {
    extrapolateRight: 'clamp',
  })
  const logoScale = interpolate(logoEntrance, [0, 1], [0.7, 1])

  // subtle float on the logo after it settles
  const floatStart = 55
  const floatProgress = Math.max(0, frame - floatStart)
  const floatY = floatProgress > 0 ? Math.sin(floatProgress * 0.02) * 4 : 0

  return (
    <AbsoluteFill>
      {/* sand texture background */}
      <Img
        src={staticFile('sand-texture.jpg')}
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          objectFit: 'cover',
        }}
      />

      {/* left column icons */}
      {LEFT_ICONS.map((icon, i) => (
        <DesktopIcon
          key={icon.label}
          icon={icon}
          y={START_Y + i * ICON_SPACING}
          align="left"
        />
      ))}

      {/* right column icons */}
      {RIGHT_ICONS.map((icon, i) => (
        <DesktopIcon
          key={icon.label}
          icon={icon}
          y={START_Y + i * ICON_SPACING}
          align="right"
        />
      ))}

      {/* one logo - bottom left */}
      <div
        style={{
          position: 'absolute',
          right: 60,
          bottom: 40,
          opacity: logoOpacity,
          transform: `scale(${logoScale}) translateY(${floatY}px)`,
          filter: 'drop-shadow(0 12px 24px rgba(0,0,0,0.15))',
        }}
      >
        <Img
          src={staticFile('ball2.png')}
          style={{
            width: 280,
            height: 280,
            objectFit: 'contain',
          }}
        />
      </div>
    </AbsoluteFill>
  )
}
