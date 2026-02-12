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

// email icon is 8th in left column (index 7)
const CURSOR_START = { x: 700, y: 500 }
const ICON_CENTER = { x: 68, y: 761 }

// timeline (frames at 60fps)
const MOVE_START = 8
const MOVE_END = 35
const CLICK = 40
const WINDOW_OPEN = 52

// 2-stage timeline (1 LEFT+RIGHT + 1 single-content)
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

const clamp = {
  extrapolateLeft: 'clamp' as const,
  extrapolateRight: 'clamp' as const,
}

// === CODE SNIPPETS ===

const PATTERN_SNIPPET: CodeSnippet = {
  title: 'user-profile.tsx',
  lines: [
    [
      { text: 'import ', color: C.keyword },
      { text: '{ ', color: C.text },
      { text: 'setServerData', color: C.func },
      { text: ', ', color: C.text },
      { text: 'getServerData', color: C.func },
      { text: ' } ', color: C.text },
      { text: 'from ', color: C.keyword },
      { text: "'one'", color: C.string },
    ],
    [],
    [
      { text: 'export ', color: C.keyword },
      { text: 'default ', color: C.keyword },
      { text: 'async ', color: C.keyword },
      { text: 'function ', color: C.keyword },
      { text: 'Profile', color: C.func },
      { text: '() {', color: C.text },
    ],
    [
      { text: '  if ', color: C.keyword },
      { text: "(process.env.VITE_ENVIRONMENT === ", color: C.text },
      { text: "'ssr'", color: C.string },
      { text: ') {', color: C.text },
    ],
    [
      { text: '    const ', color: C.keyword },
      { text: 'user', color: C.param },
      { text: ' = ', color: C.text },
      { text: 'await ', color: C.keyword },
      { text: 'fetchUser', color: C.func },
      { text: '()', color: C.text },
    ],
    [
      { text: '    ', color: C.text },
      { text: 'setServerData', color: C.func },
      { text: '(', color: C.text },
      { text: "'user'", color: C.string },
      { text: ', user)', color: C.text },
    ],
    [{ text: '  }', color: C.text }],
    [],
    [
      { text: '  const ', color: C.keyword },
      { text: 'user', color: C.param },
      { text: ' = ', color: C.text },
      { text: 'getServerData', color: C.func },
      { text: '(', color: C.text },
      { text: "'user'", color: C.string },
      { text: ')', color: C.text },
    ],
    [
      { text: '  return ', color: C.keyword },
      { text: '<', color: C.text },
      { text: 'UserCard', color: C.component },
      { text: ' user', color: C.param },
      { text: '={user} />', color: C.text },
    ],
    [{ text: '}', color: C.text }],
  ],
}

const TYPED_SNIPPET: CodeSnippet = {
  title: 'types.d.ts + loader usage',
  lines: [
    [
      { text: '// type-safe server data', color: C.punct },
    ],
    [
      { text: 'declare ', color: C.keyword },
      { text: 'module ', color: C.keyword },
      { text: "'one'", color: C.string },
      { text: ' {', color: C.text },
    ],
    [
      { text: '  namespace ', color: C.keyword },
      { text: 'One', color: C.component },
      { text: ' {', color: C.text },
    ],
    [
      { text: '    interface ', color: C.keyword },
      { text: 'ClientData', color: C.component },
      { text: ' {', color: C.text },
    ],
    [
      { text: '      user', color: C.param },
      { text: ': { ', color: C.text },
      { text: 'id', color: C.param },
      { text: ': string; ', color: C.text },
      { text: 'name', color: C.param },
      { text: ': string }', color: C.text },
    ],
    [{ text: '    }', color: C.text }],
    [{ text: '  }', color: C.text }],
    [{ text: '}', color: C.text }],
    [],
    [
      { text: '// also works in loaders', color: C.punct },
    ],
    [
      { text: 'export ', color: C.keyword },
      { text: 'const ', color: C.keyword },
      { text: 'loader', color: C.param },
      { text: ' = ', color: C.text },
      { text: 'async ', color: C.keyword },
      { text: '() => {', color: C.text },
    ],
    [
      { text: '  ', color: C.text },
      { text: 'setServerData', color: C.func },
      { text: '(', color: C.text },
      { text: "'user'", color: C.string },
      { text: ', ', color: C.text },
      { text: 'await ', color: C.keyword },
      { text: 'getUser', color: C.func },
      { text: '())', color: C.text },
    ],
    [{ text: '}', color: C.text }],
  ],
}

// === VISUAL COMPONENTS ===

// server process visualization
const ServerBlock: React.FC<{
  dataGlow: number
}> = ({ dataGlow }) => (
  <div
    style={{
      width: 440,
      background: '#fff',
      borderRadius: 10,
      border: '1px solid #e0e0e0',
      overflow: 'hidden',
    }}
  >
    {/* header */}
    <div
      style={{
        height: 40,
        background: '#1e293b',
        display: 'flex',
        alignItems: 'center',
        padding: '0 16px',
        gap: 8,
      }}
    >
      <div
        style={{
          width: 10,
          height: 10,
          borderRadius: '50%',
          background: '#22c55e',
        }}
      />
      <span style={{ fontSize: 13, fontFamily: MONO, fontWeight: 600, color: '#94a3b8' }}>
        Server (SSR)
      </span>
    </div>

    {/* server steps */}
    <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* step 1: fetch data */}
      <div
        style={{
          padding: '10px 12px',
          borderRadius: 6,
          background: '#f0fdf4',
          border: '1px solid #bbf7d0',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <div
          style={{
            width: 24,
            height: 24,
            borderRadius: '50%',
            background: '#dcfce7',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <span style={{ fontSize: 12 }}>{'\u2713'}</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ fontSize: 12, fontFamily: UI, fontWeight: 600, color: '#166534' }}>
            Fetch data on server
          </span>
          <span style={{ fontSize: 10, fontFamily: MONO, color: '#6b7280' }}>
            const user = await fetchUser()
          </span>
        </div>
      </div>

      {/* step 2: setServerData */}
      <div
        style={{
          padding: '10px 12px',
          borderRadius: 6,
          background: dataGlow > 0 ? `rgba(59, 130, 246, ${0.06 * dataGlow})` : '#f0f9ff',
          border: dataGlow > 0
            ? `1.5px solid rgba(59, 130, 246, ${0.4 * dataGlow})`
            : '1px solid #bae6fd',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          position: 'relative',
          boxShadow: dataGlow > 0
            ? `0 0 ${12 * dataGlow}px rgba(59, 130, 246, ${0.15 * dataGlow})`
            : 'none',
        }}
      >
        <div
          style={{
            width: 24,
            height: 24,
            borderRadius: '50%',
            background: '#dbeafe',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <span style={{ fontSize: 10, fontWeight: 700, color: '#3b82f6' }}>{'\u2192'}</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ fontSize: 12, fontFamily: UI, fontWeight: 600, color: '#1e40af' }}>
            Inject into HTML
          </span>
          <span style={{ fontSize: 10, fontFamily: MONO, color: '#6b7280' }}>
            setServerData('user', user)
          </span>
        </div>
      </div>

      {/* step 3: serialized into script tag */}
      <div
        style={{
          padding: '10px 12px',
          borderRadius: 6,
          background: '#f5f3ff',
          border: '1px solid #ddd6fe',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <div
          style={{
            width: 24,
            height: 24,
            borderRadius: '50%',
            background: '#ede9fe',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <span style={{ fontSize: 10, fontWeight: 700, color: '#7c3aed' }}>&lt;/&gt;</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ fontSize: 12, fontFamily: UI, fontWeight: 600, color: '#5b21b6' }}>
            Embedded in response
          </span>
          <span style={{ fontSize: 10, fontFamily: MONO, color: '#6b7280' }}>
            {'<script> globalThis.__data__ = {...}'}
          </span>
        </div>
      </div>
    </div>
  </div>
)

// client browser showing instant data
const ClientBrowser: React.FC = () => (
  <div
    style={{
      width: 440,
      borderRadius: 8,
      border: '1px solid #d0d7de',
      overflow: 'hidden',
      background: '#fff',
      display: 'flex',
      flexDirection: 'column',
      boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    }}
  >
    {/* browser bar */}
    <div
      style={{
        height: 28,
        background: '#f6f8fa',
        borderBottom: '1px solid #d0d7de',
        display: 'flex',
        alignItems: 'center',
        padding: '0 8px',
        gap: 5,
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
        app.com/profile
      </div>
    </div>

    {/* content — user card */}
    <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* profile header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #93c5fd, #3b82f6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span style={{ fontSize: 20, color: '#fff', fontWeight: 700 }}>J</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <span style={{ fontSize: 16, fontFamily: UI, fontWeight: 700, color: '#1f2328' }}>
            Jane Cooper
          </span>
          <span style={{ fontSize: 11, fontFamily: UI, color: '#6b7280' }}>
            jane@example.com
          </span>
        </div>
      </div>

      {/* instant badge */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '8px 12px',
          borderRadius: 6,
          background: '#f0fdf4',
          border: '1px solid #bbf7d0',
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <path
            d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"
            fill="#22c55e"
            stroke="#16a34a"
            strokeWidth="1"
          />
        </svg>
        <span style={{ fontSize: 11, fontFamily: UI, fontWeight: 600, color: '#166534' }}>
          Instant — no client fetch needed
        </span>
      </div>

      {/* data fields */}
      {[
        { label: 'Role', value: 'Admin' },
        { label: 'Team', value: 'Engineering' },
        { label: 'Location', value: 'San Francisco' },
      ].map((field, i) => (
        <div
          key={i}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            padding: '8px 0',
            borderBottom: '1px solid #f0f0f0',
          }}
        >
          <span style={{ fontSize: 12, fontFamily: UI, color: '#6b7280' }}>
            {field.label}
          </span>
          <span style={{ fontSize: 12, fontFamily: UI, fontWeight: 600, color: '#1f2328' }}>
            {field.value}
          </span>
        </div>
      ))}
    </div>
  </div>
)

// reusable code card
const CodeCard: React.FC<{ snippet: CodeSnippet }> = ({ snippet }) => (
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

// === MAIN SCENE ===

export const SERVER_DATA_WINDOW_DURATION = 930

export const ServerDataWindowScene: React.FC = () => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const TOTAL = SERVER_DATA_WINDOW_DURATION

  // cursor movement
  const moveProgress = interpolate(frame, [MOVE_START, MOVE_END], [0, 1], {
    ...clamp,
    easing: Easing.bezier(0.4, 0, 0.2, 1),
  })
  const cursorX = interpolate(moveProgress, [0, 1], [CURSOR_START.x, ICON_CENTER.x])
  const cursorY = interpolate(moveProgress, [0, 1], [CURSOR_START.y, ICON_CENTER.y])
  const cursorIn = interpolate(frame, [MOVE_START - 5, MOVE_START], [0, 1], clamp)
  const cursorOut = interpolate(
    frame,
    [WINDOW_OPEN + 15, WINDOW_OPEN + 30],
    [1, 0],
    clamp
  )
  const isClicking = frame >= CLICK && frame < CLICK + 8
  const clickScale = isClicking ? 0.82 : 1
  const showHighlight = frame >= CLICK && frame < WINDOW_OPEN + 15

  const winSpring = spring({
    frame: Math.max(0, frame - WINDOW_OPEN),
    fps,
    config: { damping: 16, stiffness: 100, mass: 0.9 },
    durationInFrames: 35,
  })

  // close animation (relative to TOTAL)
  const CLOSE_CURSOR_START = TOTAL - 60
  const CLOSE_CURSOR_END = TOTAL - 35
  const CLOSE_CLICK = TOTAL - 31
  const WIN_CLOSE_START = TOTAL - 27
  const WIN_CLOSE_END = TOTAL - 7

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
  const closeCursorOut = interpolate(
    frame,
    [WIN_CLOSE_END - 5, WIN_CLOSE_END],
    [1, 0],
    clamp
  )
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
  const zoomIn = interpolate(frame, [WINDOW_OPEN + 35, WINDOW_OPEN + 65], [1, 1.18], {
    ...clamp,
    easing: Easing.inOut(Easing.cubic),
  })
  const ZOOM_OUT_START = TOTAL - 100
  const ZOOM_OUT_END = TOTAL - 63
  const zoomOut = interpolate(frame, [ZOOM_OUT_START, ZOOM_OUT_END], [1.18, 1], {
    ...clamp,
    easing: Easing.inOut(Easing.cubic),
  })
  const cameraZoom = Math.min(zoomIn, zoomOut)

  // shimmer placeholder
  const shimmerSp = spring({
    frame: Math.max(0, frame - (WINDOW_OPEN + 10)),
    fps,
    config: { damping: 20, stiffness: 140 },
    durationInFrames: 25,
  })
  const shimmerOut = interpolate(frame, [S1_ENTER - 15, S1_ENTER], [1, 0], clamp)
  const placeholderOp = Math.min(shimmerSp, shimmerOut)
  const shimmerX = interpolate((frame - WINDOW_OPEN) % 40, [0, 40], [-100, 200])

  // === STAGE 1: server injects → client reads instantly ===
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
  const s1LeftOpacity = interpolate(s1L, [30, 42], [0, 1], clamp)

  // data injection glow on setServerData step
  const DATA_GLOW_START = 60
  const dataGlow = interpolate(s1L, [DATA_GLOW_START, DATA_GLOW_START + 15], [0, 1], clamp)

  // arrow
  const s1ArrOp = interpolate(s1L, [150, 160], [0, 1], clamp)

  // right element
  const s1RSp = spring({
    frame: Math.max(0, s1L - 156),
    fps,
    config: { damping: 18, stiffness: 120 },
    durationInFrames: 25,
  })
  const s1RSc = interpolate(s1RSp, [0, 1], [0.85, 1])
  const s1ROp = interpolate(s1RSp, [0, 0.3], [0, 1], { extrapolateRight: 'clamp' })

  // label
  const s1LblOp = interpolate(s1L, [270, 283], [0, 1], clamp)

  // === STAGE 2: Code (single-content, holds until close) ===
  const s2Sp = spring({
    frame: Math.max(0, frame - S2_ENTER),
    fps,
    config: { damping: 20, stiffness: 140 },
    durationInFrames: 25,
  })
  const st2Y = interpolate(s2Sp, [0, 1], [15, 0])

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
              top: 730,
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
                Server Data — Zero-Latency Hydration
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
              {/* dot grid background */}
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
                Server Data
              </div>

              {/* stages container */}
              <div style={{ flex: 1, position: 'relative' }}>
                {/* shimmer skeleton */}
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

                {/* stage 1: server injection → client reads instantly */}
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
                        opacity: s1LeftOpacity,
                      }}
                    >
                      Server fetches and embeds data in HTML...
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                      {/* server process */}
                      <div style={{ opacity: s1LeftOpacity }}>
                        <ServerBlock dataGlow={dataGlow} />
                      </div>

                      {/* arrow with getServerData label */}
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: 4,
                          opacity: s1ArrOp,
                        }}
                      >
                        <span
                          style={{
                            fontSize: 36,
                            color: '#3b82f6',
                            fontWeight: 700,
                          }}
                        >
                          {'\u2192'}
                        </span>
                        <span
                          style={{
                            fontSize: 11,
                            fontFamily: MONO,
                            color: '#6e7781',
                            fontWeight: 500,
                          }}
                        >
                          getServerData()
                        </span>
                      </div>

                      {/* client browser — instant data */}
                      <div style={{ opacity: s1ROp, transform: `scale(${s1RSc})` }}>
                        <ClientBrowser />
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
                      Zero-latency server to client data
                    </div>
                  </div>
                )}

                {/* stage 2: code snippets side by side */}
                {s2Sp > 0 && (
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      opacity: s2Sp,
                      transform: `translateY(${st2Y}px)`,
                      display: 'flex',
                      gap: 24,
                      overflow: 'hidden',
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                  >
                    {[PATTERN_SNIPPET, TYPED_SNIPPET].map((snippet, si) => (
                      <CodeCard key={si} snippet={snippet} />
                    ))}
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
