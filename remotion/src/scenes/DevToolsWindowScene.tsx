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

// icon is 4th in left column (index 3)
const CURSOR_START = { x: 700, y: 500 }
const ICON_CENTER = { x: 68, y: 361 }

// timeline (frames at 60fps)
const MOVE_START = 8
const MOVE_END = 35
const CLICK = 40
const WINDOW_OPEN = 52

// stage timeline (3 stages: 2 LEFT+RIGHT + 1 single-content)
const S1_ENTER = WINDOW_OPEN + 70
const S1_EXIT = WINDOW_OPEN + 460
const S2_ENTER = WINDOW_OPEN + 480
const S2_EXIT = WINDOW_OPEN + 870
const S3_ENTER = WINDOW_OPEN + 890
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

export const DEVTOOLS_CONFIG_SNIPPET: CodeSnippet = {
  title: 'vite.config.ts',
  lines: [
    [
      { text: 'import ', color: C.keyword },
      { text: '{ ', color: C.text },
      { text: 'one', color: C.func },
      { text: ' } ', color: C.text },
      { text: 'from ', color: C.keyword },
      { text: "'one/vite'", color: C.string },
    ],
    [],
    [
      { text: 'export ', color: C.keyword },
      { text: 'default ', color: C.keyword },
      { text: '{', color: C.text },
    ],
    [
      { text: '  plugins', color: C.param },
      { text: ': [', color: C.text },
      { text: 'one', color: C.func },
      { text: '({', color: C.text },
    ],
    [
      { text: '    devtools', color: C.param },
      { text: ': ', color: C.text },
      { text: 'true', color: C.keyword },
      { text: ',', color: C.text },
    ],
    [
      { text: '    inspector', color: C.param },
      { text: ': { ', color: C.text },
      { text: 'editor', color: C.param },
      { text: ': ', color: C.text },
      { text: "'vscode'", color: C.string },
      { text: ' }', color: C.text },
    ],
    [{ text: '  })]', color: C.text }],
    [{ text: '}', color: C.text }],
  ],
}

export const DEVTOOLS_API_SNIPPET: CodeSnippet = {
  title: 'window.__oneDevtools',
  lines: [
    [
      { text: '// ', color: C.punct },
      { text: 'Alt+Space opens dev spotlight', color: C.punct },
    ],
    [
      { text: 'const ', color: C.keyword },
      { text: 'devtools', color: C.text },
      { text: ' = {', color: C.text },
    ],
    [
      { text: '  routeInfo', color: C.param },
      { text: ': ', color: C.text },
      { text: 'getRouteInfo', color: C.func },
      { text: '(),', color: C.text },
    ],
    [
      { text: '  loaderTiming', color: C.param },
      { text: ': ', color: C.text },
      { text: 'getTimingHistory', color: C.func },
      { text: '(),', color: C.text },
    ],
    [
      { text: '  seo', color: C.param },
      { text: ': ', color: C.text },
      { text: 'getSEOMeta', color: C.func },
      { text: '(),', color: C.text },
    ],
    [
      { text: '  errors', color: C.param },
      { text: ': ', color: C.text },
      { text: 'getErrorLog', color: C.func },
      { text: '(),', color: C.text },
    ],
    [{ text: '}', color: C.text }],
  ],
}

export const SNIPPET_1 = DEVTOOLS_CONFIG_SNIPPET
export const SNIPPET_2 = DEVTOOLS_API_SNIPPET

// spotlight menu items
const SPOTLIGHT_ITEMS = [
  { label: 'SEO Preview', desc: 'Meta tags & social cards', key: '1' },
  { label: 'Route Info', desc: 'Params, segments, URL', key: '2' },
  { label: 'Loader Timing', desc: 'Performance profiling', key: '3' },
  { label: 'Errors', desc: 'Runtime error tracking', key: '4' },
  { label: 'Inspect Source', desc: 'Click to open in editor', key: '5' },
]

// loader timing data
const LOADER_ENTRIES = [
  { path: '/docs/routing', moduleMs: 12, execMs: 45 },
  { path: '/docs/api', moduleMs: 8, execMs: 32 },
  { path: '/docs/deploy', moduleMs: 15, execMs: 28 },
  { path: '/settings', moduleMs: 6, execMs: 18 },
]

const clamp = {
  extrapolateLeft: 'clamp' as const,
  extrapolateRight: 'clamp' as const,
}

export const DEVTOOLS_WINDOW_DURATION = 1340

// reusable code card
export const DevToolsCodeCard: React.FC<{
  snippet: CodeSnippet
  width?: number
}> = ({ snippet, width }) => (
  <div
    style={{
      background: '#fff',
      borderRadius: 10,
      border: '1px solid #d0d7de',
      overflow: 'hidden',
      ...(width ? { width } : {}),
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
      <span style={{ fontSize: 15, color: '#6e7781' }}>{'\u269B'}</span>
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
          {line.length === 0
            ? '\u00A0'
            : line.map((token, ti) => (
                <span key={ti} style={{ color: token.color }}>
                  {token.text}
                </span>
              ))}
        </div>
      ))}
    </div>
  </div>
)

// spotlight command palette
export const SpotlightMenu: React.FC<{
  localFrame: number
  highlightIndex: number
}> = ({ localFrame, highlightIndex }) => (
  <div
    style={{
      width: 360,
      background: '#161616',
      borderRadius: 12,
      border: '1px solid #2d2e32',
      overflow: 'hidden',
      boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
    }}
  >
    {/* header */}
    <div
      style={{
        padding: '14px 16px',
        borderBottom: '1px solid #2d2e32',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
      }}
    >
      <div
        style={{
          width: 22,
          height: 22,
          borderRadius: 6,
          background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 12,
          color: '#fff',
          fontWeight: 700,
        }}
      >
        1
      </div>
      <div
        style={{
          flex: 1,
          height: 32,
          background: '#222',
          borderRadius: 6,
          border: '1px solid #333',
          display: 'flex',
          alignItems: 'center',
          padding: '0 10px',
        }}
      >
        <span style={{ fontSize: 13, fontFamily: UI, color: '#666' }}>
          Search dev tools...
        </span>
      </div>
      <span
        style={{
          fontSize: 11,
          fontFamily: MONO,
          color: '#555',
          background: '#222',
          padding: '3px 6px',
          borderRadius: 4,
        }}
      >
        Alt+Space
      </span>
    </div>
    {/* items */}
    <div style={{ padding: '8px 0' }}>
      {SPOTLIGHT_ITEMS.map((item, i) => {
        const itemOp = interpolate(localFrame, [8 + i * 6, 14 + i * 6], [0, 1], clamp)
        const isHighlighted = i === highlightIndex
        return (
          <div
            key={i}
            style={{
              padding: '10px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              background: isHighlighted ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
              opacity: itemOp,
            }}
          >
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 6,
                background: isHighlighted ? '#3b82f6' : '#2d2e32',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 13,
                color: isHighlighted ? '#fff' : '#8b949e',
                fontWeight: 600,
                fontFamily: MONO,
              }}
            >
              {item.key}
            </div>
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: 14,
                  fontFamily: UI,
                  fontWeight: 600,
                  color: isHighlighted ? '#e6edf3' : '#c9d1d9',
                }}
              >
                {item.label}
              </div>
              <div
                style={{
                  fontSize: 11,
                  fontFamily: UI,
                  color: '#484f58',
                  marginTop: 1,
                }}
              >
                {item.desc}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  </div>
)

// dev panel with SEO preview content
export const DevPanel: React.FC = () => (
  <div
    style={{
      width: 380,
      background: '#161616',
      borderRadius: 12,
      border: '1px solid #2d2e32',
      overflow: 'hidden',
      boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
    }}
  >
    {/* header */}
    <div
      style={{
        height: 36,
        background: '#1a1a1a',
        borderBottom: '1px solid #2d2e32',
        display: 'flex',
        alignItems: 'center',
        padding: '0 12px',
        justifyContent: 'space-between',
      }}
    >
      <span
        style={{
          fontSize: 12,
          fontFamily: UI,
          fontWeight: 600,
          color: '#8b949e',
        }}
      >
        ONE Dev Tools
      </span>
      <span style={{ fontSize: 14, color: '#484f58' }}>{'\u2715'}</span>
    </div>
    {/* tabs */}
    <div
      style={{
        display: 'flex',
        borderBottom: '1px solid #2d2e32',
        padding: '0 8px',
      }}
    >
      {['SEO', 'Route', 'Loader', 'Errors'].map((tab, i) => (
        <div
          key={i}
          style={{
            padding: '8px 14px',
            fontSize: 12,
            fontFamily: UI,
            fontWeight: 600,
            color: i === 0 ? '#e6edf3' : '#484f58',
            borderBottom: i === 0 ? '2px solid #3b82f6' : '2px solid transparent',
          }}
        >
          {tab}
        </div>
      ))}
    </div>
    {/* seo preview content */}
    <div style={{ padding: 16 }}>
      {/* google preview */}
      <div style={{ marginBottom: 14 }}>
        <div
          style={{
            fontSize: 10,
            fontFamily: UI,
            color: '#484f58',
            marginBottom: 6,
            textTransform: 'uppercase',
            letterSpacing: 1,
          }}
        >
          Google Preview
        </div>
        <div
          style={{
            background: '#1a1a1a',
            borderRadius: 8,
            padding: 12,
            border: '1px solid #2d2e32',
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontFamily: UI,
              color: '#8b949e',
              marginBottom: 4,
            }}
          >
            acme.com {'\u203A'} docs {'\u203A'} routing
          </div>
          <div
            style={{
              fontSize: 15,
              fontFamily: UI,
              color: '#58a6ff',
              fontWeight: 500,
              marginBottom: 4,
            }}
          >
            Routing — Acme Docs
          </div>
          <div
            style={{
              fontSize: 12,
              fontFamily: UI,
              color: '#8b949e',
              lineHeight: 1.4,
            }}
          >
            Learn how to set up file-based routing with One...
          </div>
        </div>
      </div>
      {/* meta status */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {[
          { label: 'Title', status: 'ok' },
          { label: 'Description', status: 'ok' },
          { label: 'og:image', status: 'warn' },
        ].map((item, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 12,
              fontFamily: MONO,
            }}
          >
            <span
              style={{
                color: item.status === 'ok' ? '#3fb950' : '#d29922',
                fontSize: 13,
              }}
            >
              {item.status === 'ok' ? '\u2713' : '\u26A0'}
            </span>
            <span style={{ color: '#c9d1d9' }}>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  </div>
)

// loader timeline visualization
export const LoaderTimeline: React.FC<{
  localFrame: number
}> = ({ localFrame }) => (
  <div
    style={{
      width: 380,
      background: '#161616',
      borderRadius: 12,
      border: '1px solid #2d2e32',
      overflow: 'hidden',
      boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
    }}
  >
    <div
      style={{
        height: 36,
        background: '#1a1a1a',
        borderBottom: '1px solid #2d2e32',
        display: 'flex',
        alignItems: 'center',
        padding: '0 12px',
        gap: 8,
      }}
    >
      <span
        style={{
          fontSize: 12,
          fontFamily: UI,
          fontWeight: 600,
          color: '#8b949e',
        }}
      >
        Loader Timing
      </span>
      <span style={{ fontSize: 10, fontFamily: MONO, color: '#484f58' }}>4 entries</span>
    </div>
    <div style={{ padding: 12 }}>
      {LOADER_ENTRIES.map((entry, i) => {
        const entryOp = interpolate(localFrame, [10 + i * 12, 18 + i * 12], [0, 1], clamp)
        const barProgress = interpolate(localFrame, [14 + i * 12, 40 + i * 12], [0, 1], clamp)
        const totalMs = entry.moduleMs + entry.execMs
        const moduleWidth = (entry.moduleMs / 60) * 100
        const execWidth = (entry.execMs / 60) * 100
        return (
          <div
            key={i}
            style={{
              marginBottom: i < LOADER_ENTRIES.length - 1 ? 12 : 0,
              opacity: entryOp,
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: 4,
              }}
            >
              <span style={{ fontSize: 12, fontFamily: MONO, color: '#c9d1d9' }}>
                {entry.path}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 11, fontFamily: MONO, color: '#8b949e' }}>
                  {totalMs}ms
                </span>
                <span
                  style={{
                    fontSize: 9,
                    fontFamily: UI,
                    fontWeight: 600,
                    color: '#3fb950',
                    background: 'rgba(63, 185, 80, 0.15)',
                    padding: '1px 5px',
                    borderRadius: 3,
                  }}
                >
                  OK
                </span>
              </div>
            </div>
            <div
              style={{
                height: 6,
                background: '#222',
                borderRadius: 3,
                overflow: 'hidden',
                display: 'flex',
              }}
            >
              <div
                style={{
                  width: `${moduleWidth * barProgress}%`,
                  background: '#484f58',
                  borderRadius: '3px 0 0 3px',
                }}
              />
              <div
                style={{
                  width: `${execWidth * barProgress}%`,
                  background: '#8b949e',
                  borderRadius: '0 3px 3px 0',
                }}
              />
            </div>
          </div>
        )
      })}
      {/* legend */}
      <div
        style={{
          display: 'flex',
          gap: 16,
          marginTop: 12,
          paddingTop: 8,
          borderTop: '1px solid #2d2e32',
        }}
      >
        {[
          { label: 'Module Load', color: '#484f58' },
          { label: 'Execution', color: '#8b949e' },
        ].map((item, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div
              style={{
                width: 10,
                height: 6,
                borderRadius: 2,
                background: item.color,
              }}
            />
            <span style={{ fontSize: 10, fontFamily: UI, color: '#484f58' }}>
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  </div>
)

// source inspector visualization
export const SourceInspectorViz: React.FC = () => (
  <div style={{ width: 320, position: 'relative' }}>
    <div
      style={{
        background: '#161616',
        borderRadius: 12,
        border: '1px solid #2d2e32',
        padding: 20,
        overflow: 'hidden',
      }}
    >
      {/* mock button component with inspector highlight */}
      <div
        style={{
          background: '#222',
          borderRadius: 8,
          padding: '12px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '2px dashed #3b82f6',
          position: 'relative',
        }}
      >
        <span
          style={{
            fontSize: 14,
            fontFamily: MONO,
            fontWeight: 500,
            color: '#c9d1d9',
          }}
        >
          {'<Button variant="primary" />'}
        </span>
      </div>
      {/* file path tooltip */}
      <div
        style={{
          marginTop: 12,
          background: '#0d1117',
          border: '1px solid #3b82f6',
          borderRadius: 6,
          padding: '6px 10px',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        <span style={{ fontSize: 12, color: '#3b82f6' }}>{'\u2192'}</span>
        <span style={{ fontSize: 12, fontFamily: MONO, color: '#58a6ff' }}>
          src/components/Button.tsx:24
        </span>
      </div>
      {/* mock content lines */}
      <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ height: 10, background: '#2d2e32', borderRadius: 4, width: '80%' }} />
        <div style={{ height: 10, background: '#2d2e32', borderRadius: 4, width: '60%' }} />
        <div style={{ height: 10, background: '#2d2e32', borderRadius: 4, width: '90%' }} />
      </div>
    </div>
    <div
      style={{
        marginTop: 8,
        textAlign: 'center',
        fontSize: 11,
        fontFamily: MONO,
        color: '#484f58',
      }}
    >
      Alt+I — click to open in VS Code
    </div>
  </div>
)

// ======= STANDALONE SCENE =======

export const DevToolsWindowScene: React.FC = () => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  // cursor + window open
  const moveProgress = interpolate(frame, [MOVE_START, MOVE_END], [0, 1], {
    ...clamp,
    easing: Easing.bezier(0.4, 0, 0.2, 1),
  })
  const cursorX = interpolate(moveProgress, [0, 1], [CURSOR_START.x, ICON_CENTER.x])
  const cursorY = interpolate(moveProgress, [0, 1], [CURSOR_START.y, ICON_CENTER.y])
  const cursorIn = interpolate(frame, [MOVE_START - 5, MOVE_START], [0, 1], clamp)
  const cursorOut = interpolate(frame, [WINDOW_OPEN + 15, WINDOW_OPEN + 30], [1, 0], clamp)
  const isClicking = frame >= CLICK && frame < CLICK + 8
  const clickScale = isClicking ? 0.82 : 1
  const showHighlight = frame >= CLICK && frame < WINDOW_OPEN + 15

  const winSpring = spring({
    frame: Math.max(0, frame - WINDOW_OPEN),
    fps,
    config: { damping: 16, stiffness: 100, mass: 0.9 },
    durationInFrames: 35,
  })

  // close animation timeline (last 100 frames)
  const CLOSE_CURSOR_START = DEVTOOLS_WINDOW_DURATION - 60
  const CLOSE_CURSOR_END = DEVTOOLS_WINDOW_DURATION - 35
  const CLOSE_CLICK = DEVTOOLS_WINDOW_DURATION - 31
  const WIN_CLOSE_START = DEVTOOLS_WINDOW_DURATION - 27
  const WIN_CLOSE_END = DEVTOOLS_WINDOW_DURATION - 7

  const CLOSE_BTN = { x: 182, y: 122 }
  const closeMoveProgress = interpolate(
    frame,
    [CLOSE_CURSOR_START, CLOSE_CURSOR_END],
    [0, 1],
    { ...clamp, easing: Easing.bezier(0.4, 0, 0.2, 1) }
  )
  const closeCursorX = interpolate(closeMoveProgress, [0, 1], [700, CLOSE_BTN.x])
  const closeCursorY = interpolate(closeMoveProgress, [0, 1], [650, CLOSE_BTN.y])
  const closeCursorIn = interpolate(
    frame,
    [CLOSE_CURSOR_START - 5, CLOSE_CURSOR_START],
    [0, 1],
    clamp
  )
  const closeCursorOut = interpolate(frame, [WIN_CLOSE_END - 5, WIN_CLOSE_END], [1, 0], clamp)
  const isCloseClicking = frame >= CLOSE_CLICK && frame < CLOSE_CLICK + 6
  const closeClickScale = isCloseClicking ? 0.82 : 1

  // window exit
  const winCloseProgress = interpolate(frame, [WIN_CLOSE_START, WIN_CLOSE_END], [0, 1], {
    ...clamp,
    easing: Easing.inOut(Easing.cubic),
  })
  const winScale =
    interpolate(winSpring, [0, 1], [0.2, 1]) *
    interpolate(winCloseProgress, [0, 1], [1, 0.2])
  const winOpacity =
    interpolate(winSpring, [0, 0.15], [0, 1], { extrapolateRight: 'clamp' }) *
    interpolate(winCloseProgress, [0, 1], [1, 0])

  // combine cursor phases
  const isOpenPhase = frame < WINDOW_OPEN + 60
  const finalCursorX = isOpenPhase ? cursorX : closeCursorX
  const finalCursorY = isOpenPhase ? cursorY : closeCursorY
  const finalCursorOpacity = isOpenPhase
    ? cursorIn * cursorOut
    : closeCursorIn * closeCursorOut
  const finalClickScale = isOpenPhase ? clickScale : closeClickScale

  // camera zoom
  const zoomIn = interpolate(
    frame,
    [WINDOW_OPEN + 35, WINDOW_OPEN + 65],
    [1, 1.18],
    { ...clamp, easing: Easing.inOut(Easing.cubic) }
  )
  const ZOOM_OUT_START = DEVTOOLS_WINDOW_DURATION - 100
  const ZOOM_OUT_END = DEVTOOLS_WINDOW_DURATION - 63
  const zoomOut = interpolate(frame, [ZOOM_OUT_START, ZOOM_OUT_END], [1.18, 1], {
    ...clamp,
    easing: Easing.inOut(Easing.cubic),
  })
  const cameraZoom = Math.min(zoomIn, zoomOut)

  // shimmer
  const shimmerSp = spring({
    frame: Math.max(0, frame - (WINDOW_OPEN + 10)),
    fps,
    config: { damping: 20, stiffness: 140 },
    durationInFrames: 25,
  })
  const shimmerOut = interpolate(frame, [S1_ENTER - 15, S1_ENTER], [1, 0], clamp)
  const placeholderOp = Math.min(shimmerSp, shimmerOut)
  const shimmerX = interpolate((frame - WINDOW_OPEN) % 40, [0, 40], [-100, 200])

  // === STAGE 1: Spotlight → Dev Panel ===
  const s1Sp = spring({
    frame: Math.max(0, frame - S1_ENTER),
    fps,
    config: { damping: 20, stiffness: 140 },
    durationInFrames: 25,
  })
  const s1Ex = interpolate(frame, [S1_EXIT, S1_EXIT + STAGE_FADE], [1, 0], clamp)
  const st1Op = Math.min(s1Sp, s1Ex)
  const st1Y = interpolate(s1Sp, [0, 1], [15, 0])

  const s1L = Math.max(0, frame - S1_ENTER)

  // left content + subtitle fade in
  const s1LeftOp = interpolate(s1L, [30, 42], [0, 1], clamp)

  // spotlight highlight cycles: none → SEO → Loader → SEO (settled)
  const spotlightHighlight = s1L < 50 ? -1 : s1L < 70 ? 0 : s1L < 90 ? 2 : 0

  // arrow fades in 1.5s after interaction
  const s1ArrOp = interpolate(s1L, [150, 160], [0, 1], clamp)
  // right content springs in after arrow
  const s1RSp = spring({
    frame: Math.max(0, s1L - 156),
    fps,
    config: { damping: 18, stiffness: 120 },
    durationInFrames: 25,
  })
  const s1RSc = interpolate(s1RSp, [0, 1], [0.85, 1])
  const s1ROp = interpolate(s1RSp, [0, 0.3], [0, 1], { extrapolateRight: 'clamp' })
  // label fades in 1.5s after right content
  const s1LblOp = interpolate(s1L, [270, 283], [0, 1], clamp)

  // === STAGE 2: Loader Timeline → Source Inspector ===
  const s2Sp = spring({
    frame: Math.max(0, frame - S2_ENTER),
    fps,
    config: { damping: 20, stiffness: 140 },
    durationInFrames: 25,
  })
  const s2Ex = interpolate(frame, [S2_EXIT, S2_EXIT + STAGE_FADE], [1, 0], clamp)
  const st2Op = Math.min(s2Sp, s2Ex)
  const st2Y = interpolate(s2Sp, [0, 1], [15, 0])

  const s2L = Math.max(0, frame - S2_ENTER)

  // left content + subtitle fade in
  const s2LeftOp = interpolate(s2L, [30, 42], [0, 1], clamp)

  // arrow fades in 1.5s after interaction
  const s2ArrOp = interpolate(s2L, [150, 160], [0, 1], clamp)
  // right content springs in after arrow
  const s2RSp = spring({
    frame: Math.max(0, s2L - 156),
    fps,
    config: { damping: 18, stiffness: 120 },
    durationInFrames: 25,
  })
  const s2RSc = interpolate(s2RSp, [0, 1], [0.85, 1])
  const s2ROp = interpolate(s2RSp, [0, 0.3], [0, 1], { extrapolateRight: 'clamp' })
  // label fades in 1.5s after right content
  const s2LblOp = interpolate(s2L, [270, 283], [0, 1], clamp)

  // === STAGE 3: Code Snippets ===
  const s3Sp = spring({
    frame: Math.max(0, frame - S3_ENTER),
    fps,
    config: { damping: 20, stiffness: 140 },
    durationInFrames: 25,
  })
  const st3Y = interpolate(s3Sp, [0, 1], [15, 0])

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

        {showHighlight && (
          <div
            style={{
              position: 'absolute',
              left: 14,
              top: 330,
              width: 108,
              height: 78,
              background: 'rgba(59, 130, 246, 0.2)',
              borderRadius: 8,
              border: '2px solid rgba(59, 130, 246, 0.35)',
            }}
          />
        )}

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
                {['#FF5F57', '#FFBD2E', '#28CA42'].map((bg) => (
                  <div
                    key={bg}
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      background: bg,
                    }}
                  />
                ))}
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
                Dev Tools
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
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundImage: 'radial-gradient(circle, #d8d8d8 1px, transparent 1px)',
                  backgroundSize: '24px 24px',
                  maskImage:
                    'radial-gradient(ellipse at center, black 20%, transparent 70%)',
                  WebkitMaskImage:
                    'radial-gradient(ellipse at center, black 20%, transparent 70%)',
                  pointerEvents: 'none',
                }}
              />

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
                Dev Tools
              </div>

              <div style={{ flex: 1, position: 'relative' }}>
                {/* shimmer */}
                {placeholderOp > 0 && (
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      opacity: placeholderOp,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 40,
                    }}
                  >
                    {[0, 1].map((k) => (
                      <div
                        key={k}
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
                            background:
                              'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.5) 50%, transparent 100%)',
                            transform: `translateX(${shimmerX}%)`,
                          }}
                        />
                      </div>
                    ))}
                  </div>
                )}

                {/* stage 1: spotlight → dev panel */}
                {st1Op > 0 && (
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      opacity: st1Op,
                      transform: `translateY(${st1Y}px)`,
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
                        opacity: s1LeftOp,
                      }}
                    >
                      Press Alt+Space to launch...
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                      <div style={{ opacity: s1LeftOp }}>
                        <SpotlightMenu localFrame={s1L} highlightIndex={spotlightHighlight} />
                      </div>
                      <div
                        style={{
                          fontSize: 36,
                          color: '#3b82f6',
                          fontWeight: 700,
                          opacity: s1ArrOp,
                        }}
                      >
                        {'\u2192'}
                      </div>
                      <div style={{ opacity: s1ROp, transform: `scale(${s1RSc})` }}>
                        <DevPanel />
                      </div>
                    </div>
                    <div
                      style={{
                        fontSize: 66,
                        fontFamily: UI,
                        color: '#57606a',
                        fontWeight: 600,
                        opacity: s1LblOp,
                      }}
                    >
                      One shortcut — every developer tool
                    </div>
                  </div>
                )}

                {/* stage 2: loader timeline → source inspector */}
                {st2Op > 0 && (
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      opacity: st2Op,
                      transform: `translateY(${st2Y}px)`,
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
                        opacity: s2LeftOp,
                      }}
                    >
                      Profile loaders, inspect sources...
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                      <div style={{ opacity: s2LeftOp }}>
                        <LoaderTimeline localFrame={s2L} />
                      </div>
                      <div
                        style={{
                          fontSize: 36,
                          color: '#3b82f6',
                          fontWeight: 700,
                          opacity: s2ArrOp,
                        }}
                      >
                        {'\u2192'}
                      </div>
                      <div style={{ opacity: s2ROp, transform: `scale(${s2RSc})` }}>
                        <SourceInspectorViz />
                      </div>
                    </div>
                    <div
                      style={{
                        fontSize: 66,
                        fontFamily: UI,
                        color: '#57606a',
                        fontWeight: 600,
                        opacity: s2LblOp,
                      }}
                    >
                      Loader profiling + click-to-source
                    </div>
                  </div>
                )}

                {/* stage 3: code snippets side by side */}
                {s3Sp > 0 && (
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      opacity: s3Sp,
                      transform: `translateY(${st3Y}px)`,
                      display: 'flex',
                      gap: 24,
                      overflow: 'hidden',
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                  >
                    {[DEVTOOLS_CONFIG_SNIPPET, DEVTOOLS_API_SNIPPET].map((snippet, si) => (
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
                          <span style={{ fontSize: 15, color: '#6e7781' }}>{'\u269B'}</span>
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
                              {line.length === 0
                                ? '\u00A0'
                                : line.map((token, ti) => (
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
