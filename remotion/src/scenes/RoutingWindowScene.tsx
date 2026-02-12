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

export const MONO = "'SF Mono', 'Fira Code', 'Cascadia Code', monospace"
export const UI = "'Inter', -apple-system, 'Segoe UI', Roboto, sans-serif"

// routing icon is 2nd in left column
const CURSOR_START = { x: 700, y: 500 }
const ICON_CENTER = { x: 68, y: 160 }

// timeline (frames at 60fps)
const MOVE_START = 8
const MOVE_END = 35
const CLICK = 40
const WINDOW_OPEN = 52

// right panel stage timeline — starts after zoom completes (WINDOW_OPEN + 65 = frame 117)
const S1_ENTER = WINDOW_OPEN + 70
const S1_EXIT = WINDOW_OPEN + 460
const S2_ENTER = WINDOW_OPEN + 480
const S2_EXIT = WINDOW_OPEN + 870
const S3_ENTER = WINDOW_OPEN + 890
const STAGE_FADE = 20

// syntax highlight colors matching the reference image
const C = {
  keyword: '#cf222e',
  func: '#8250df',
  component: '#0550ae',
  param: '#953800',
  text: '#1f2328',
  punct: '#6e7781',
  string: '#0a3069',
}

// file tree entries
type TreeEntry = {
  indent: number
  name: string
  isFolder: boolean
  active?: boolean
}

export const FILE_TREE: TreeEntry[] = [
  { indent: 0, name: '...', isFolder: true },
  { indent: 0, name: 'feed', isFolder: true },
  { indent: 1, name: '@modal', isFolder: true },
  { indent: 2, name: '(..)photo', isFolder: true, active: true },
  { indent: 2, name: '[id]', isFolder: true },
  { indent: 3, name: 'page.tsx', isFolder: false },
  { indent: 0, name: 'photo', isFolder: true, active: true },
  { indent: 1, name: '[id]', isFolder: true },
  { indent: 2, name: 'page.tsx', isFolder: false },
]

// code snippet type
type CodeToken = { text: string; color: string }
type CodeSnippet = {
  title: string
  lines: CodeToken[][]
}

export const SNIPPET_1: CodeSnippet = {
  title: 'feed/@modal/(..)photo/[id]/page.tsx',
  lines: [
    [
      { text: 'export ', color: C.keyword },
      { text: 'default ', color: C.keyword },
      { text: 'function ', color: C.keyword },
      { text: 'PhotoModal', color: C.func },
      { text: '({ ', color: C.text },
      { text: 'params', color: C.param },
      { text: ' }) {', color: C.text },
    ],
    [
      { text: '  const ', color: C.keyword },
      { text: 'photo = photos.find(', color: C.text },
      { text: '(p)', color: C.param },
      { text: ' => p.id === params.id);', color: C.text },
    ],
    [
      { text: '  return ', color: C.keyword },
      { text: '(', color: C.text },
    ],
    [
      { text: '    <', color: C.text },
      { text: 'Modal', color: C.component },
      { text: '>', color: C.text },
    ],
    [
      { text: '      <', color: C.text },
      { text: 'Photo', color: C.component },
      { text: ' photo', color: C.param },
      { text: '={photo} />', color: C.text },
    ],
    [
      { text: '    </', color: C.text },
      { text: 'Modal', color: C.component },
      { text: '>', color: C.text },
    ],
    [{ text: '  );', color: C.text }],
    [{ text: '}', color: C.text }],
  ],
}

export const SNIPPET_2: CodeSnippet = {
  title: 'photo/[id]/page.tsx',
  lines: [
    [
      { text: 'export ', color: C.keyword },
      { text: 'default ', color: C.keyword },
      { text: 'function ', color: C.keyword },
      { text: 'PhotoPage', color: C.func },
      { text: '({ ', color: C.text },
      { text: 'params', color: C.param },
      { text: ' }) {', color: C.text },
    ],
    [
      { text: '  const ', color: C.keyword },
      { text: 'photo = photos.find(', color: C.text },
      { text: '(p)', color: C.param },
      { text: ' => p.id === params.id);', color: C.text },
    ],
    [
      { text: '  return ', color: C.keyword },
      { text: '<', color: C.text },
      { text: 'Photo', color: C.component },
      { text: ' photo', color: C.param },
      { text: '={photo} />;', color: C.text },
    ],
    [{ text: '}', color: C.text }],
  ],
}

// mini browser wireframe for diagrams
export const MiniBrowser: React.FC<{
  url: string
  width?: number
  height?: number
  children: React.ReactNode
}> = ({ url, width = 280, height = 210, children }) => (
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
    <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>{children}</div>
  </div>
)

// photo grid for feed wireframes
const GRID_COLORS = ['#e8e8e8', '#e0e0e0', '#e5e5e5', '#e2e2e2', '#e8e8e8', '#e0e0e0']

export const FeedCards: React.FC<{ highlightIndex?: number; dimmed?: boolean }> = ({
  highlightIndex = -1,
  dimmed = false,
}) => (
  <div
    style={{
      padding: 10,
      display: 'flex',
      flexWrap: 'wrap',
      gap: 8,
      opacity: dimmed ? 0.3 : 1,
    }}
  >
    {[0, 1, 2, 3, 4, 5].map((i) => {
      const active = i === highlightIndex
      return (
        <div
          key={i}
          style={{
            width: 'calc(33.333% - 6px)',
            aspectRatio: '1',
            borderRadius: 8,
            overflow: 'hidden',
            border: active ? '3px solid #3b82f6' : '1px solid #e8e8e8',
            boxShadow: active
              ? '0 0 0 2px rgba(59, 130, 246, 0.3)'
              : '0 1px 3px rgba(0,0,0,0.06)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div
            style={{
              flex: 1,
              background: GRID_COLORS[i],
            }}
          />
          <div
            style={{
              padding: '6px 8px',
              background: '#fff',
            }}
          >
            <div
              style={{
                height: 6,
                width: '70%',
                borderRadius: 3,
                background: active ? '#93c5fd' : '#e0e0e0',
              }}
            />
            <div
              style={{
                height: 5,
                width: '45%',
                borderRadius: 3,
                background: active ? '#bfdbfe' : '#f0f0f0',
                marginTop: 4,
              }}
            />
          </div>
        </div>
      )
    })}
  </div>
)

export const ROUTING_WINDOW_DURATION = 1340 // ~22.3s at 60fps

export const RoutingWindowScene: React.FC = () => {
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
  const CLOSE_CURSOR_START = 1280
  const CLOSE_CURSOR_END = 1305
  const CLOSE_CLICK = 1309
  const WIN_CLOSE_START = 1313
  const WIN_CLOSE_END = 1333

  // close button position — window top-left is (160,100), button offset ~(22,22)
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

  // window exit — shrink and fade after cursor clicks X
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

  // combine cursor phases: opening (move to icon) and closing (move to X)
  const isOpenPhase = frame < WINDOW_OPEN + 60
  const finalCursorX = isOpenPhase ? cursorX : closeCursorX
  const finalCursorY = isOpenPhase ? cursorY : closeCursorY
  const finalCursorOpacity = isOpenPhase
    ? cursorIn * cursorOut
    : closeCursorIn * closeCursorOut
  const finalClickScale = isOpenPhase ? clickScale : closeClickScale

  // placeholder — visible while zooming, before stage 1
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
  // shimmer sweep position (loops)
  const shimmerX = interpolate((frame - WINDOW_OPEN) % 40, [0, 40], [-100, 200])

  // right panel stage animations
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

  // stage 1 sub-animations: sequential reveal
  const s1Local = Math.max(0, frame - S1_ENTER)

  // left part fades in after stage enters
  const s1LeftOpacity = interpolate(s1Local, [30, 42], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  // ripple press on highlighted card — starts after left browser settles
  const RIPPLE_START = 60
  const rippleProgress = interpolate(s1Local, [RIPPLE_START, RIPPLE_START + 18], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
  const rippleScale = interpolate(rippleProgress, [0, 1], [0, 2.5])
  const rippleOpacity = interpolate(rippleProgress, [0, 0.3, 1], [0, 0.5, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  // arrow fades in 1.5s after ripple
  const arrowOpacity = interpolate(s1Local, [150, 160], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  // right browser springs in after arrow
  const rightBrowserSpring = spring({
    frame: Math.max(0, s1Local - 156),
    fps,
    config: { damping: 18, stiffness: 120 },
    durationInFrames: 25,
  })
  const rightBrowserScale = interpolate(rightBrowserSpring, [0, 1], [0.85, 1])
  const rightBrowserOpacity = interpolate(rightBrowserSpring, [0, 0.3], [0, 1], {
    extrapolateRight: 'clamp',
  })

  // bottom label fades in 1.5s after right browser
  const s1LabelOpacity = interpolate(s1Local, [270, 283], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  const s2Spring = spring({
    frame: Math.max(0, frame - S2_ENTER),
    fps,
    config: { damping: 20, stiffness: 140 },
    durationInFrames: 25,
  })
  const s2Exit = interpolate(frame, [S2_EXIT, S2_EXIT + STAGE_FADE], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
  const stage2Opacity = Math.min(s2Spring, s2Exit)
  const stage2Y = interpolate(s2Spring, [0, 1], [15, 0])

  // stage 2 sub-animations: sequential reveal
  const s2Local = Math.max(0, frame - S2_ENTER)

  // left part fades in after stage enters
  const s2LeftOpacity = interpolate(s2Local, [30, 42], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  // URL bar glow pulse — highlights the direct URL
  const S2_PULSE_START = 60
  const s2PulseProgress = interpolate(
    s2Local,
    [S2_PULSE_START, S2_PULSE_START + 20],
    [0, 1],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }
  )
  const s2PulseOpacity = interpolate(s2PulseProgress, [0, 0.3, 1], [0, 0.6, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  // stage 2 arrow fades in 1.5s after pulse
  const s2ArrowOpacity = interpolate(s2Local, [150, 160], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  // stage 2 right browser springs in after arrow
  const s2RightSpring = spring({
    frame: Math.max(0, s2Local - 156),
    fps,
    config: { damping: 18, stiffness: 120 },
    durationInFrames: 25,
  })
  const s2RightScale = interpolate(s2RightSpring, [0, 1], [0.85, 1])
  const s2RightOpacity = interpolate(s2RightSpring, [0, 0.3], [0, 1], {
    extrapolateRight: 'clamp',
  })

  // stage 2 label fades in 1.5s after right browser
  const s2LabelOpacity = interpolate(s2Local, [270, 283], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  const s3Spring = spring({
    frame: Math.max(0, frame - S3_ENTER),
    fps,
    config: { damping: 20, stiffness: 140 },
    durationInFrames: 25,
  })
  const stage3Opacity = s3Spring
  const stage3Y = interpolate(s3Spring, [0, 1], [15, 0])

  // screen studio style camera zoom — scales window (1600x880) to fill screen (1920x1080)
  const ZOOM_START = WINDOW_OPEN + 35
  const ZOOM_END = WINDOW_OPEN + 65
  const zoomIn = interpolate(frame, [ZOOM_START, ZOOM_END], [1, 1.18], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.cubic),
  })

  // zoom out — return to desktop view, finishes before cursor reappears
  const ZOOM_OUT_START = 1240
  const ZOOM_OUT_END = 1277
  const zoomOut = interpolate(frame, [ZOOM_OUT_START, ZOOM_OUT_END], [1.18, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.cubic),
  })

  const cameraZoom = Math.min(zoomIn, zoomOut)

  return (
    <AbsoluteFill>
      {/* screen studio camera — zooms into right panel after window opens */}
      <div
        style={{
          width: '100%',
          height: '100%',
          transform: `scale(${cameraZoom})`,
          transformOrigin: '960px 540px',
        }}
      >
        {/* desktop background */}
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

        {/* routes window */}
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
                File-Based Routing — app/
              </div>
              <div style={{ width: 52 }} />
            </div>

            {/* full-width content */}
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
              {/* radial dot grid background */}
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
                Intercepting Routes
              </div>

              {/* stages container */}
              <div style={{ flex: 1, position: 'relative' }}>
                {/* shimmer skeleton — shows during zoom before stage 1 */}
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
                    {/* left skeleton card */}
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

                    {/* right skeleton card */}
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

                {/* stage 1: feed → modal */}
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
                      When a user clicks from the feed...
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 20,
                      }}
                    >
                      {/* feed page with highlighted card + ripple */}
                      <div style={{ opacity: s1LeftOpacity }}>
                        <MiniBrowser url="acme.com/feed" width={580} height={420}>
                          <FeedCards highlightIndex={1} />
                          {/* ripple press effect on card index 1 (top-right in grid) */}
                          {rippleProgress > 0 && rippleProgress < 1 && (
                            <div
                              style={{
                                position: 'absolute',
                                left: '50%',
                                top: '22%',
                                width: 40,
                                height: 40,
                                borderRadius: '50%',
                                background: 'rgba(59, 130, 246, 0.35)',
                                transform: `translate(-50%, -50%) scale(${rippleScale})`,
                                opacity: rippleOpacity,
                                pointerEvents: 'none',
                              }}
                            />
                          )}
                        </MiniBrowser>
                      </div>

                      {/* arrow — fades in after ripple */}
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

                      {/* feed page with modal overlay — springs in last */}
                      <div
                        style={{
                          opacity: rightBrowserOpacity,
                          transform: `scale(${rightBrowserScale})`,
                        }}
                      >
                        <MiniBrowser url="acme.com/feed" width={580} height={420}>
                          <FeedCards dimmed />
                          {/* modal overlay */}
                          <div
                            style={{
                              position: 'absolute',
                              inset: 0,
                              background: 'rgba(0,0,0,0.25)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <div
                              style={{
                                width: '70%',
                                height: '55%',
                                background: '#fff',
                                borderRadius: 8,
                                boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <div
                                style={{
                                  width: 80,
                                  height: 80,
                                  borderRadius: 8,
                                  background: 'linear-gradient(135deg, #93c5fd, #3b82f6)',
                                }}
                              />
                            </div>
                          </div>
                        </MiniBrowser>
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
                      Photo opens as a modal overlay
                    </div>
                  </div>
                )}

                {/* stage 2: direct URL → full page */}
                {stage2Opacity > 0 && (
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      opacity: stage2Opacity,
                      transform: `translateY(${stage2Y}px)`,
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
                        opacity: s2LeftOpacity,
                      }}
                    >
                      When visiting the URL directly...
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 20,
                      }}
                    >
                      {/* browser with direct URL + URL bar glow */}
                      <div style={{ opacity: s2LeftOpacity }}>
                        <MiniBrowser url="acme.com/photo/123" width={580} height={420}>
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              height: '100%',
                            }}
                          >
                            <div
                              style={{
                                width: 120,
                                height: 120,
                                borderRadius: 10,
                                background: 'linear-gradient(135deg, #93c5fd, #3b82f6)',
                              }}
                            />
                          </div>
                          {/* URL bar glow pulse */}
                          {s2PulseOpacity > 0 && (
                            <div
                              style={{
                                position: 'absolute',
                                top: -32,
                                left: 0,
                                right: 0,
                                height: 28,
                                borderRadius: 4,
                                background: 'rgba(59, 130, 246, 0.25)',
                                boxShadow: '0 0 12px rgba(59, 130, 246, 0.4)',
                                opacity: s2PulseOpacity,
                                pointerEvents: 'none',
                              }}
                            />
                          )}
                        </MiniBrowser>
                      </div>

                      {/* arrow — fades in after pulse */}
                      <div
                        style={{
                          fontSize: 36,
                          color: '#3b82f6',
                          fontWeight: 700,
                          opacity: s2ArrowOpacity,
                        }}
                      >
                        →
                      </div>

                      {/* full page view — springs in last */}
                      <div
                        style={{
                          opacity: s2RightOpacity,
                          transform: `scale(${s2RightScale})`,
                        }}
                      >
                        <MiniBrowser url="acme.com/photo/123" width={580} height={420}>
                          <div
                            style={{
                              display: 'flex',
                              flexDirection: 'column',
                              height: '100%',
                            }}
                          >
                            {/* photo taking most of the page */}
                            <div
                              style={{
                                flex: 1,
                                margin: 8,
                                borderRadius: 6,
                                background: 'linear-gradient(135deg, #93c5fd, #3b82f6)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <div
                                style={{
                                  color: '#fff',
                                  fontSize: 11,
                                  fontFamily: UI,
                                  fontWeight: 600,
                                }}
                              >
                                Full Page View
                              </div>
                            </div>
                            {/* content bars below */}
                            <div
                              style={{
                                padding: '0 8px 8px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 4,
                              }}
                            >
                              <div
                                style={{
                                  height: 6,
                                  borderRadius: 3,
                                  background: '#e0e0e0',
                                  width: '80%',
                                }}
                              />
                              <div
                                style={{
                                  height: 6,
                                  borderRadius: 3,
                                  background: '#e0e0e0',
                                  width: '60%',
                                }}
                              />
                            </div>
                          </div>
                        </MiniBrowser>
                      </div>
                    </div>

                    <div
                      style={{
                        fontSize: 66,
                        fontFamily: UI,
                        color: '#57606a',
                        fontWeight: 600,
                        opacity: s2LabelOpacity,
                      }}
                    >
                      Same component renders as full page
                    </div>
                  </div>
                )}

                {/* stage 3: file tree + code snippets */}
                {stage3Opacity > 0 && (
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      opacity: stage3Opacity,
                      transform: `translateY(${stage3Y}px)`,
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
                      {/* top bar */}
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
                              i < FILE_TREE.length - 1 ? '1px solid #f0f0f0' : 'none',
                          }}
                        >
                          <Img
                            src={staticFile(
                              entry.isFolder ? 'icons/folder2.png' : 'icons/note.png'
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

                    {/* code snippets column */}
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 20,
                        justifyContent: 'center',
                      }}
                    >
                      {[SNIPPET_1, SNIPPET_2].map((snippet, si) => (
                        <div
                          key={si}
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
                            <span style={{ fontSize: 15, color: '#6e7781' }}>⚛</span>
                            <span
                              style={{
                                fontSize: 15,
                                fontFamily: MONO,
                                fontWeight: 500,
                                color: '#57606a',
                              }}
                            >
                              {snippet.title}
                            </span>
                          </div>
                          <div style={{ padding: '14px 18px' }}>
                            {snippet.lines.map((line, li) => (
                              <div
                                key={li}
                                style={{
                                  fontFamily: MONO,
                                  fontSize: 16,
                                  lineHeight: 1.7,
                                  whiteSpace: 'pre',
                                }}
                              >
                                {line.map((token, ti) => (
                                  <span key={ti} style={{ color: token.color }}>
                                    {token.text}
                                  </span>
                                ))}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* macos cursor */}
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
