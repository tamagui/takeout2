import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion'

import { FakeDesktopScene } from './FakeDesktopScene'

const MONO = "'SF Mono', 'Fira Code', 'Cascadia Code', monospace"
const UI = "'Inter', -apple-system, 'Segoe UI', Roboto, sans-serif"

// routing icon is 2nd in left column
const CURSOR_START = { x: 700, y: 500 }
const ICON_CENTER = { x: 68, y: 160 }

// timeline (frames at 60fps)
const MOVE_START = 8
const MOVE_END = 35
const CLICK = 40
const WINDOW_OPEN = 52

// right panel stage timeline
const S1_ENTER = WINDOW_OPEN + 16
const S1_EXIT = WINDOW_OPEN + 170
const S2_ENTER = WINDOW_OPEN + 180
const S2_EXIT = WINDOW_OPEN + 350
const S3_ENTER = WINDOW_OPEN + 360
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

const FILE_TREE: TreeEntry[] = [
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

const SNIPPET_1: CodeSnippet = {
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

const SNIPPET_2: CodeSnippet = {
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
const MiniBrowser: React.FC<{
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
    <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
      {children}
    </div>
  </div>
)

// card placeholders for feed wireframes
const FeedCards: React.FC<{ highlightIndex?: number; dimmed?: boolean }> = ({
  highlightIndex = -1,
  dimmed = false,
}) => (
  <div
    style={{
      padding: 8,
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
      opacity: dimmed ? 0.3 : 1,
    }}
  >
    {[0, 1, 2, 3].map((i) => {
      const active = i === highlightIndex
      return (
        <div
          key={i}
          style={{
            height: 46,
            borderRadius: 6,
            background: active ? 'rgba(59, 130, 246, 0.12)' : '#f0f0f0',
            border: active ? '2px solid #3b82f6' : '1px solid #e0e0e0',
            display: 'flex',
            alignItems: 'center',
            padding: '0 10px',
            gap: 8,
          }}
        >
          <div
            style={{
              width: 22,
              height: 22,
              borderRadius: 4,
              background: active ? '#93c5fd' : '#d4d4d4',
            }}
          />
          <div
            style={{
              flex: 1,
              height: 8,
              borderRadius: 4,
              background: active ? '#93c5fd' : '#d4d4d4',
            }}
          />
        </div>
      )
    })}
  </div>
)

export const ROUTING_WINDOW_DURATION = 600 // 10s at 60fps

export const RoutingWindowScene: React.FC = () => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  // cursor movement
  const moveProgress = interpolate(frame, [MOVE_START, MOVE_END], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.4, 0, 0.2, 1),
  })
  const cursorX = interpolate(moveProgress, [0, 1], [
    CURSOR_START.x,
    ICON_CENTER.x,
  ])
  const cursorY = interpolate(moveProgress, [0, 1], [
    CURSOR_START.y,
    ICON_CENTER.y,
  ])

  // cursor fade in / out
  const cursorIn = interpolate(frame, [MOVE_START - 5, MOVE_START], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
  const cursorOut = interpolate(
    frame,
    [WINDOW_OPEN + 15, WINDOW_OPEN + 30],
    [1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  )

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
  const CLOSE_CURSOR_START = 545
  const CLOSE_CURSOR_END = 570
  const CLOSE_CLICK = 574
  const WIN_CLOSE_START = 578
  const WIN_CLOSE_END = 598

  // close button position — window top-left is (160,100), button offset ~(22,22)
  const CLOSE_BTN = { x: 182, y: 122 }
  const closeMoveProgress = interpolate(frame, [CLOSE_CURSOR_START, CLOSE_CURSOR_END], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.4, 0, 0.2, 1),
  })
  const closeCursorX = interpolate(closeMoveProgress, [0, 1], [700, CLOSE_BTN.x])
  const closeCursorY = interpolate(closeMoveProgress, [0, 1], [650, CLOSE_BTN.y])
  const closeCursorIn = interpolate(frame, [CLOSE_CURSOR_START - 5, CLOSE_CURSOR_START], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
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
  const winScale = interpolate(winSpring, [0, 1], [0.2, 1]) * interpolate(winCloseProgress, [0, 1], [1, 0.2])
  const winOpacity = interpolate(winSpring, [0, 0.15], [0, 1], {
    extrapolateRight: 'clamp',
  }) * interpolate(winCloseProgress, [0, 1], [1, 0])

  // combine cursor phases: opening (move to icon) and closing (move to X)
  const isOpenPhase = frame < WINDOW_OPEN + 60
  const finalCursorX = isOpenPhase ? cursorX : closeCursorX
  const finalCursorY = isOpenPhase ? cursorY : closeCursorY
  const finalCursorOpacity = isOpenPhase ? cursorIn * cursorOut : closeCursorIn * closeCursorOut
  const finalClickScale = isOpenPhase ? clickScale : closeClickScale

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
  const ZOOM_OUT_START = 505
  const ZOOM_OUT_END = 542
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
            boxShadow:
              '0 25px 60px rgba(0,0,0,0.3), 0 0 0 1px rgba(0,0,0,0.08)',
            zIndex: 500,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* title bar */}
          <div
            style={{
              height: 44,
              background:
                'linear-gradient(180deg, #e8e6e3 0%, #d6d4d1 100%)',
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
              {/* feature title */}
              <div
                style={{
                  fontSize: 38,
                  fontFamily: UI,
                  fontWeight: 700,
                  color: '#1f2328',
                  marginBottom: 24,
                  flexShrink: 0,
                }}
              >
                Intercepting Routes
              </div>

              {/* stages container */}
              <div style={{ flex: 1, position: 'relative' }}>
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
                      justifyContent: 'center',
                      gap: 20,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 24,
                        fontFamily: UI,
                        fontWeight: 600,
                        color: '#57606a',
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
                      {/* feed page with highlighted card */}
                      <MiniBrowser url="acme.com/feed" width={580} height={420}>
                        <FeedCards highlightIndex={1} />
                      </MiniBrowser>

                      {/* arrow */}
                      <div
                        style={{
                          fontSize: 36,
                          color: '#3b82f6',
                          fontWeight: 700,
                        }}
                      >
                        →
                      </div>

                      {/* feed page with modal overlay */}
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
                                background:
                                  'linear-gradient(135deg, #93c5fd, #3b82f6)',
                              }}
                            />
                          </div>
                        </div>
                      </MiniBrowser>
                    </div>

                    <div
                      style={{
                        fontSize: 22,
                        fontFamily: UI,
                        color: '#3b82f6',
                        fontWeight: 600,
                        background: 'rgba(59, 130, 246, 0.08)',
                        padding: '10px 20px',
                        borderRadius: 8,
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
                      justifyContent: 'center',
                      gap: 20,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 24,
                        fontFamily: UI,
                        fontWeight: 600,
                        color: '#57606a',
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
                      {/* browser with direct URL */}
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
                              background:
                                'linear-gradient(135deg, #93c5fd, #3b82f6)',
                            }}
                          />
                        </div>
                      </MiniBrowser>

                      {/* arrow */}
                      <div
                        style={{
                          fontSize: 36,
                          color: '#3b82f6',
                          fontWeight: 700,
                        }}
                      >
                        →
                      </div>

                      {/* full page view */}
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
                              background:
                                'linear-gradient(135deg, #93c5fd, #3b82f6)',
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

                    <div
                      style={{
                        fontSize: 22,
                        fontFamily: UI,
                        color: '#3b82f6',
                        fontWeight: 600,
                        background: 'rgba(59, 130, 246, 0.08)',
                        padding: '10px 20px',
                        borderRadius: 8,
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
                      gap: 16,
                      overflow: 'hidden',
                    }}
                  >
                    {/* file tree card */}
                    <div
                      style={{
                        width: 240,
                        flexShrink: 0,
                        background: '#fff',
                        borderRadius: 10,
                        border: '1px solid #e0e0e0',
                        padding: '16px 0',
                        alignSelf: 'flex-start',
                      }}
                    >
                      {FILE_TREE.map((entry, i) => (
                        <div
                          key={`${entry.name}-${i}`}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            height: 36,
                            paddingLeft: 16 + entry.indent * 20,
                            paddingRight: 12,
                          }}
                        >
                          <span
                            style={{
                              fontSize: 14,
                              color: '#8b8b8b',
                              marginRight: 8,
                              flexShrink: 0,
                            }}
                          >
                            {entry.isFolder ? '\u{1F4C1}' : '\u{1F4C4}'}
                          </span>
                          <span
                            style={{
                              fontSize: 15,
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
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 16,
                        justifyContent: 'center',
                      }}
                    >
                      {[SNIPPET_1, SNIPPET_2].map((snippet, si) => (
                        <div key={si}>
                          <div
                            style={{
                              fontSize: 18,
                              color: '#9ca3af',
                              marginBottom: 6,
                              marginLeft: -20,
                            }}
                          >
                            →
                          </div>
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
                                padding: '8px 14px',
                                background: '#f6f8fa',
                                borderBottom: '1px solid #d0d7de',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                              }}
                            >
                              <span
                                style={{ fontSize: 13, color: '#6e7781' }}
                              >
                                ⚛
                              </span>
                              <span
                                style={{
                                  fontSize: 12,
                                  fontFamily: MONO,
                                  fontWeight: 500,
                                  color: '#57606a',
                                }}
                              >
                                {snippet.title}
                              </span>
                            </div>
                            <div style={{ padding: '12px 16px' }}>
                              {snippet.lines.map((line, li) => (
                                <div
                                  key={li}
                                  style={{
                                    fontFamily: MONO,
                                    fontSize: 13,
                                    lineHeight: 1.7,
                                    whiteSpace: 'pre',
                                  }}
                                >
                                  {line.map((token, ti) => (
                                    <span
                                      key={ti}
                                      style={{ color: token.color }}
                                    >
                                      {token.text}
                                    </span>
                                  ))}
                                </div>
                              ))}
                            </div>
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
