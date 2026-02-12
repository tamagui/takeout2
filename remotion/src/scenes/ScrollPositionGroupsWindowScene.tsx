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

import { FakeDesktopScene } from './FakeDesktopScene'

const MONO = "'SF Mono', 'Fira Code', 'Cascadia Code', monospace"
const UI = "'Inter', -apple-system, 'Segoe UI', Roboto, sans-serif"

// icon position
const CURSOR_START = { x: 700, y: 500 }
const ICON_CENTER = { x: 68, y: 160 }

// timeline (frames at 60fps)
const MOVE_START = 8
const MOVE_END = 35
const CLICK = 40
const WINDOW_OPEN = 52

// 2-stage layout (1 LEFT+RIGHT + 1 single-content)
const S1_ENTER = WINDOW_OPEN + 70
const S1_EXIT = WINDOW_OPEN + 460
const S2_ENTER = WINDOW_OPEN + 480
const STAGE_FADE = 20

// syntax colors
const C = {
  keyword: '#cf222e',
  func: '#8250df',
  component: '#0550ae',
  param: '#953800',
  text: '#1f2328',
  punct: '#6e7781',
  string: '#0a3069',
}

type CodeToken = { text: string; color: string }
type CodeSnippet = { title: string; lines: CodeToken[][] }

const LAYOUT_SNIPPET: CodeSnippet = {
  title: 'app/dashboard/_layout.tsx',
  lines: [
    [
      { text: 'import ', color: C.keyword },
      { text: '{ ', color: C.text },
      { text: 'useScrollGroup', color: C.func },
      { text: ', ', color: C.punct },
      { text: 'Slot', color: C.component },
      { text: ' } ', color: C.text },
      { text: 'from ', color: C.keyword },
      { text: "'one'", color: C.string },
    ],
    [],
    [
      { text: 'export ', color: C.keyword },
      { text: 'default ', color: C.keyword },
      { text: 'function ', color: C.keyword },
      { text: 'DashboardLayout', color: C.func },
      { text: '() {', color: C.text },
    ],
    [
      { text: '  ', color: C.text },
      { text: 'useScrollGroup', color: C.func },
      { text: '()', color: C.text },
    ],
    [],
    [
      { text: '  ', color: C.text },
      { text: 'return ', color: C.keyword },
      { text: '<', color: C.text },
      { text: 'Slot', color: C.component },
      { text: ' />', color: C.text },
    ],
    [{ text: '}', color: C.text }],
  ],
}

// file tree
type TreeEntry = {
  indent: number
  name: string
  isFolder: boolean
  active?: boolean
}

const FILE_TREE: TreeEntry[] = [
  { indent: 0, name: '...', isFolder: true },
  { indent: 0, name: 'dashboard', isFolder: true },
  { indent: 1, name: '_layout.tsx', isFolder: false, active: true },
  { indent: 1, name: 'feed', isFolder: true },
  { indent: 2, name: 'index.tsx', isFolder: false },
  { indent: 1, name: 'messages', isFolder: true },
  { indent: 2, name: 'index.tsx', isFolder: false },
  { indent: 1, name: 'settings', isFolder: true },
  { indent: 2, name: 'index.tsx', isFolder: false },
]

// tab app wireframe
const TAB_ITEMS = ['Feed', 'Messages', 'Settings']

const FEED_ITEMS = [
  { title: 'Getting started with One', color: '#e8e8e8' },
  { title: 'File-based routing guide', color: '#e2e2e2' },
  { title: 'Deploy anywhere', color: '#e5e5e5' },
  { title: 'Server functions', color: '#e0e0e0' },
  { title: 'Zero-config SSR', color: '#e8e8e8' },
  { title: 'Nested layouts', color: '#e2e2e2' },
  { title: 'API routes', color: '#e5e5e5' },
  { title: 'Middleware', color: '#e0e0e0' },
]

const MiniTabApp: React.FC<{
  url: string
  activeTab: number
  scrollOffset?: number
  scrollGlow?: boolean
  pulseTab?: number
  pulseOpacity?: number
  width?: number
  height?: number
}> = ({
  url,
  activeTab,
  scrollOffset = 0,
  scrollGlow = false,
  pulseTab = -1,
  pulseOpacity = 0,
  width = 560,
  height = 420,
}) => {
  const contentHeight = FEED_ITEMS.length * 52
  const viewportHeight = height - 26 - 36
  const scrollRatio = scrollOffset / (contentHeight - viewportHeight)
  const scrollBarHeight = Math.max(30, (viewportHeight / contentHeight) * viewportHeight)
  const scrollBarTop = scrollRatio * (viewportHeight - scrollBarHeight)

  return (
    <div
      style={{
        width,
        height,
        borderRadius: 8,
        border: '1px solid #d0d7de',
        overflow: 'hidden',
        background: '#fff',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
      }}
    >
      {/* browser chrome */}
      <div
        style={{
          height: 26,
          background: '#f6f8fa',
          borderBottom: '1px solid #d0d7de',
          display: 'flex',
          alignItems: 'center',
          padding: '0 8px',
          gap: 5,
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', gap: 4 }}>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: ['#FF5F57', '#FFBD2E', '#28CA42'][i],
              }}
            />
          ))}
        </div>
        <div
          style={{
            flex: 1,
            background: '#fff',
            borderRadius: 4,
            border: '1px solid #e0e0e0',
            padding: '2px 8px',
            fontSize: 10,
            fontFamily: UI,
            color: '#57606a',
          }}
        >
          {url}
        </div>
      </div>

      {/* tab bar */}
      <div
        style={{
          height: 36,
          background: '#fafafa',
          borderBottom: '1px solid #e0e0e0',
          display: 'flex',
          alignItems: 'center',
          padding: '0 8px',
          gap: 2,
          flexShrink: 0,
          position: 'relative',
        }}
      >
        {TAB_ITEMS.map((tab, i) => (
          <div
            key={tab}
            style={{
              padding: '6px 14px',
              fontSize: 11,
              fontFamily: UI,
              fontWeight: i === activeTab ? 600 : 400,
              color: i === activeTab ? '#1f2328' : '#57606a',
              borderRadius: 6,
              background: i === activeTab ? '#fff' : 'transparent',
              border: i === activeTab ? '1px solid #e0e0e0' : '1px solid transparent',
              position: 'relative',
            }}
          >
            {tab}
            {i === pulseTab && pulseOpacity > 0 && (
              <div
                style={{
                  position: 'absolute',
                  inset: -3,
                  borderRadius: 9,
                  background: 'rgba(59, 130, 246, 0.25)',
                  boxShadow: '0 0 12px rgba(59, 130, 246, 0.4)',
                  opacity: pulseOpacity,
                  pointerEvents: 'none',
                }}
              />
            )}
          </div>
        ))}
      </div>

      {/* content area */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <div
          style={{
            position: 'absolute',
            top: -scrollOffset,
            left: 0,
            right: 12,
            padding: 8,
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
          }}
        >
          {FEED_ITEMS.map((item, i) => (
            <div
              key={i}
              style={{
                height: 46,
                borderRadius: 6,
                background: item.color,
                display: 'flex',
                alignItems: 'center',
                padding: '0 12px',
              }}
            >
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 6,
                  background: `linear-gradient(135deg, ${
                    i % 2 === 0 ? '#c7d2fe' : '#bae6fd'
                  }, ${i % 2 === 0 ? '#818cf8' : '#38bdf8'})`,
                  marginRight: 10,
                  flexShrink: 0,
                }}
              />
              <div>
                <div
                  style={{
                    height: 5,
                    width: Math.max(60, 120 - i * 8),
                    borderRadius: 3,
                    background: '#c8c8c8',
                  }}
                />
                <div
                  style={{
                    height: 4,
                    width: Math.max(40, 80 - i * 6),
                    borderRadius: 2,
                    background: '#d8d8d8',
                    marginTop: 4,
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* scroll indicator bar */}
        <div
          style={{
            position: 'absolute',
            right: 2,
            top: scrollBarTop,
            width: 6,
            height: scrollBarHeight,
            borderRadius: 3,
            background: scrollGlow ? '#22c55e' : '#c0c0c0',
            boxShadow: scrollGlow
              ? '0 0 8px rgba(34, 197, 94, 0.5), 0 0 16px rgba(34, 197, 94, 0.25)'
              : 'none',
            transition: 'none',
          }}
        />
      </div>
    </div>
  )
}

export const SCROLL_POSITION_GROUPS_WINDOW_DURATION = 930

export const ScrollPositionGroupsWindowScene: React.FC = () => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  // cursor movement
  const moveProgress = interpolate(frame, [MOVE_START, MOVE_END], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.4, 0, 0.2, 1),
  })
  const cursorX = interpolate(moveProgress, [0, 1], [CURSOR_START.x, ICON_CENTER.x])
  const cursorY = interpolate(moveProgress, [0, 1], [CURSOR_START.y, ICON_CENTER.y])

  // cursor fade in / out
  const cursorIn = interpolate(frame, [MOVE_START - 5, MOVE_START], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
  const cursorOut = interpolate(frame, [WINDOW_OPEN + 15, WINDOW_OPEN + 30], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  // click bounce
  const isClicking = frame >= CLICK && frame < CLICK + 8
  const clickScale = isClicking ? 0.82 : 1

  // icon highlight
  const showHighlight = frame >= CLICK && frame < WINDOW_OPEN + 15

  // window entrance
  const winSpring = spring({
    frame: Math.max(0, frame - WINDOW_OPEN),
    fps,
    config: { damping: 16, stiffness: 100, mass: 0.9 },
    durationInFrames: 35,
  })

  // close animation timeline
  const CLOSE_CURSOR_START = 870
  const CLOSE_CURSOR_END = 895
  const CLOSE_CLICK = 899
  const WIN_CLOSE_START = 903
  const WIN_CLOSE_END = 923

  const CLOSE_BTN = { x: 182, y: 122 }
  const closeMoveProgress = interpolate(
    frame,
    [CLOSE_CURSOR_START, CLOSE_CURSOR_END],
    [0, 1],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.bezier(0.4, 0, 0.2, 1),
    }
  )
  const closeCursorX = interpolate(closeMoveProgress, [0, 1], [700, CLOSE_BTN.x])
  const closeCursorY = interpolate(closeMoveProgress, [0, 1], [650, CLOSE_BTN.y])
  const closeCursorIn = interpolate(
    frame,
    [CLOSE_CURSOR_START - 5, CLOSE_CURSOR_START],
    [0, 1],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }
  )
  const closeCursorOut = interpolate(frame, [WIN_CLOSE_END - 5, WIN_CLOSE_END], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
  const isCloseClicking = frame >= CLOSE_CLICK && frame < CLOSE_CLICK + 6
  const closeClickScale = isCloseClicking ? 0.82 : 1

  // window exit
  const winCloseProgress = interpolate(frame, [WIN_CLOSE_START, WIN_CLOSE_END], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.cubic),
  })
  const winScale =
    interpolate(winSpring, [0, 1], [0.2, 1]) *
    interpolate(winCloseProgress, [0, 1], [1, 0.2])
  const winOpacity =
    interpolate(winSpring, [0, 0.15], [0, 1], {
      extrapolateRight: 'clamp',
    }) * interpolate(winCloseProgress, [0, 1], [1, 0])

  // combine cursor phases
  const isOpenPhase = frame < WINDOW_OPEN + 60
  const finalCursorX = isOpenPhase ? cursorX : closeCursorX
  const finalCursorY = isOpenPhase ? cursorY : closeCursorY
  const finalCursorOpacity = isOpenPhase
    ? cursorIn * cursorOut
    : closeCursorIn * closeCursorOut
  const finalClickScale = isOpenPhase ? clickScale : closeClickScale

  // shimmer placeholder
  const placeholderIn = spring({
    frame: Math.max(0, frame - (WINDOW_OPEN + 10)),
    fps,
    config: { damping: 20, stiffness: 140 },
    durationInFrames: 25,
  })
  const placeholderOut = interpolate(frame, [S1_ENTER - 15, S1_ENTER], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
  const placeholderOpacity = Math.min(placeholderIn, placeholderOut)
  const shimmerX = interpolate((frame - WINDOW_OPEN) % 40, [0, 40], [-100, 200])

  // stage 1 animations
  const s1Spring = spring({
    frame: Math.max(0, frame - S1_ENTER),
    fps,
    config: { damping: 20, stiffness: 140 },
    durationInFrames: 25,
  })
  const s1Exit = interpolate(frame, [S1_EXIT, S1_EXIT + STAGE_FADE], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
  const stage1Opacity = Math.min(s1Spring, s1Exit)
  const stage1Y = interpolate(s1Spring, [0, 1], [15, 0])

  // stage 1 sub-animations
  const s1Local = Math.max(0, frame - S1_ENTER)

  const s1LeftOpacity = interpolate(s1Local, [30, 42], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  // tab pulse interaction
  const PULSE_START = 60
  const pulseProgress = interpolate(s1Local, [PULSE_START, PULSE_START + 20], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
  const tabPulseOpacity = interpolate(pulseProgress, [0, 0.3, 1], [0, 0.6, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  // arrow fades in 1.5s after interaction
  const arrowOpacity = interpolate(s1Local, [150, 160], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  // right app springs in after arrow
  const rightSpring = spring({
    frame: Math.max(0, s1Local - 156),
    fps,
    config: { damping: 18, stiffness: 120 },
    durationInFrames: 25,
  })
  const rightScale = interpolate(rightSpring, [0, 1], [0.85, 1])
  const rightOpacity = interpolate(rightSpring, [0, 0.3], [0, 1], {
    extrapolateRight: 'clamp',
  })

  // bottom label fades in 1.5s after right app
  const s1LabelOpacity = interpolate(s1Local, [270, 283], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  // stage 2 animations
  const s2Spring = spring({
    frame: Math.max(0, frame - S2_ENTER),
    fps,
    config: { damping: 20, stiffness: 140 },
    durationInFrames: 25,
  })
  const stage2Opacity = s2Spring
  const stage2Y = interpolate(s2Spring, [0, 1], [15, 0])

  // camera zoom
  const ZOOM_START = WINDOW_OPEN + 35
  const ZOOM_END = WINDOW_OPEN + 65
  const zoomIn = interpolate(frame, [ZOOM_START, ZOOM_END], [1, 1.18], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.cubic),
  })

  const ZOOM_OUT_START = 830
  const ZOOM_OUT_END = 867
  const zoomOut = interpolate(frame, [ZOOM_OUT_START, ZOOM_OUT_END], [1.18, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.cubic),
  })

  const cameraZoom = Math.min(zoomIn, zoomOut)

  return (
    <AbsoluteFill>
      <div
        style={{
          width: '100%',
          height: '100%',
          transform: `scale(${cameraZoom})`,
          transformOrigin: '960px 540px',
        }}
      >
        <FakeDesktopScene />

        {/* icon selection highlight */}
        {showHighlight && (
          <div
            style={{
              position: 'absolute',
              left: 14,
              top: 130,
              width: 108,
              height: 78,
              background: 'rgba(59, 130, 246, 0.2)',
              borderRadius: 8,
              border: '2px solid rgba(59, 130, 246, 0.35)',
            }}
          />
        )}

        {/* window */}
        {frame >= WINDOW_OPEN && (
          <div
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              transform: `translate(-50%, -50%) scale(${winScale})`,
              opacity: winOpacity,
              width: 1600,
              height: 880,
              borderRadius: 12,
              overflow: 'hidden',
              boxShadow: '0 25px 60px rgba(0,0,0,0.3), 0 0 0 1px rgba(0,0,0,0.08)',
              zIndex: 500,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* title bar */}
            <div
              style={{
                height: 44,
                background: 'linear-gradient(180deg, #e8e6e3 0%, #d6d4d1 100%)',
                display: 'flex',
                alignItems: 'center',
                padding: '0 16px',
                borderBottom: '1px solid #bbb',
                flexShrink: 0,
              }}
            >
              <div style={{ display: 'flex', gap: 8 }}>
                <div
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    background: '#FF5F57',
                  }}
                />
                <div
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    background: '#FFBD2E',
                  }}
                />
                <div
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    background: '#28CA42',
                  }}
                />
              </div>
              <div
                style={{
                  flex: 1,
                  textAlign: 'center',
                  fontSize: 13,
                  fontFamily: UI,
                  fontWeight: 600,
                  color: '#4a4a4a',
                }}
              >
                Scroll Position Groups — useScrollGroup()
              </div>
              <div style={{ width: 52 }} />
            </div>

            {/* content */}
            <div
              style={{
                flex: 1,
                background: '#f5f5f5',
                display: 'flex',
                flexDirection: 'column',
                padding: '24px 40px',
                overflow: 'hidden',
              }}
            >
              {/* dot grid */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundImage:
                    'radial-gradient(circle, #d8d8d8 1px, transparent 1px)',
                  backgroundSize: '24px 24px',
                  maskImage:
                    'radial-gradient(ellipse at center, black 20%, transparent 70%)',
                  WebkitMaskImage:
                    'radial-gradient(ellipse at center, black 20%, transparent 70%)',
                  pointerEvents: 'none',
                }}
              />

              {/* feature title */}
              <div
                style={{
                  fontSize: 76,
                  fontFamily: UI,
                  fontWeight: 700,
                  color: '#1f2328',
                  marginBottom: 24,
                  flexShrink: 0,
                  textAlign: 'center',
                }}
              >
                Scroll Position Groups
              </div>

              {/* stages container */}
              <div style={{ flex: 1, position: 'relative' }}>
                {/* shimmer skeleton */}
                {placeholderOpacity > 0 && (
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      opacity: placeholderOpacity,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 40,
                    }}
                  >
                    <div
                      style={{
                        width: 520,
                        height: 380,
                        borderRadius: 10,
                        background: '#e8e8e8',
                        overflow: 'hidden',
                        position: 'relative',
                      }}
                    >
                      <div
                        style={{
                          position: 'absolute',
                          inset: 0,
                          background: `linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.5) 50%, transparent 100%)`,
                          transform: `translateX(${shimmerX}%)`,
                        }}
                      />
                    </div>
                    <div
                      style={{
                        width: 520,
                        height: 380,
                        borderRadius: 10,
                        background: '#e8e8e8',
                        overflow: 'hidden',
                        position: 'relative',
                      }}
                    >
                      <div
                        style={{
                          position: 'absolute',
                          inset: 0,
                          background: `linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.5) 50%, transparent 100%)`,
                          transform: `translateX(${shimmerX}%)`,
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* stage 1: scroll preservation demo */}
                {stage1Opacity > 0 && (
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      opacity: stage1Opacity,
                      transform: `translateY(${stage1Y}px)`,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'space-around',
                    }}
                  >
                    <div
                      style={{
                        fontSize: 48,
                        fontFamily: UI,
                        fontWeight: 600,
                        color: '#57606a',
                        opacity: s1LeftOpacity,
                      }}
                    >
                      Navigate between child routes...
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 20,
                      }}
                    >
                      {/* left: feed tab scrolled down */}
                      <div style={{ opacity: s1LeftOpacity }}>
                        <MiniTabApp
                          url="myapp.com/dashboard/feed"
                          activeTab={0}
                          scrollOffset={120}
                          pulseTab={1}
                          pulseOpacity={tabPulseOpacity}
                        />
                      </div>

                      {/* arrow */}
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: 8,
                        }}
                      >
                        <div
                          style={{
                            fontSize: 36,
                            color: '#3b82f6',
                            fontWeight: 700,
                            opacity: arrowOpacity,
                          }}
                        >
                          →
                        </div>
                        <div
                          style={{
                            fontSize: 11,
                            fontFamily: UI,
                            color: '#94a3b8',
                            fontWeight: 500,
                            opacity: arrowOpacity,
                            textAlign: 'center',
                            lineHeight: 1.3,
                          }}
                        >
                          navigate
                          <br />& return
                        </div>
                      </div>

                      {/* right: back on feed, scroll preserved */}
                      <div
                        style={{
                          opacity: rightOpacity,
                          transform: `scale(${rightScale})`,
                        }}
                      >
                        <MiniTabApp
                          url="myapp.com/dashboard/feed"
                          activeTab={0}
                          scrollOffset={120}
                          scrollGlow
                        />
                      </div>
                    </div>

                    <div
                      style={{
                        fontSize: 66,
                        fontFamily: UI,
                        color: '#57606a',
                        fontWeight: 600,
                        opacity: s1LabelOpacity,
                      }}
                    >
                      Scroll position remembered automatically
                    </div>
                  </div>
                )}

                {/* stage 2: file tree + code */}
                {stage2Opacity > 0 && (
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      opacity: stage2Opacity,
                      transform: `translateY(${stage2Y}px)`,
                      display: 'flex',
                      gap: 24,
                      overflow: 'hidden',
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                  >
                    {/* file tree card */}
                    <div
                      style={{
                        width: 300,
                        flexShrink: 0,
                        background: '#fff',
                        borderRadius: 10,
                        border: '1px solid #e0e0e0',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          height: 36,
                          background: '#f6f8fa',
                          borderBottom: '1px solid #e0e0e0',
                          display: 'flex',
                          alignItems: 'center',
                          padding: '0 14px',
                        }}
                      >
                        <span
                          style={{
                            fontSize: 13,
                            fontFamily: UI,
                            fontWeight: 600,
                            color: '#57606a',
                          }}
                        >
                          app/
                        </span>
                      </div>

                      {FILE_TREE.map((entry, i) => (
                        <div
                          key={`${entry.name}-${i}`}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            height: 46,
                            paddingLeft: 18 + entry.indent * 22,
                            paddingRight: 14,
                            borderBottom:
                              i < FILE_TREE.length - 1
                                ? '1px solid #f0f0f0'
                                : 'none',
                          }}
                        >
                          <Img
                            src={staticFile(
                              entry.isFolder
                                ? 'icons/folder2.png'
                                : 'icons/note.png'
                            )}
                            style={{
                              width: 22,
                              height: 22,
                              objectFit: 'contain',
                              marginRight: 10,
                              flexShrink: 0,
                              opacity: 0.7,
                            }}
                          />
                          <span
                            style={{
                              fontSize: 17,
                              fontFamily: UI,
                              fontWeight: entry.isFolder ? 600 : 400,
                              color: '#1f2328',
                              flex: 1,
                            }}
                          >
                            {entry.name}
                          </span>
                          {entry.active && (
                            <div
                              style={{
                                width: 10,
                                height: 10,
                                borderRadius: '50%',
                                background: '#3b82f6',
                                flexShrink: 0,
                              }}
                            />
                          )}
                        </div>
                      ))}
                    </div>

                    {/* code snippet */}
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 20,
                        justifyContent: 'center',
                      }}
                    >
                      <div
                        style={{
                          background: '#fff',
                          borderRadius: 10,
                          border: '1px solid #d0d7de',
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            padding: '10px 16px',
                            background: '#f6f8fa',
                            borderBottom: '1px solid #d0d7de',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                          }}
                        >
                          <span style={{ fontSize: 15, color: '#6e7781' }}>
                            ⚛
                          </span>
                          <span
                            style={{
                              fontSize: 15,
                              fontFamily: MONO,
                              fontWeight: 500,
                              color: '#57606a',
                            }}
                          >
                            {LAYOUT_SNIPPET.title}
                          </span>
                        </div>
                        <div style={{ padding: '14px 18px' }}>
                          {LAYOUT_SNIPPET.lines.map((line, li) => (
                            <div
                              key={li}
                              style={{
                                fontFamily: MONO,
                                fontSize: 19,
                                lineHeight: 1.7,
                                whiteSpace: 'pre',
                              }}
                            >
                              {line.length === 0 ? (
                                '\u00A0'
                              ) : (
                                line.map((token, ti) => (
                                  <span
                                    key={ti}
                                    style={{ color: token.color }}
                                  >
                                    {token.text}
                                  </span>
                                ))
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* highlight callout */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 12,
                          padding: '14px 20px',
                          background: 'rgba(34, 197, 94, 0.08)',
                          border: '1px solid rgba(34, 197, 94, 0.25)',
                          borderRadius: 10,
                        }}
                      >
                        <div
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: '50%',
                            background: '#22c55e',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#fff',
                            fontSize: 16,
                            fontWeight: 700,
                            flexShrink: 0,
                          }}
                        >
                          ✓
                        </div>
                        <span
                          style={{
                            fontSize: 22,
                            fontFamily: UI,
                            fontWeight: 600,
                            color: '#166534',
                          }}
                        >
                          One line — all child routes preserve scroll
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* cursor */}
        <div
          style={{
            position: 'absolute',
            left: finalCursorX,
            top: finalCursorY,
            opacity: finalCursorOpacity,
            transform: `scale(${finalClickScale})`,
            zIndex: 1000,
          }}
        >
          <svg width="24" height="36" viewBox="0 0 24 36">
            <path
              d="M2 1L2 27L8 21L13 32L17 30L12 19L19 18L2 1Z"
              fill="white"
              stroke="#333"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>
    </AbsoluteFill>
  )
}
