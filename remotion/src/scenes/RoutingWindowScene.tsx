import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion'
import { Video } from '@remotion/media'

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

// file tree entries for the left card
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

export const ROUTING_WINDOW_DURATION = 1680 // ~28s (27s video + intro)

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
  const winScale = interpolate(winSpring, [0, 1], [0.2, 1])
  const winOpacity = interpolate(winSpring, [0, 0.15], [0, 1], {
    extrapolateRight: 'clamp',
  })

  // video panel slides in slightly after window opens
  const videoEntrance = spring({
    frame: Math.max(0, frame - WINDOW_OPEN - 8),
    fps,
    config: { damping: 20, stiffness: 130 },
    durationInFrames: 30,
  })
  const videoOpacity = interpolate(videoEntrance, [0, 0.3], [0, 1], {
    extrapolateRight: 'clamp',
  })

  return (
    <AbsoluteFill>
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

      {/* routes window - split layout */}
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

          {/* split content: video left, file tree right */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              overflow: 'hidden',
            }}
          >
            {/* left: demo video */}
            <div
              style={{
                width: '50%',
                background: '#111',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: videoOpacity,
                overflow: 'hidden',
                borderRight: '1px solid #333',
              }}
            >
              <Video
                src={staticFile('test.mp4')}
                muted
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                }}
              />
            </div>

            {/* right: file tree + code snippets (image reference style) */}
            <div
              style={{
                width: '50%',
                background: '#f5f5f5',
                display: 'flex',
                padding: 24,
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
                {FILE_TREE.map((entry, i) => {
                  const treeSpring = spring({
                    frame: Math.max(0, frame - WINDOW_OPEN - 14 - i * 2),
                    fps,
                    config: { damping: 22, stiffness: 160 },
                    durationInFrames: 20,
                  })
                  const treeOpacity = interpolate(
                    treeSpring,
                    [0, 0.4],
                    [0, 1],
                    { extrapolateRight: 'clamp' }
                  )

                  return (
                    <div
                      key={`${entry.name}-${i}`}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        height: 36,
                        paddingLeft: 16 + entry.indent * 20,
                        paddingRight: 12,
                        opacity: treeOpacity,
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
                        {entry.isFolder ? '📁' : '📄'}
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
                  )
                })}
              </div>

              {/* arrow + code cards column */}
              <div
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 20,
                  justifyContent: 'center',
                }}
              >
                {/* snippet 1 */}
                {(() => {
                  const s1Spring = spring({
                    frame: Math.max(0, frame - WINDOW_OPEN - 30),
                    fps,
                    config: { damping: 20, stiffness: 140 },
                    durationInFrames: 25,
                  })
                  const s1Opacity = interpolate(
                    s1Spring,
                    [0, 0.3],
                    [0, 1],
                    { extrapolateRight: 'clamp' }
                  )
                  const s1X = interpolate(s1Spring, [0, 1], [15, 0])
                  return (
                    <div
                      style={{
                        opacity: s1Opacity,
                        transform: `translateX(${s1X}px)`,
                      }}
                    >
                      {/* arrow */}
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
                        {/* snippet header */}
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
                          <span style={{ fontSize: 13, color: '#6e7781' }}>
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
                            {SNIPPET_1.title}
                          </span>
                        </div>
                        {/* snippet code */}
                        <div style={{ padding: '12px 16px' }}>
                          {SNIPPET_1.lines.map((line, li) => (
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
                  )
                })()}

                {/* snippet 2 */}
                {(() => {
                  const s2Spring = spring({
                    frame: Math.max(0, frame - WINDOW_OPEN - 42),
                    fps,
                    config: { damping: 20, stiffness: 140 },
                    durationInFrames: 25,
                  })
                  const s2Opacity = interpolate(
                    s2Spring,
                    [0, 0.3],
                    [0, 1],
                    { extrapolateRight: 'clamp' }
                  )
                  const s2X = interpolate(s2Spring, [0, 1], [15, 0])
                  return (
                    <div
                      style={{
                        opacity: s2Opacity,
                        transform: `translateX(${s2X}px)`,
                      }}
                    >
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
                          <span style={{ fontSize: 13, color: '#6e7781' }}>
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
                            {SNIPPET_2.title}
                          </span>
                        </div>
                        <div style={{ padding: '12px 16px' }}>
                          {SNIPPET_2.lines.map((line, li) => (
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
                  )
                })()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* macos cursor */}
      <div
        style={{
          position: 'absolute',
          left: cursorX,
          top: cursorY,
          opacity: cursorIn * cursorOut,
          transform: `scale(${clickScale})`,
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
    </AbsoluteFill>
  )
}
