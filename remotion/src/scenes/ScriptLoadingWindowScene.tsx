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

// flash icon is 5th in left column (index 4)
const CURSOR_START = { x: 700, y: 500 }
const ICON_CENTER = { x: 68, y: 461 }

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

const CONFIG_SNIPPET: CodeSnippet = {
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
    ],
    [
      { text: '    ', color: C.text },
      { text: 'one', color: C.func },
      { text: '({', color: C.text },
    ],
    [
      { text: '      web', color: C.param },
      { text: ': {', color: C.text },
    ],
    [
      { text: '        experimental_scriptLoading', color: C.param },
      { text: ':', color: C.text },
    ],
    [
      { text: '          ', color: C.text },
      { text: "'after-lcp'", color: C.string },
      { text: ',', color: C.text },
    ],
    [],
    [
      { text: '        // options:', color: C.punct },
    ],
    [
      { text: '        // ', color: C.punct },
      { text: "'defer-non-critical'", color: C.string },
    ],
    [
      { text: '        // ', color: C.punct },
      { text: "'after-lcp'", color: C.string },
    ],
    [
      { text: '        // ', color: C.punct },
      { text: "'after-lcp-aggressive'", color: C.string },
    ],
    [
      { text: '      }', color: C.text },
    ],
    [
      { text: '    })', color: C.text },
    ],
    [
      { text: '  ]', color: C.text },
    ],
    [{ text: '}', color: C.text }],
  ],
}

const STRATEGY_SNIPPET: CodeSnippet = {
  title: 'how after-lcp works',
  lines: [
    [
      { text: '// 1. SSR/SSG renders full HTML', color: C.punct },
    ],
    [
      { text: '// 2. critical scripts: async execution', color: C.punct },
    ],
    [
      { text: '<', color: C.text },
      { text: 'script', color: C.component },
      { text: ' type', color: C.param },
      { text: '=', color: C.text },
      { text: '"module"', color: C.string },
      { text: ' async', color: C.param },
      { text: ' src', color: C.param },
      { text: '=', color: C.text },
      { text: '"entry.js"', color: C.string },
      { text: ' />', color: C.text },
    ],
    [],
    [
      { text: '// 3. non-critical: preload hints only', color: C.punct },
    ],
    [
      { text: '<', color: C.text },
      { text: 'link', color: C.component },
      { text: ' rel', color: C.param },
      { text: '=', color: C.text },
      { text: '"modulepreload"', color: C.string },
    ],
    [
      { text: '      fetchPriority', color: C.param },
      { text: '=', color: C.text },
      { text: '"low"', color: C.string },
      { text: ' />', color: C.text },
    ],
    [],
    [
      { text: '// 4. execute after paint (double rAF)', color: C.punct },
    ],
    [
      { text: 'requestAnimationFrame', color: C.func },
      { text: '(() =>', color: C.text },
    ],
    [
      { text: '  ', color: C.text },
      { text: 'requestAnimationFrame', color: C.func },
      { text: '(', color: C.text },
      { text: 'loadScripts', color: C.func },
      { text: ')', color: C.text },
    ],
    [{ text: ')', color: C.text }],
    [],
    [
      { text: '// browser paints SSR content first', color: C.punct },
    ],
    [
      { text: '// then JS hydrates in background', color: C.punct },
    ],
  ],
}

// === VISUAL COMPONENTS ===

type ScoreEntry = {
  label: string
  score: number
  color: string
}

const BEFORE_SCORES: ScoreEntry[] = [
  { label: 'Performance', score: 54, color: '#ef4444' },
  { label: 'FCP', score: 62, color: '#f59e0b' },
  { label: 'LCP', score: 48, color: '#ef4444' },
  { label: 'TBT', score: 38, color: '#ef4444' },
]

const AFTER_SCORES: ScoreEntry[] = [
  { label: 'Performance', score: 97, color: '#22c55e' },
  { label: 'FCP', score: 95, color: '#22c55e' },
  { label: 'LCP', score: 98, color: '#22c55e' },
  { label: 'TBT', score: 92, color: '#22c55e' },
]

const ScoreRing: React.FC<{
  score: number
  color: string
  size: number
}> = ({ score, color, size }) => {
  const r = (size - 6) / 2
  const circumference = 2 * Math.PI * r
  const offset = circumference * (1 - score / 100)

  return (
    <div
      style={{
        width: size,
        height: size,
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <svg width={size} height={size} style={{ position: 'absolute' }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#f0f0f0"
          strokeWidth={4}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={4}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <span
        style={{
          fontSize: size * 0.32,
          fontFamily: MONO,
          fontWeight: 700,
          color,
          zIndex: 1,
        }}
      >
        {score}
      </span>
    </div>
  )
}

type ScriptEntry = {
  name: string
  type: 'critical' | 'deferred' | 'blocking'
  size: string
}

const BEFORE_SCRIPTS: ScriptEntry[] = [
  { name: 'entry.js', type: 'blocking', size: '48kb' },
  { name: 'vendor.js', type: 'blocking', size: '120kb' },
  { name: 'page.js', type: 'blocking', size: '32kb' },
  { name: 'utils.js', type: 'blocking', size: '24kb' },
]

const AFTER_SCRIPTS: ScriptEntry[] = [
  { name: 'entry.js', type: 'critical', size: '48kb' },
  { name: 'vendor.js', type: 'deferred', size: '120kb' },
  { name: 'page.js', type: 'critical', size: '32kb' },
  { name: 'utils.js', type: 'deferred', size: '24kb' },
]

const LighthousePanel: React.FC<{
  scores: ScoreEntry[]
  scripts: ScriptEntry[]
  title: string
  mode: 'before' | 'after'
}> = ({ scores, scripts, title, mode }) => (
  <div
    style={{
      width: 480,
      background: '#fff',
      borderRadius: 10,
      border: '1px solid #e0e0e0',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
    }}
  >
    {/* header */}
    <div
      style={{
        height: 40,
        background: mode === 'before' ? '#fef2f2' : '#f0fdf4',
        borderBottom: '1px solid #e0e0e0',
        display: 'flex',
        alignItems: 'center',
        padding: '0 16px',
        gap: 8,
      }}
    >
      <span
        style={{
          fontSize: 14,
          fontFamily: UI,
          fontWeight: 700,
          color: mode === 'before' ? '#991b1b' : '#166534',
        }}
      >
        {title}
      </span>
    </div>

    {/* score rings */}
    <div
      style={{
        padding: '14px 16px',
        display: 'flex',
        justifyContent: 'space-around',
        borderBottom: '1px solid #f0f0f0',
      }}
    >
      {scores.map((entry, i) => (
        <div
          key={i}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <ScoreRing score={entry.score} color={entry.color} size={52} />
          <span
            style={{
              fontSize: 9,
              fontFamily: UI,
              fontWeight: 600,
              color: '#6b7280',
              textTransform: 'uppercase',
              letterSpacing: 0.5,
            }}
          >
            {entry.label}
          </span>
        </div>
      ))}
    </div>

    {/* script loading waterfall */}
    <div style={{ padding: '10px 16px', display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span
        style={{
          fontSize: 10,
          fontFamily: UI,
          fontWeight: 700,
          color: '#6b7280',
          textTransform: 'uppercase',
          letterSpacing: 0.5,
          marginBottom: 2,
        }}
      >
        Script Loading
      </span>
      {scripts.map((script, i) => (
        <div
          key={i}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <span
            style={{
              fontSize: 11,
              fontFamily: MONO,
              color: '#57606a',
              minWidth: 70,
            }}
          >
            {script.name}
          </span>
          <div
            style={{
              flex: 1,
              height: 16,
              borderRadius: 3,
              background:
                script.type === 'blocking'
                  ? '#fecaca'
                  : script.type === 'critical'
                    ? '#bfdbfe'
                    : '#e5e7eb',
              display: 'flex',
              alignItems: 'center',
              padding: '0 6px',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <span
              style={{
                fontSize: 8,
                fontFamily: MONO,
                fontWeight: 600,
                color:
                  script.type === 'blocking'
                    ? '#991b1b'
                    : script.type === 'critical'
                      ? '#1e40af'
                      : '#6b7280',
                zIndex: 1,
              }}
            >
              {script.type === 'blocking'
                ? 'render-blocking'
                : script.type === 'critical'
                  ? 'async'
                  : 'modulepreload'}
            </span>
          </div>
          <span
            style={{
              fontSize: 10,
              fontFamily: MONO,
              color: '#9ca3af',
              minWidth: 36,
              textAlign: 'right',
            }}
          >
            {script.size}
          </span>
        </div>
      ))}

      {/* paint timing indicator */}
      {mode === 'after' && (
        <div
          style={{
            marginTop: 4,
            padding: '6px 10px',
            borderRadius: 5,
            background: '#f0fdf4',
            border: '1px solid #bbf7d0',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
            <path
              d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"
              fill="#22c55e"
              stroke="#16a34a"
              strokeWidth="1"
            />
          </svg>
          <span style={{ fontSize: 10, fontFamily: UI, fontWeight: 600, color: '#166534' }}>
            SSR paints before JS executes
          </span>
        </div>
      )}
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

export const SCRIPT_LOADING_WINDOW_DURATION = 930

export const ScriptLoadingWindowScene: React.FC = () => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const TOTAL = SCRIPT_LOADING_WINDOW_DURATION

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

  // === STAGE 1: before → after optimization ===
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

  // red pulse on render-blocking scripts
  const BLOCK_PULSE_START = 60
  const blockPulse = interpolate(
    s1L,
    [BLOCK_PULSE_START, BLOCK_PULSE_START + 10, BLOCK_PULSE_START + 20],
    [0, 0.6, 0],
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
                Script Loading — Performance
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
                Script Loading
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

                {/* stage 1: before → after optimization */}
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
                      Render-blocking scripts slow down paint...
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                      {/* before: render-blocking */}
                      <div style={{ opacity: s1LeftOpacity, position: 'relative' }}>
                        <LighthousePanel
                          scores={BEFORE_SCORES}
                          scripts={BEFORE_SCRIPTS}
                          title="Default Loading"
                          mode="before"
                        />
                        {/* red pulse overlay */}
                        {blockPulse > 0 && (
                          <div
                            style={{
                              position: 'absolute',
                              inset: -1,
                              borderRadius: 10,
                              border: '2px solid rgba(239, 68, 68, 0.4)',
                              boxShadow: `0 0 ${14 * blockPulse}px rgba(239, 68, 68, ${0.3 * blockPulse})`,
                              opacity: blockPulse,
                              pointerEvents: 'none',
                            }}
                          />
                        )}
                      </div>

                      {/* arrow with strategy label */}
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
                          after-lcp
                        </span>
                      </div>

                      {/* after: optimized */}
                      <div style={{ opacity: s1ROp, transform: `scale(${s1RSc})` }}>
                        <LighthousePanel
                          scores={AFTER_SCORES}
                          scripts={AFTER_SCRIPTS}
                          title="Optimized Loading"
                          mode="after"
                        />
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
                      Faster paint, higher Lighthouse scores
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
                    {[CONFIG_SNIPPET, STRATEGY_SNIPPET].map((snippet, si) => (
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
