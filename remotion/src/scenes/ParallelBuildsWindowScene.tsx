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

// flash icon is 5th in left column (index 4) — "Server Fns"
const CURSOR_START = { x: 700, y: 500 }
const ICON_CENTER = { x: 68, y: 461 }

// timeline (frames at 60fps)
const MOVE_START = 8
const MOVE_END = 35
const CLICK = 40
const WINDOW_OPEN = 52

// 2-stage timeline (1 LEFT+RIGHT + 1 single-content code)
const S1_ENTER = WINDOW_OPEN + 70
const S1_EXIT = WINDOW_OPEN + 460
const S2_ENTER = WINDOW_OPEN + 480
const STAGE_FADE = 20

const TOTAL = 930

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

// === CODE SNIPPETS (verified from ONE source: packages/one/src/cli/workerPool.ts) ===

const WORKER_POOL_SNIPPET: CodeSnippet = {
  title: 'workerPool.ts',
  lines: [
    [
      { text: 'import ', color: C.keyword },
      { text: '{ ', color: C.text },
      { text: 'cpus', color: C.func },
      { text: ' } ', color: C.text },
      { text: 'from ', color: C.keyword },
      { text: "'node:os'", color: C.string },
    ],
    [
      { text: 'import ', color: C.keyword },
      { text: '{ ', color: C.text },
      { text: 'Worker', color: C.component },
      { text: ' } ', color: C.text },
      { text: 'from ', color: C.keyword },
      { text: "'node:worker_threads'", color: C.string },
    ],
    [],
    [
      { text: 'class ', color: C.keyword },
      { text: 'BuildWorkerPool', color: C.component },
      { text: ' {', color: C.text },
    ],
    [
      { text: '  constructor', color: C.func },
      { text: '(', color: C.text },
    ],
    [
      { text: '    ', color: C.text },
      { text: 'size', color: C.param },
      { text: ' = Math.', color: C.text },
      { text: 'max', color: C.func },
      { text: '(1, ', color: C.text },
      { text: 'cpus', color: C.func },
      { text: '().length - 1)', color: C.text },
    ],
    [
      { text: '  ) {', color: C.text },
    ],
    [
      { text: '    for ', color: C.keyword },
      { text: '(let i = 0; i < size; i++) {', color: C.text },
    ],
    [
      { text: '      this.workers.', color: C.text },
      { text: 'push', color: C.func },
      { text: '(', color: C.text },
      { text: 'new ', color: C.keyword },
      { text: 'Worker', color: C.component },
      { text: '(entry))', color: C.text },
    ],
    [
      { text: '  }}', color: C.text },
    ],
    [
      { text: '  async ', color: C.keyword },
      { text: 'buildPage', color: C.func },
      { text: '(opts) {', color: C.text },
    ],
    [
      { text: '    return ', color: C.keyword },
      { text: 'this.', color: C.text },
      { text: 'enqueue', color: C.func },
      { text: '(', color: C.text },
      { text: "'build'", color: C.string },
      { text: ', opts)', color: C.text },
    ],
    [{ text: '  }', color: C.text }],
    [{ text: '}', color: C.text }],
  ],
}

// verified from ONE source: packages/one/src/cli/build.ts
const BUILD_SNIPPET: CodeSnippet = {
  title: 'build.ts',
  lines: [
    [
      { text: 'const ', color: C.keyword },
      { text: 'pool', color: C.param },
      { text: ' = ', color: C.text },
      { text: 'getWorkerPool', color: C.func },
      { text: '(', color: C.text },
      { text: 'BUILD_CONCURRENCY', color: C.param },
      { text: ')', color: C.text },
    ],
    [
      { text: 'await ', color: C.keyword },
      { text: 'pool.', color: C.text },
      { text: 'initialize', color: C.func },
      { text: '()', color: C.text },
    ],
    [],
    [
      { text: '// build pages in parallel', color: C.punct },
    ],
    [
      { text: 'const ', color: C.keyword },
      { text: 'results', color: C.param },
      { text: ' = ', color: C.text },
      { text: 'await ', color: C.keyword },
      { text: 'Promise', color: C.component },
      { text: '.', color: C.text },
      { text: 'all', color: C.func },
      { text: '(', color: C.text },
    ],
    [
      { text: '  pages.', color: C.text },
      { text: 'map', color: C.func },
      { text: '(', color: C.text },
      { text: 'page', color: C.param },
      { text: ' =>', color: C.text },
    ],
    [
      { text: '    pool.', color: C.text },
      { text: 'buildPage', color: C.func },
      { text: '(page)', color: C.text },
    ],
    [
      { text: '  )', color: C.text },
    ],
    [
      { text: ')', color: C.text },
    ],
    [],
    [
      { text: 'await ', color: C.keyword },
      { text: 'terminateWorkerPool', color: C.func },
      { text: '()', color: C.text },
    ],
  ],
}

// === VISUAL COMPONENTS ===

// worker pool card showing CPU cores with status
const CORES = [
  { id: 'CPU 1', page: '/home' },
  { id: 'CPU 2', page: '/about' },
  { id: 'CPU 3', page: '/docs/intro' },
  { id: 'CPU 4', page: '/blog/latest' },
]

const WorkerPoolCard: React.FC<{
  localFrame: number
  activeGlow: number
}> = ({ localFrame, activeGlow }) => (
  <div
    style={{
      width: 420,
      background: '#fff',
      borderRadius: 10,
      border: '1px solid #e0e0e0',
      overflow: 'hidden',
    }}
  >
    <div
      style={{
        height: 40,
        background: '#f6f8fa',
        borderBottom: '1px solid #e0e0e0',
        display: 'flex',
        alignItems: 'center',
        padding: '0 16px',
        gap: 8,
      }}
    >
      <span style={{ fontSize: 14, fontFamily: UI, fontWeight: 700, color: '#1f2328' }}>
        Worker Pool
      </span>
      <span style={{ fontSize: 11, fontFamily: MONO, color: '#6e7781' }}>
        cpus().length - 1
      </span>
    </div>
    {CORES.map((core, i) => {
      const itemOp = interpolate(localFrame, [i * 14, i * 14 + 10], [0, 1], clamp)
      const isActive = activeGlow > 0
      return (
        <div
          key={i}
          style={{
            padding: '14px 18px',
            borderBottom: i < CORES.length - 1 ? '1px solid #f0f0f0' : 'none',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            opacity: itemOp,
            position: 'relative',
            background: isActive
              ? `rgba(59, 130, 246, ${0.03 * activeGlow})`
              : 'transparent',
          }}
        >
          {/* activity indicator */}
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              background: isActive ? '#22c55e' : '#e5e7eb',
              flexShrink: 0,
              boxShadow: isActive
                ? `0 0 ${6 * activeGlow}px rgba(34, 197, 94, ${0.5 * activeGlow})`
                : 'none',
            }}
          />
          <span
            style={{
              fontSize: 14,
              fontFamily: MONO,
              fontWeight: 700,
              color: '#1f2328',
              minWidth: 48,
            }}
          >
            {core.id}
          </span>
          <span
            style={{
              fontSize: 13,
              fontFamily: MONO,
              color: isActive ? '#3b82f6' : '#6e7781',
              fontWeight: isActive ? 600 : 400,
            }}
          >
            {isActive ? `building ${core.page}` : 'idle'}
          </span>
          {isActive && (
            <div
              style={{
                marginLeft: 'auto',
                fontSize: 10,
                fontFamily: UI,
                fontWeight: 700,
                color: '#3b82f6',
                background: 'rgba(59, 130, 246, 0.08)',
                padding: '2px 8px',
                borderRadius: 4,
                textTransform: 'uppercase',
                letterSpacing: 0.5,
              }}
            >
              active
            </div>
          )}
        </div>
      )
    })}
  </div>
)

// performance comparison card
const PerfCard: React.FC<{
  localFrame: number
}> = ({ localFrame }) => (
  <div
    style={{
      width: 440,
      background: '#fff',
      borderRadius: 10,
      border: '1px solid #e0e0e0',
      overflow: 'hidden',
    }}
  >
    <div
      style={{
        height: 40,
        background: '#f6f8fa',
        borderBottom: '1px solid #e0e0e0',
        display: 'flex',
        alignItems: 'center',
        padding: '0 16px',
        gap: 8,
      }}
    >
      <span style={{ fontSize: 14, fontFamily: UI, fontWeight: 700, color: '#1f2328' }}>
        Build Performance
      </span>
      <span style={{ fontSize: 11, fontFamily: MONO, color: '#6e7781' }}>
        50 static pages
      </span>
    </div>

    {/* sequential row */}
    {(() => {
      const row1Op = interpolate(localFrame, [0, 10], [0, 1], clamp)
      return (
        <div style={{ padding: '16px 18px', borderBottom: '1px solid #f0f0f0', opacity: row1Op }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <span style={{ fontSize: 13, fontFamily: UI, fontWeight: 600, color: '#6e7781' }}>
              Sequential
            </span>
          </div>
          {/* bar */}
          <div style={{ position: 'relative', height: 28, borderRadius: 6, background: '#f0f0f0', overflow: 'hidden' }}>
            <div
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                bottom: 0,
                width: '100%',
                borderRadius: 6,
                background: 'linear-gradient(90deg, #e5e7eb 0%, #d1d5db 100%)',
              }}
            />
            <div
              style={{
                position: 'absolute',
                right: 8,
                top: 0,
                bottom: 0,
                display: 'flex',
                alignItems: 'center',
                fontSize: 12,
                fontFamily: MONO,
                fontWeight: 700,
                color: '#6e7781',
              }}
            >
              ~12s
            </div>
          </div>
          <div style={{ display: 'flex', gap: 3, marginTop: 6 }}>
            {[1, 2, 3, 4].map((n) => (
              <span
                key={n}
                style={{
                  fontSize: 10,
                  fontFamily: MONO,
                  color: '#8b949e',
                  background: '#f6f8fa',
                  padding: '1px 5px',
                  borderRadius: 3,
                  border: '1px solid #e5e7eb',
                }}
              >
                p{n}
              </span>
            ))}
            <span style={{ fontSize: 10, fontFamily: MONO, color: '#8b949e' }}>
              {'\u2192 one at a time'}
            </span>
          </div>
        </div>
      )
    })()}

    {/* parallel row */}
    {(() => {
      const row2Op = interpolate(localFrame, [15, 25], [0, 1], clamp)
      return (
        <div style={{ padding: '16px 18px', opacity: row2Op }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <span style={{ fontSize: 13, fontFamily: UI, fontWeight: 600, color: '#22c55e' }}>
              Worker Threads
            </span>
            <span
              style={{
                fontSize: 10,
                fontFamily: UI,
                fontWeight: 700,
                color: '#22c55e',
                background: 'rgba(34, 197, 94, 0.08)',
                padding: '2px 8px',
                borderRadius: 4,
                textTransform: 'uppercase',
                letterSpacing: 0.5,
              }}
            >
              ~40% faster
            </span>
          </div>
          {/* shorter bar */}
          <div style={{ position: 'relative', height: 28, borderRadius: 6, background: '#f0f0f0', overflow: 'hidden' }}>
            <div
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                bottom: 0,
                width: '60%',
                borderRadius: 6,
                background: 'linear-gradient(90deg, #22c55e 0%, #16a34a 100%)',
              }}
            />
            <div
              style={{
                position: 'absolute',
                left: 'calc(60% - 36px)',
                top: 0,
                bottom: 0,
                display: 'flex',
                alignItems: 'center',
                fontSize: 12,
                fontFamily: MONO,
                fontWeight: 700,
                color: '#fff',
              }}
            >
              ~7s
            </div>
          </div>
          <div style={{ display: 'flex', gap: 3, marginTop: 6 }}>
            {[
              [1, 2, 3, 4],
            ].map((group, gi) => (
              <div key={gi} style={{ display: 'flex', gap: 2 }}>
                {group.map((n) => (
                  <span
                    key={n}
                    style={{
                      fontSize: 10,
                      fontFamily: MONO,
                      color: '#22c55e',
                      background: 'rgba(34, 197, 94, 0.08)',
                      padding: '1px 5px',
                      borderRadius: 3,
                      border: '1px solid rgba(34, 197, 94, 0.2)',
                    }}
                  >
                    p{n}
                  </span>
                ))}
              </div>
            ))}
            <span style={{ fontSize: 10, fontFamily: MONO, color: '#22c55e' }}>
              {'\u2192 all at once'}
            </span>
          </div>
        </div>
      )
    })()}
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

// 2 stages: 1 LEFT+RIGHT + 1 code = ~930 frames
export const PARALLEL_BUILDS_WINDOW_DURATION = TOTAL

export const ParallelBuildsWindowScene: React.FC = () => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

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

  // close animation timeline (last 100 frames, relative to TOTAL)
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

  // === STAGE 1: Worker Pool → Performance ===
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

  // cores activate glow
  const ACTIVE_GLOW_START = 60
  const activeGlow = interpolate(
    s1L,
    [ACTIVE_GLOW_START, ACTIVE_GLOW_START + 15],
    [0, 1],
    clamp
  )

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

  // === STAGE 2: Code snippets ===
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
              top: 430,
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
                Parallel Builds
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
                Parallel Builds
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

                {/* stage 1: worker pool → performance */}
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
                      Worker threads across every CPU core...
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                      {/* worker pool card */}
                      <div style={{ opacity: s1LeftOpacity }}>
                        <WorkerPoolCard
                          localFrame={Math.max(0, s1L - 30)}
                          activeGlow={activeGlow}
                        />
                      </div>

                      {/* arrow */}
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

                      {/* performance card */}
                      <div style={{ opacity: s1ROp, transform: `scale(${s1RSc})` }}>
                        <PerfCard localFrame={Math.max(0, s1L - 156)} />
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
                      ~40% faster static page generation
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
                    {[WORKER_POOL_SNIPPET, BUILD_SNIPPET].map((snippet, si) => (
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
