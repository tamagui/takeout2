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

// === CODE SNIPPETS (verified from ONE source: packages/one/src/validateParams.ts) ===

const VALIDATE_PARAMS_SNIPPET: CodeSnippet = {
  title: 'posts/[id]+page.tsx',
  lines: [
    [
      { text: 'import ', color: C.keyword },
      { text: '{ ', color: C.text },
      { text: 'z', color: C.func },
      { text: ' } ', color: C.text },
      { text: 'from ', color: C.keyword },
      { text: "'zod'", color: C.string },
    ],
    [
      { text: 'import ', color: C.keyword },
      { text: '{ ', color: C.text },
      { text: 'useParams', color: C.func },
      { text: ' } ', color: C.text },
      { text: 'from ', color: C.keyword },
      { text: "'one'", color: C.string },
    ],
    [],
    [
      { text: 'export ', color: C.keyword },
      { text: 'const ', color: C.keyword },
      { text: 'validateParams', color: C.param },
      { text: ' = z.', color: C.text },
      { text: 'object', color: C.func },
      { text: '({', color: C.text },
    ],
    [
      { text: '  ', color: C.text },
      { text: 'id', color: C.param },
      { text: ': z.', color: C.text },
      { text: 'string', color: C.func },
      { text: '().', color: C.text },
      { text: 'uuid', color: C.func },
      { text: '(', color: C.text },
      { text: "'Invalid ID'", color: C.string },
      { text: '),', color: C.text },
    ],
    [{ text: '})', color: C.text }],
    [],
    [
      { text: 'export ', color: C.keyword },
      { text: 'default ', color: C.keyword },
      { text: 'function ', color: C.keyword },
      { text: 'PostPage', color: C.func },
      { text: '() {', color: C.text },
    ],
    [
      { text: '  const ', color: C.keyword },
      { text: '{ ', color: C.text },
      { text: 'id', color: C.param },
      { text: ' } = ', color: C.text },
      { text: 'useParams', color: C.func },
      { text: '()', color: C.text },
    ],
    [
      { text: '  ', color: C.text },
      { text: '// id is guaranteed valid UUID', color: C.punct },
    ],
    [
      { text: '  return ', color: C.keyword },
      { text: '<', color: C.text },
      { text: 'Post', color: C.component },
      { text: ' id', color: C.param },
      { text: '={id} />', color: C.text },
    ],
    [{ text: '}', color: C.text }],
  ],
}

const VALIDATE_ROUTE_SNIPPET: CodeSnippet = {
  title: 'products/[slug]+page.tsx',
  lines: [
    [
      { text: 'import ', color: C.keyword },
      { text: '{ ', color: C.text },
      { text: 'z', color: C.func },
      { text: ' } ', color: C.text },
      { text: 'from ', color: C.keyword },
      { text: "'zod'", color: C.string },
    ],
    [],
    [
      { text: 'export ', color: C.keyword },
      { text: 'const ', color: C.keyword },
      { text: 'validateParams', color: C.param },
      { text: ' = z.', color: C.text },
      { text: 'object', color: C.func },
      { text: '({', color: C.text },
    ],
    [
      { text: '  ', color: C.text },
      { text: 'slug', color: C.param },
      { text: ': z.', color: C.text },
      { text: 'string', color: C.func },
      { text: '().', color: C.text },
      { text: 'min', color: C.func },
      { text: '(1),', color: C.text },
    ],
    [{ text: '})', color: C.text }],
    [],
    [
      { text: 'export ', color: C.keyword },
      { text: 'async ', color: C.keyword },
      { text: 'function ', color: C.keyword },
      { text: 'validateRoute', color: C.func },
      { text: '({ ', color: C.text },
      { text: 'params', color: C.param },
      { text: ' }) {', color: C.text },
    ],
    [
      { text: '  const ', color: C.keyword },
      { text: 'product', color: C.param },
      { text: ' = ', color: C.text },
      { text: 'await ', color: C.keyword },
      { text: 'db.', color: C.text },
      { text: 'findProduct', color: C.func },
      { text: '(params.', color: C.text },
      { text: 'slug', color: C.param },
      { text: ')', color: C.text },
    ],
    [
      { text: '  if ', color: C.keyword },
      { text: '(!product) ', color: C.text },
      { text: 'return ', color: C.keyword },
      { text: '{', color: C.text },
    ],
    [
      { text: '    ', color: C.text },
      { text: 'valid', color: C.param },
      { text: ': ', color: C.text },
      { text: 'false', color: C.keyword },
      { text: ',', color: C.text },
    ],
    [
      { text: '    ', color: C.text },
      { text: 'error', color: C.param },
      { text: ': ', color: C.text },
      { text: "'Product not found'", color: C.string },
    ],
    [
      { text: '  }', color: C.text },
    ],
    [
      { text: '  return ', color: C.keyword },
      { text: '{ ', color: C.text },
      { text: 'valid', color: C.param },
      { text: ': ', color: C.text },
      { text: 'true', color: C.keyword },
      { text: ' }', color: C.text },
    ],
    [{ text: '}', color: C.text }],
  ],
}

// === VISUAL COMPONENTS ===

// zod schema card with validation rules
const ZOD_RULES = [
  { field: 'id', rule: 'z.string().uuid()', status: 'fail' as const },
  { field: 'slug', rule: 'z.string().min(1)', status: 'pass' as const },
]

const SchemaCard: React.FC<{
  showValidation: boolean
  localFrame: number
}> = ({ showValidation, localFrame }) => (
  <div
    style={{
      width: 460,
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
        background: '#f6f8fa',
        borderBottom: '1px solid #e0e0e0',
        display: 'flex',
        alignItems: 'center',
        padding: '0 16px',
        gap: 8,
      }}
    >
      <span style={{ fontSize: 14, fontFamily: UI, fontWeight: 700, color: '#1f2328' }}>
        validateParams
      </span>
      <span style={{ fontSize: 11, fontFamily: MONO, color: '#6e7781' }}>
        Zod schema
      </span>
    </div>

    {/* URL bar */}
    <div
      style={{
        padding: '12px 18px',
        borderBottom: '1px solid #f0f0f0',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}
    >
      <span style={{ fontSize: 11, fontFamily: UI, fontWeight: 600, color: '#8b949e', textTransform: 'uppercase', letterSpacing: 0.5 }}>
        URL
      </span>
      <span style={{ fontSize: 14, fontFamily: MONO, color: '#57606a' }}>
        /posts/
      </span>
      <span
        style={{
          fontSize: 14,
          fontFamily: MONO,
          fontWeight: 600,
          color: showValidation ? '#cf222e' : '#1f2328',
          background: showValidation ? 'rgba(207, 34, 46, 0.08)' : 'rgba(59, 130, 246, 0.06)',
          padding: '2px 8px',
          borderRadius: 4,
          border: showValidation ? '1px solid rgba(207, 34, 46, 0.2)' : '1px solid rgba(59, 130, 246, 0.15)',
        }}
      >
        abc-not-uuid
      </span>
    </div>

    {/* schema rules */}
    {ZOD_RULES.map((rule, i) => {
      const revealOp = interpolate(
        localFrame,
        [i * 15, i * 15 + 10],
        [0, 1],
        clamp
      )
      const isValidating = showValidation && revealOp > 0.5
      const isFail = isValidating && rule.status === 'fail'
      const isPass = isValidating && rule.status === 'pass'

      return (
        <div
          key={i}
          style={{
            padding: '14px 18px',
            borderBottom: i < ZOD_RULES.length - 1 ? '1px solid #f0f0f0' : 'none',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            opacity: revealOp,
            background: isFail
              ? 'rgba(207, 34, 46, 0.04)'
              : isPass
                ? 'rgba(34, 197, 94, 0.04)'
                : 'transparent',
          }}
        >
          {/* status indicator */}
          <div
            style={{
              width: 20,
              height: 20,
              borderRadius: '50%',
              background: isFail
                ? '#cf222e'
                : isPass
                  ? '#22c55e'
                  : '#e5e7eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 11,
              color: '#fff',
              fontWeight: 700,
              flexShrink: 0,
            }}
          >
            {isFail ? '\u2717' : isPass ? '\u2713' : ''}
          </div>
          <span
            style={{
              fontSize: 14,
              fontFamily: MONO,
              fontWeight: 600,
              color: isFail ? '#cf222e' : isPass ? '#22c55e' : C.param,
              minWidth: 50,
            }}
          >
            {rule.field}
          </span>
          <span
            style={{
              fontSize: 13,
              fontFamily: MONO,
              color: '#6e7781',
              flex: 1,
            }}
          >
            {rule.rule}
          </span>
        </div>
      )
    })}
  </div>
)

// validation error card
const ErrorCard: React.FC = () => (
  <div
    style={{
      width: 420,
      background: '#fff',
      borderRadius: 10,
      border: '1px solid #fecaca',
      overflow: 'hidden',
    }}
  >
    <div
      style={{
        height: 40,
        background: 'rgba(207, 34, 46, 0.06)',
        borderBottom: '1px solid #fecaca',
        display: 'flex',
        alignItems: 'center',
        padding: '0 16px',
        gap: 8,
      }}
    >
      <div
        style={{
          width: 20,
          height: 20,
          borderRadius: '50%',
          background: '#cf222e',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 11,
          color: '#fff',
          fontWeight: 700,
          flexShrink: 0,
        }}
      >
        !
      </div>
      <span style={{ fontSize: 14, fontFamily: UI, fontWeight: 700, color: '#cf222e' }}>
        ParamValidationError
      </span>
    </div>

    {/* error details */}
    <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* message */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span style={{ fontSize: 10, fontFamily: UI, fontWeight: 600, color: '#8b949e', textTransform: 'uppercase', letterSpacing: 0.5 }}>
          Message
        </span>
        <span style={{ fontSize: 14, fontFamily: MONO, color: '#cf222e', lineHeight: 1.4 }}>
          Invalid params for /posts/[id]
        </span>
      </div>

      {/* issues */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span style={{ fontSize: 10, fontFamily: UI, fontWeight: 600, color: '#8b949e', textTransform: 'uppercase', letterSpacing: 0.5 }}>
          Issues
        </span>
        <div
          style={{
            background: '#fef2f2',
            borderRadius: 6,
            padding: '10px 14px',
            border: '1px solid #fecaca',
          }}
        >
          <div style={{ fontFamily: MONO, fontSize: 12, color: '#991b1b', lineHeight: 1.6 }}>
            <span style={{ color: '#6e7781' }}>id:</span> "abc-not-uuid"
          </div>
          <div style={{ fontFamily: MONO, fontSize: 12, color: '#991b1b', lineHeight: 1.6, marginTop: 2 }}>
            <span style={{ color: '#cf222e', fontWeight: 600 }}>{'\u2192'}</span> Invalid ID — expected UUID format
          </div>
        </div>
      </div>

      {/* route code */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: 10, fontFamily: MONO, color: '#8b949e', background: '#f6f8fa', padding: '2px 6px', borderRadius: 4 }}>
          routerCode
        </span>
        <span style={{ fontSize: 12, fontFamily: MONO, color: '#57606a' }}>
          VALIDATE_PARAMS
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

export const ROUTE_VALIDATION_WINDOW_DURATION = TOTAL

export const RouteValidationWindowScene: React.FC = () => {
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

  // close animation timeline (last 100 frames)
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

  // === STAGE 1: schema card → error card ===
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

  // validation glow — param turns red
  const VALIDATION_START = 60
  const showValidation = s1L >= VALIDATION_START + 15

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

  // === STAGE 2: Code ===
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
                Route Validation
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
                Route Validation
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

                {/* stage 1: schema validation → error */}
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
                      Invalid params caught before rendering...
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                      {/* schema card with URL */}
                      <div style={{ opacity: s1LeftOpacity }}>
                        <SchemaCard
                          showValidation={showValidation}
                          localFrame={Math.max(0, s1L - 30)}
                        />
                      </div>

                      {/* arrow */}
                      <div
                        style={{
                          fontSize: 36,
                          color: '#cf222e',
                          fontWeight: 700,
                          opacity: s1ArrOp,
                        }}
                      >
                        {'\u2192'}
                      </div>

                      {/* error card */}
                      <div style={{ opacity: s1ROp, transform: `scale(${s1RSc})` }}>
                        <ErrorCard />
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
                      Zod validates — errors never reach your page
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
                    {[VALIDATE_PARAMS_SNIPPET, VALIDATE_ROUTE_SNIPPET].map((snippet, si) => (
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
