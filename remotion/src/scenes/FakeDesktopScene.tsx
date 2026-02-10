import { AbsoluteFill, Img, staticFile } from 'remotion'

import { OneLogo } from '../TakeoutLogo'

const FONT = "'Inter', -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif"

type IconDef = {
  icon: string
  label: string
}

// left column - content/feature demos
const LEFT_ICONS: IconDef[] = [
  { icon: 'house.png', label: 'home.tsx' },
  { icon: 'folder.png', label: 'Routing' },
  { icon: 'painting.png', label: 'UI Kit' },
  { icon: 'refresh.png', label: 'Zero Sync' },
  { icon: 'flash.png', label: 'Server Fns' },
  { icon: 'mobile-app.png', label: 'Native App' },
  { icon: 'video.png', label: 'demo.mov' },
  { icon: 'email.png', label: 'Talk to us' },
  { icon: 'title.png', label: 'Stack Header\nComposition API' },
]

// right column - utility/info items
const RIGHT_ICONS: IconDef[] = [
  { icon: 'image.png', label: 'Why One?' },
  { icon: 'document.png', label: 'Changelog' },
  { icon: 'open-book.png', label: 'Getting Started' },
  { icon: 'template.png', label: 'Templates' },
  { icon: 'computer.png', label: 'Contribute' },
  { icon: 'trash.png', label: 'Trash' },
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
      <Img
        src={staticFile(`icons/${icon.icon}`)}
        style={{
          width: 52,
          height: 52,
          objectFit: 'contain',
          filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.12))',
        }}
      />
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
          whiteSpace: 'pre-line',
        }}
      >
        {icon.label}
      </div>
    </div>
  )
}

export const FAKE_DESKTOP_DURATION = 300

export const FakeDesktopScene: React.FC = () => {
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

      {/* takeout logo - centered as brand */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          filter: 'drop-shadow(0 16px 32px rgba(0,0,0,0.18))',
        }}
      >
        <OneLogo size={2.5} />
      </div>
    </AbsoluteFill>
  )
}
