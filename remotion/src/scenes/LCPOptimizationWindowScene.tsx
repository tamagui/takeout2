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

// painting.png icon is 3rd in left column (index 2)
const CURSOR_START = { x: 700, y: 500 }
const ICON_CENTER = { x: 68, y: 261 }

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
      { text: '        inlineLayoutCSS', color: C.param },
      { text: ': ', color: C.text },
      { text: 'true', color: C.keyword },
      { text: ',', color: C.text },
    ],
    [{ text: '      }', color: C.text }],
    [{ text: '    })', color: C.text }],
    [{ text: '  ]', color: C.text }],
    [{ text: '}', color: C.text }],
  ],
}

const HYDRATION_SNIPPET: CodeSnippet = {
  title: 'hydration-safe output',
  lines: [
    [{ text: '// server renders CSS inline', color: C.punct }],
    [
      { text: '<', color: C.text },
      { text: 'style', color: C.component },
      { text: ' id', color: C.param },
      { text: '=', color: C.text },
      { text: '"__one_css_0"', color: C.string },
      { text: '>', color: C.text },
    ],
    [
      { text: '  .layout { ', color: C.text },
      { text: 'display', color: C.param },
      { text: ': flex; ... }', color: C.text },
    ],
    [
      { text: '</', color: C.text },
      { text: 'style', color: C.component },
      { text: '>', color: C.text },
    ],
    [],
    [{ text: '// client JSON strips cssContents', color: C.punct }],
    [{ text: '// avoids 100KB+ duplication', color: C.punct }],
    [
      { text: 'const ', color: C.keyword },
      { text: '{ ', color: C.text },
      { text: 'cssContents', color: C.param },
      { text: ', ...', color: C.text },
      { text: 'rest', color: C.param },
      { text: ' } = ', color: C.text },
      { text: 'context', color: C.text },
    ],
    [
      { text: 'clientContext', color: C.text },
      { text: '.', color: C.punct },
      { text: 'cssInlineCount', color: C.param },
      { text: ' = ', color: C.text },
      { text: 'cssContents', color: C.text },
      { text: '.length', color: C.func },
    ],
    [],
    [{ text: '// client reads CSS from DOM <style>', color: C.punct }],
    [{ text: '// zero extra network requests', color: C.punct }],
  ],
}

// === STAGE 1 VISUAL COMPONENTS ===

type TimelineEntry = {
  label: string
  start: number
  end: number
  color: string
  tag?: string
}

const STANDARD_TIMELINE: TimelineEntry[] = [
  { label: 'HTML Parse', start: 0, end: 28, color: '#3b82f6' },
  { label: 'CSS Request', start: 28, end: 62, color: '#ef4444', tag: 'blocking' },
  { label: 'First Paint', start: 62, end: 100, color: '#22c55e' },
]

const INLINE_TIMELINE: TimelineEntry[] = [
  { label: 'HTML + CSS', start: 0, end: 32, color: '#3b82f6' },
  { label: 'First Paint', start: 32, end: 100, color: '#22c55e' },
]

// html source tokens for standard loading
const STANDARD_HTML: CodeToken[][] = [
  [
    { text: '<', color: C.text },
    { text: 'head', color: C.component },
    { text: '>', color: C.text },
  ],
  [
    { text: '  <', color: C.text },
    { text: 'link', color: C.component },
    { text: ' rel', color: C.param },
    { text: '=', color: C.text },
    { text: '"stylesheet"', color: C.string },
  ],
  [
    { text: '    href', color: C.param },
    { text: '=', color: C.text },
    { text: '"/assets/layout.css"', color: C.string },
    { text: ' />', color: C.text },
  ],
  [
    { text: '  <', color: C.text },
    { text: 'link', color: C.component },
    { text: ' rel', color: C.param },
    { text: '=', color: C.text },
    { text: '"stylesheet"', color: C.string },
  ],
  [
    { text: '    href', color: C.param },
    { text: '=', color: C.text },
    { text: '"/assets/page.css"', color: C.string },
    { text: ' />', color: C.text },
  ],
  [
    { text: '</', color: C.text },
    { text: 'head', color: C.component },
    { text: '>', color: C.text },
  ],
]

// html source tokens for inline loading
const INLINE_HTML: CodeToken[][] = [
  [
    { text: '<', color: C.text },
    { text: 'head', color: C.component },
    { text: '>', color: C.text },
  ],
  [
    { text: '  <', color: C.text },
    { text: 'style', color: C.component },
    { text: ' id', color: C.param },
    { text: '=', color: C.text },
    { text: '"__one_css_0"', color: C.string },
    { text: '>', color: C.text },
  ],
  [
    { text: '    .layout { ', color: C.text },
    { text: 'display', color: C.param },
    { text: ': flex; ... }', color: C.text },
  ],
  [
    { text: '  </', color: C.text },
    { text: 'style', color: C.component },
    { text: '>', color: C.text },
  ],
  [
    { text: '  <', color: C.text },
    { text: 'style', color: C.component },
    { text: ' id', color: C.param },
    { text: '=', color: C.text },
    { text: '"__one_css_1"', color: C.string },
    { text: '>', color: C.text },
  ],
  [
    { text: '    .page { ', color: C.text },
    { text: 'padding', color: C.param },
    { text: ': 20px; ... }', color: C.text },
  ],
  [
    { text: '  </', color: C.text },
    { text: 'style', color: C.component },
    { text: '>', color: C.text },
  ],
  [
    { text: '</', color: C.text },
    { text: 'head', color: C.component },
    { text: '>', color: C.text },
  ],
]

const HTMLDocCard: React.FC<{
  title: string
  mode: 'standard' | 'inline'
  htmlLines: CodeToken[][]
  timeline: TimelineEntry[]
  lcpTime: string
  lcpColor: string
  badge?: string
}> = ({ title, mode, htmlLines, timeline, lcpTime, lcpColor, badge }) => (
  <div
    style={{
      width: 500,
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
        background: mode === 'standard' ? '#fef2f2' : '#f0fdf4',
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
          color: mode === 'standard' ? '#991b1b' : '#166534',
        }}
      >
        {title}
      </span>
    </div>

    {/* html source preview */}
    <div
      style={{
        padding: '10px 14px',
        borderBottom: '1px solid #f0f0f0',
      }}
    >
      {htmlLines.map((line, li) => (
        <div
          key={li}
          style={{
            fontFamily: MONO,
            fontSize: 12,
            lineHeight: 1.55,
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

    {/* render timeline */}
    <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 5 }}>
      <span
        style={{
          fontSize: 9,
          fontFamily: UI,
          fontWeight: 700,
          color: '#6b7280',
          textTransform: 'uppercase',
          letterSpacing: 0.5,
          marginBottom: 2,
        }}
      >
        Render Timeline
      </span>
      {timeline.map((entry, i) => (
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
              fontSize: 10,
              fontFamily: MONO,
              color: '#57606a',
              minWidth: 68,
            }}
          >
            {entry.label}
          </span>
          <div
            style={{
              flex: 1,
              height: 14,
              borderRadius: 3,
              background: '#f3f4f6',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                position: 'absolute',
                left: `${entry.start}%`,
                width: `${entry.end - entry.start}%`,
                height: '100%',
                borderRadius: 3,
                background: entry.color,
                opacity: 0.8,
                display: 'flex',
                alignItems: 'center',
                padding: '0 4px',
              }}
            >
              {entry.tag && (
                <span
                  style={{
                    fontSize: 7,
                    fontFamily: MONO,
                    fontWeight: 700,
                    color: '#fff',
                  }}
                >
                  {entry.tag}
                </span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>

    {/* lcp metric + badge */}
    <div
      style={{
        padding: '6px 14px 10px',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}
    >
      <div
        style={{
          padding: '4px 10px',
          borderRadius: 5,
          background: lcpColor === '#22c55e' ? '#f0fdf4' : '#fef2f2',
          border: `1px solid ${lcpColor === '#22c55e' ? '#bbf7d0' : '#fecaca'}`,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        <span
          style={{
            fontSize: 9,
            fontFamily: UI,
            fontWeight: 700,
            color: '#6b7280',
            textTransform: 'uppercase',
          }}
        >
          LCP
        </span>
        <span
          style={{
            fontSize: 15,
            fontFamily: MONO,
            fontWeight: 700,
            color: lcpColor,
          }}
        >
          {lcpTime}
        </span>
      </div>
      {badge && (
        <div
          style={{
            padding: '4px 10px',
            borderRadius: 5,
            background: '#f0fdf4',
            border: '1px solid #bbf7d0',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
            <path
              d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"
              fill="#22c55e"
              stroke="#16a34a"
              strokeWidth="1"
            />
          </svg>
          <span style={{ fontSize: 10, fontFamily: UI, fontWeight: 600, color: '#166534' }}>
            {badge}
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

export const LCP_OPTIMIZATION_WINDOW_DURATION = 930

export const LCPOptimizationWindowScene: React.FC = () => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const TOTAL = LCP_OPTIMIZATION_WINDOW_DURATION

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

  // === STAGE 1: before/after inline CSS ===
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

  // red pulse on blocking CSS
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
              top: 230,
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
                CSS Inlining — LCP Optimization
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
                Inline Layout CSS
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

                {/* stage 1: before → after inline CSS */}
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
                      Eliminate render-blocking CSS requests...
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                      {/* before: link tags */}
                      <div style={{ opacity: s1LeftOpacity, position: 'relative' }}>
                        <HTMLDocCard
                          title="Standard CSS Loading"
                          mode="standard"
                          htmlLines={STANDARD_HTML}
                          timeline={STANDARD_TIMELINE}
                          lcpTime="2.8s"
                          lcpColor="#ef4444"
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

                      {/* arrow with config label */}
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
                          inlineLayoutCSS
                        </span>
                      </div>

                      {/* after: style tags */}
                      <div style={{ opacity: s1ROp, transform: `scale(${s1RSc})` }}>
                        <HTMLDocCard
                          title="Inline CSS Loading"
                          mode="inline"
                          htmlLines={INLINE_HTML}
                          timeline={INLINE_TIMELINE}
                          lcpTime="1.2s"
                          lcpColor="#22c55e"
                          badge="Zero extra requests"
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
                      30+% faster Lighthouse scores
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
                    {[CONFIG_SNIPPET, HYDRATION_SNIPPET].map((snippet, si) => (
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
