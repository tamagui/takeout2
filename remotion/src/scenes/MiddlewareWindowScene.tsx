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

// refresh.png icon is 4th in left column (index 3)
const CURSOR_START = { x: 700, y: 500 }
const ICON_CENTER = { x: 68, y: 361 }

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

const AUTH_MIDDLEWARE_SNIPPET: CodeSnippet = {
  title: 'app/_middleware.ts',
  lines: [
    [
      { text: 'import ', color: C.keyword },
      { text: '{ ', color: C.text },
      { text: 'createMiddleware', color: C.func },
      { text: ' } ', color: C.text },
      { text: 'from ', color: C.keyword },
      { text: "'one'", color: C.string },
    ],
    [],
    [
      { text: 'export ', color: C.keyword },
      { text: 'default ', color: C.keyword },
      { text: 'createMiddleware', color: C.func },
      { text: '(', color: C.text },
    ],
    [
      { text: '  ', color: C.text },
      { text: 'async ', color: C.keyword },
      { text: '({ ', color: C.text },
      { text: 'request', color: C.param },
      { text: ', ', color: C.text },
      { text: 'next', color: C.param },
      { text: ', ', color: C.text },
      { text: 'context', color: C.param },
      { text: ' }) => {', color: C.text },
    ],
    [
      { text: '    ', color: C.text },
      { text: 'const ', color: C.keyword },
      { text: 'token', color: C.text },
      { text: ' = ', color: C.text },
      { text: 'request', color: C.text },
      { text: '.', color: C.punct },
      { text: 'headers', color: C.param },
      { text: '.', color: C.punct },
      { text: 'get', color: C.func },
      { text: '(', color: C.text },
      { text: "'authorization'", color: C.string },
      { text: ')', color: C.text },
    ],
    [
      { text: '    ', color: C.text },
      { text: 'context', color: C.text },
      { text: '.', color: C.punct },
      { text: 'user', color: C.param },
      { text: ' = ', color: C.text },
      { text: 'await ', color: C.keyword },
      { text: 'verifyToken', color: C.func },
      { text: '(token)', color: C.text },
    ],
    [
      { text: '    ', color: C.text },
      { text: 'return ', color: C.keyword },
      { text: 'next', color: C.func },
      { text: '()', color: C.text },
    ],
    [{ text: '  }', color: C.text }],
    [{ text: ')', color: C.text }],
  ],
}

const DASHBOARD_MIDDLEWARE_SNIPPET: CodeSnippet = {
  title: 'app/dashboard/_middleware.ts',
  lines: [
    [
      { text: 'import ', color: C.keyword },
      { text: '{ ', color: C.text },
      { text: 'createMiddleware', color: C.func },
      { text: ' } ', color: C.text },
      { text: 'from ', color: C.keyword },
      { text: "'one'", color: C.string },
    ],
    [],
    [
      { text: 'export ', color: C.keyword },
      { text: 'default ', color: C.keyword },
      { text: 'createMiddleware', color: C.func },
      { text: '(', color: C.text },
    ],
    [
      { text: '  ', color: C.text },
      { text: 'async ', color: C.keyword },
      { text: '({ ', color: C.text },
      { text: 'request', color: C.param },
      { text: ', ', color: C.text },
      { text: 'next', color: C.param },
      { text: ', ', color: C.text },
      { text: 'context', color: C.param },
      { text: ' }) => {', color: C.text },
    ],
    [
      { text: '    // context.user set by parent', color: C.punct },
    ],
    [
      { text: '    ', color: C.text },
      { text: 'if ', color: C.keyword },
      { text: '(!', color: C.text },
      { text: 'context', color: C.text },
      { text: '.', color: C.punct },
      { text: 'user', color: C.param },
      { text: '?.', color: C.punct },
      { text: 'isAdmin', color: C.param },
      { text: ') {', color: C.text },
    ],
    [
      { text: '      ', color: C.text },
      { text: 'return new ', color: C.keyword },
      { text: 'Response', color: C.component },
      { text: '(', color: C.text },
      { text: "'Forbidden'", color: C.string },
      { text: ', { ', color: C.text },
      { text: 'status', color: C.param },
      { text: ': ', color: C.text },
      { text: '403', color: C.param },
      { text: ' })', color: C.text },
    ],
    [{ text: '    }', color: C.text }],
    [
      { text: '    ', color: C.text },
      { text: 'return ', color: C.keyword },
      { text: 'next', color: C.func },
      { text: '()', color: C.text },
    ],
    [{ text: '  }', color: C.text }],
    [{ text: ')', color: C.text }],
  ],
}

// === STAGE 1 VISUAL COMPONENTS ===

type PipelineStep = {
  label: string
  file: string
  icon: 'shield' | 'lock' | 'check'
  color: string
}

const PIPELINE_STEPS: PipelineStep[] = [
  { label: 'Authenticate', file: '_middleware.ts', icon: 'shield', color: '#3b82f6' },
  { label: 'Authorize', file: 'dashboard/_middleware.ts', icon: 'lock', color: '#8b5cf6' },
  { label: 'Serve Page', file: 'dashboard/index.tsx', icon: 'check', color: '#22c55e' },
]

const ShieldIcon: React.FC<{ color: string }> = ({ color }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path
      d="M12 2L4 6v5c0 5.25 3.4 10.2 8 12 4.6-1.8 8-6.75 8-12V6l-8-4z"
      fill={color}
      fillOpacity={0.15}
      stroke={color}
      strokeWidth="1.5"
    />
    <path d="M9 12l2 2 4-4" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </svg>
)

const LockIcon: React.FC<{ color: string }> = ({ color }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <rect
      x="5"
      y="11"
      width="14"
      height="10"
      rx="2"
      fill={color}
      fillOpacity={0.15}
      stroke={color}
      strokeWidth="1.5"
    />
    <path
      d="M8 11V7a4 4 0 118 0v4"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
)

const CheckIcon: React.FC<{ color: string }> = ({ color }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="9" fill={color} fillOpacity={0.15} stroke={color} strokeWidth="1.5" />
    <path d="M8 12l3 3 5-5" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </svg>
)

const StepIcon: React.FC<{ icon: PipelineStep['icon']; color: string }> = ({
  icon,
  color,
}) => {
  if (icon === 'shield') return <ShieldIcon color={color} />
  if (icon === 'lock') return <LockIcon color={color} />
  return <CheckIcon color={color} />
}

const RequestPipelineCard: React.FC<{ activeStep: number }> = ({ activeStep }) => (
  <div
    style={{
      width: 460,
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
        height: 38,
        background: '#f0f4ff',
        borderBottom: '1px solid #e0e0e0',
        display: 'flex',
        alignItems: 'center',
        padding: '0 16px',
        gap: 8,
      }}
    >
      <span
        style={{
          fontSize: 13,
          fontFamily: UI,
          fontWeight: 700,
          color: '#1e40af',
        }}
      >
        Request Pipeline
      </span>
    </div>

    {/* request badge */}
    <div style={{ padding: '12px 16px 6px', display: 'flex', gap: 8, alignItems: 'center' }}>
      <div
        style={{
          padding: '4px 10px',
          borderRadius: 4,
          background: '#dbeafe',
          fontSize: 11,
          fontFamily: MONO,
          fontWeight: 700,
          color: '#1e40af',
        }}
      >
        GET
      </div>
      <span
        style={{
          fontSize: 13,
          fontFamily: MONO,
          color: '#57606a',
        }}
      >
        /dashboard/settings
      </span>
    </div>

    {/* pipeline steps */}
    <div style={{ padding: '10px 16px 14px', display: 'flex', flexDirection: 'column', gap: 0 }}>
      {PIPELINE_STEPS.map((step, i) => (
        <div key={i}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '8px 10px',
              borderRadius: 6,
              background: i <= activeStep ? `${step.color}08` : 'transparent',
              border: i === activeStep ? `1.5px solid ${step.color}40` : '1.5px solid transparent',
              transition: 'all 0.2s',
            }}
          >
            <StepIcon icon={step.icon} color={i <= activeStep ? step.color : '#d1d5db'} />
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: 13,
                  fontFamily: UI,
                  fontWeight: 600,
                  color: i <= activeStep ? '#1f2328' : '#9ca3af',
                }}
              >
                {step.label}
              </div>
              <div
                style={{
                  fontSize: 10,
                  fontFamily: MONO,
                  color: i <= activeStep ? '#6e7781' : '#d1d5db',
                }}
              >
                {step.file}
              </div>
            </div>
            {i < activeStep && (
              <span style={{ fontSize: 10, fontFamily: MONO, color: '#22c55e', fontWeight: 600 }}>
                next()
              </span>
            )}
            {i === activeStep && (
              <span style={{ fontSize: 10, fontFamily: MONO, color: step.color, fontWeight: 600 }}>
                running
              </span>
            )}
          </div>
          {/* connector arrow */}
          {i < PIPELINE_STEPS.length - 1 && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                padding: '2px 0',
                opacity: i < activeStep ? 1 : 0.3,
              }}
            >
              <svg width="12" height="16" viewBox="0 0 12 16">
                <path
                  d="M6 0 L6 12 M2 8 L6 13 L10 8"
                  fill="none"
                  stroke={i < activeStep ? '#22c55e' : '#d1d5db'}
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          )}
        </div>
      ))}
    </div>
  </div>
)

type ContextEntry = {
  layer: string
  file: string
  data: string
  color: string
}

const CONTEXT_ENTRIES: ContextEntry[] = [
  { layer: 'Root', file: 'app/_middleware.ts', data: '{ user: { id: 1, name: "Ada" } }', color: '#3b82f6' },
  { layer: 'Dashboard', file: 'dashboard/_middleware.ts', data: '{ user: ..., isAdmin: true }', color: '#8b5cf6' },
  { layer: 'Route', file: 'dashboard/settings.tsx', data: 'full context available', color: '#22c55e' },
]

const ContextFlowCard: React.FC = () => (
  <div
    style={{
      width: 460,
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
        height: 38,
        background: '#faf5ff',
        borderBottom: '1px solid #e0e0e0',
        display: 'flex',
        alignItems: 'center',
        padding: '0 16px',
        gap: 8,
      }}
    >
      <span
        style={{
          fontSize: 13,
          fontFamily: UI,
          fontWeight: 700,
          color: '#6b21a8',
        }}
      >
        Shared Context
      </span>
    </div>

    {/* context chain */}
    <div style={{ padding: '12px 16px 14px', display: 'flex', flexDirection: 'column', gap: 0 }}>
      {CONTEXT_ENTRIES.map((entry, i) => (
        <div key={i}>
          <div
            style={{
              padding: '8px 10px',
              borderRadius: 6,
              border: `1px solid ${entry.color}30`,
              background: `${entry.color}06`,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 4,
              }}
            >
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: entry.color,
                }}
              />
              <span
                style={{
                  fontSize: 12,
                  fontFamily: UI,
                  fontWeight: 600,
                  color: '#1f2328',
                }}
              >
                {entry.layer}
              </span>
              <span
                style={{
                  fontSize: 10,
                  fontFamily: MONO,
                  color: '#6e7781',
                }}
              >
                {entry.file}
              </span>
            </div>
            <div
              style={{
                fontSize: 11,
                fontFamily: MONO,
                color: entry.color,
                padding: '3px 8px',
                background: `${entry.color}10`,
                borderRadius: 4,
              }}
            >
              context = {entry.data}
            </div>
          </div>
          {/* connector */}
          {i < CONTEXT_ENTRIES.length - 1 && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '3px 0',
                gap: 4,
              }}
            >
              <svg width="12" height="14" viewBox="0 0 12 14">
                <path
                  d="M6 0 L6 10 M2 7 L6 11 L10 7"
                  fill="none"
                  stroke="#8b5cf6"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span style={{ fontSize: 8, fontFamily: MONO, color: '#8b5cf6', fontWeight: 600 }}>
                context passed
              </span>
            </div>
          )}
        </div>
      ))}

      {/* badge */}
      <div
        style={{
          marginTop: 8,
          padding: '5px 10px',
          borderRadius: 5,
          background: '#faf5ff',
          border: '1px solid #e9d5ff',
          display: 'flex',
          alignItems: 'center',
          gap: 5,
        }}
      >
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
          <path
            d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"
            fill="#8b5cf6"
            stroke="#7c3aed"
            strokeWidth="1"
          />
        </svg>
        <span style={{ fontSize: 10, fontFamily: UI, fontWeight: 600, color: '#6b21a8' }}>
          Mutable object, zero serialization
        </span>
      </div>
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

export const MIDDLEWARE_WINDOW_DURATION = 930

export const MiddlewareWindowScene: React.FC = () => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const TOTAL = MIDDLEWARE_WINDOW_DURATION

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

  // === STAGE 1: request interception + shared context ===
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

  // animate pipeline step highlight (steps progress over time)
  const activeStep = s1L < 60 ? 0 : s1L < 80 ? 1 : 2

  // glow on active step
  const STEP_GLOW_START = 60
  const stepGlow = interpolate(
    s1L,
    [STEP_GLOW_START, STEP_GLOW_START + 10, STEP_GLOW_START + 20],
    [0, 0.5, 0],
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
              top: 330,
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
                Middleware — Request Interception
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
                Middleware
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

                {/* stage 1: pipeline + context flow */}
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
                      Intercept requests, share data across layers...
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                      {/* left: request pipeline */}
                      <div style={{ opacity: s1LeftOpacity, position: 'relative' }}>
                        <RequestPipelineCard activeStep={activeStep} />
                        {/* glow overlay on step transition */}
                        {stepGlow > 0 && (
                          <div
                            style={{
                              position: 'absolute',
                              inset: -1,
                              borderRadius: 10,
                              border: '2px solid rgba(139, 92, 246, 0.4)',
                              boxShadow: `0 0 ${14 * stepGlow}px rgba(139, 92, 246, ${0.3 * stepGlow})`,
                              opacity: stepGlow,
                              pointerEvents: 'none',
                            }}
                          />
                        )}
                      </div>

                      {/* arrow with context label */}
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
                          context
                        </span>
                      </div>

                      {/* right: context flow */}
                      <div style={{ opacity: s1ROp, transform: `scale(${s1RSc})` }}>
                        <ContextFlowCard />
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
                      File-system nesting, zero config
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
                    {[AUTH_MIDDLEWARE_SNIPPET, DASHBOARD_MIDDLEWARE_SNIPPET].map(
                      (snippet, si) => (
                        <CodeCard key={si} snippet={snippet} />
                      )
                    )}
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
