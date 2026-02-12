import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion'

import { FakeDesktopScene } from './FakeDesktopScene'
import { MiniBrowser } from './RoutingWindowScene'

const MONO = "'SF Mono', 'Fira Code', 'Cascadia Code', monospace"
const UI = "'Inter', -apple-system, 'Segoe UI', Roboto, sans-serif"

// painting icon is 3rd in left column (index 2)
const CURSOR_START = { x: 700, y: 500 }
const ICON_CENTER = { x: 68, y: 261 }

// timeline (frames at 60fps)
const MOVE_START = 8
const MOVE_END = 35
const CLICK = 40
const WINDOW_OPEN = 52

// stage timeline (boss-approved)
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

const clamp = {
  extrapolateLeft: 'clamp' as const,
  extrapolateRight: 'clamp' as const,
}

// === CODE SNIPPETS (verified from ONE source) ===

export const LAYOUT_SNIPPET: CodeSnippet = {
  title: '_layout.tsx',
  lines: [
    [
      { text: 'import ', color: C.keyword },
      { text: '{ ', color: C.text },
      { text: 'Stack', color: C.component },
      { text: ', ', color: C.text },
      { text: 'Protected', color: C.component },
      { text: ' } ', color: C.text },
      { text: 'from ', color: C.keyword },
      { text: "'one'", color: C.string },
    ],
    [],
    [
      { text: 'export ', color: C.keyword },
      { text: 'default ', color: C.keyword },
      { text: 'function ', color: C.keyword },
      { text: 'Layout', color: C.func },
      { text: '() {', color: C.text },
    ],
    [
      { text: '  const ', color: C.keyword },
      { text: '{ ', color: C.text },
      { text: 'isAuthed', color: C.param },
      { text: ' } = ', color: C.text },
      { text: 'useAuth', color: C.func },
      { text: '()', color: C.text },
    ],
    [
      { text: '  return ', color: C.keyword },
      { text: '(', color: C.text },
    ],
    [
      { text: '    <', color: C.text },
      { text: 'Stack', color: C.component },
      { text: '>', color: C.text },
    ],
    [
      { text: '      <', color: C.text },
      { text: 'Stack.Screen', color: C.component },
      { text: ' name', color: C.param },
      { text: '=', color: C.text },
      { text: '"login"', color: C.string },
      { text: ' />', color: C.text },
    ],
    [
      { text: '      <', color: C.text },
      { text: 'Protected', color: C.component },
      { text: ' guard', color: C.param },
      { text: '={', color: C.text },
      { text: 'isAuthed', color: C.param },
      { text: '}>', color: C.text },
    ],
    [
      { text: '        <', color: C.text },
      { text: 'Stack.Screen', color: C.component },
      { text: ' name', color: C.param },
      { text: '=', color: C.text },
      { text: '"dashboard"', color: C.string },
      { text: ' />', color: C.text },
    ],
    [
      { text: '        <', color: C.text },
      { text: 'Stack.Screen', color: C.component },
      { text: ' name', color: C.param },
      { text: '=', color: C.text },
      { text: '"settings"', color: C.string },
      { text: ' />', color: C.text },
    ],
    [
      { text: '      </', color: C.text },
      { text: 'Protected', color: C.component },
      { text: '>', color: C.text },
    ],
    [
      { text: '    </', color: C.text },
      { text: 'Stack', color: C.component },
      { text: '>', color: C.text },
    ],
    [{ text: '  )', color: C.text }],
    [{ text: '}', color: C.text }],
  ],
}

export const MIDDLEWARE_SNIPPET: CodeSnippet = {
  title: '_middleware.ts',
  lines: [
    [
      { text: 'import ', color: C.keyword },
      { text: '{ ', color: C.text },
      { text: 'createMiddleware', color: C.func },
      { text: ', ', color: C.text },
      { text: 'redirect', color: C.func },
      { text: ' } ', color: C.text },
      { text: 'from ', color: C.keyword },
      { text: "'one'", color: C.string },
    ],
    [],
    [
      { text: 'export ', color: C.keyword },
      { text: 'default ', color: C.keyword },
      { text: 'createMiddleware', color: C.func },
      { text: '(({ ', color: C.text },
      { text: 'request', color: C.param },
      { text: ' }) => {', color: C.text },
    ],
    [
      { text: '  const ', color: C.keyword },
      { text: 'token = request.headers.', color: C.text },
      { text: 'get', color: C.func },
      { text: '(', color: C.text },
      { text: "'authorization'", color: C.string },
      { text: ')', color: C.text },
    ],
    [],
    [
      { text: '  if ', color: C.keyword },
      { text: '(!token) {', color: C.text },
    ],
    [
      { text: '    return ', color: C.keyword },
      { text: 'redirect', color: C.func },
      { text: '(', color: C.text },
      { text: "'/login'", color: C.string },
      { text: ')', color: C.text },
    ],
    [{ text: '  }', color: C.text }],
    [{ text: '})', color: C.text }],
  ],
}

export const SNIPPET_1 = LAYOUT_SNIPPET
export const SNIPPET_2 = MIDDLEWARE_SNIPPET

// === VISUAL COMPONENTS ===

const ROUTE_ENTRIES = [
  { path: '/login', label: 'Login', isProtected: false },
  { path: '/dashboard', label: 'Dashboard', isProtected: true },
  { path: '/settings', label: 'Settings', isProtected: true },
]

const RouteGuardCard: React.FC<{ shieldGlow: number }> = ({ shieldGlow }) => (
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
        Route Guard
      </span>
      <span style={{ fontSize: 12, fontFamily: MONO, color: '#6e7781' }}>
        guard = false
      </span>
    </div>
    {ROUTE_ENTRIES.map((route, i) => (
      <div
        key={i}
        style={{
          padding: '16px 16px',
          borderBottom: i < ROUTE_ENTRIES.length - 1 ? '1px solid #f0f0f0' : 'none',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          position: 'relative',
          background:
            route.isProtected && shieldGlow > 0
              ? `rgba(239, 68, 68, ${0.05 * shieldGlow})`
              : 'transparent',
          borderRadius: i === ROUTE_ENTRIES.length - 1 ? '0 0 10px 10px' : 0,
        }}
      >
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            background: route.isProtected ? '#fecaca' : '#dcfce7',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {route.isProtected ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="11" width="18" height="12" rx="2" fill="#ef4444" />
              <path
                d="M7 11V7a5 5 0 0110 0v4"
                stroke="#ef4444"
                strokeWidth="2"
                fill="none"
              />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path
                d="M20 6L9 17l-5-5"
                stroke="#22c55e"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span
            style={{
              fontSize: 16,
              fontFamily: UI,
              fontWeight: 600,
              color: route.isProtected ? '#6b7280' : '#1f2328',
            }}
          >
            {route.label}
          </span>
          <span style={{ fontSize: 13, fontFamily: MONO, color: '#9ca3af' }}>
            {route.path}
          </span>
        </div>
        {route.isProtected && (
          <span
            style={{
              fontSize: 11,
              fontFamily: UI,
              fontWeight: 700,
              color: '#ef4444',
              marginLeft: 'auto',
              textTransform: 'uppercase',
              letterSpacing: 1,
            }}
          >
            Blocked
          </span>
        )}
        {route.isProtected && shieldGlow > 0 && (
          <div
            style={{
              position: 'absolute',
              inset: -1,
              border: '1.5px solid rgba(239, 68, 68, 0.3)',
              boxShadow: `0 0 ${10 * shieldGlow}px rgba(239, 68, 68, ${0.2 * shieldGlow})`,
              opacity: shieldGlow,
              pointerEvents: 'none',
            }}
          />
        )}
      </div>
    ))}
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

export const PROTECTED_ROUTES_WINDOW_DURATION = 1340

export const ProtectedRoutesWindowScene: React.FC = () => {
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

  // close animation timeline
  const CLOSE_CURSOR_START = 1280
  const CLOSE_CURSOR_END = 1305
  const CLOSE_CLICK = 1309
  const WIN_CLOSE_START = 1313
  const WIN_CLOSE_END = 1333

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
  const ZOOM_OUT_START = 1240
  const ZOOM_OUT_END = 1277
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

  // === STAGE 1: Protected Guard ===
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

  // shield glow on protected routes
  const SHIELD_START = 60
  const shieldGlow = interpolate(s1L, [SHIELD_START, SHIELD_START + 15], [0, 1], clamp)

  // arrow fades in 1.5s after glow
  const s1ArrOp = interpolate(s1L, [150, 160], [0, 1], clamp)

  // right element springs in after arrow
  const s1RSp = spring({
    frame: Math.max(0, s1L - 156),
    fps,
    config: { damping: 18, stiffness: 120 },
    durationInFrames: 25,
  })
  const s1RSc = interpolate(s1RSp, [0, 1], [0.85, 1])
  const s1ROp = interpolate(s1RSp, [0, 0.3], [0, 1], { extrapolateRight: 'clamp' })

  // label fades in 1.5s after right element
  const s1LblOp = interpolate(s1L, [270, 283], [0, 1], clamp)

  // === STAGE 2: Middleware Redirect ===
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
  const s2LeftOpacity = interpolate(s2L, [30, 42], [0, 1], clamp)

  // red flash on blocked browser
  const REDIRECT_START = 60
  const redirectFlash = interpolate(
    s2L,
    [REDIRECT_START, REDIRECT_START + 10, REDIRECT_START + 25],
    [0, 0.6, 0],
    clamp
  )

  // arrow
  const s2ArrOp = interpolate(s2L, [150, 160], [0, 1], clamp)

  // right element
  const s2RSp = spring({
    frame: Math.max(0, s2L - 156),
    fps,
    config: { damping: 18, stiffness: 120 },
    durationInFrames: 25,
  })
  const s2RSc = interpolate(s2RSp, [0, 1], [0.85, 1])
  const s2ROp = interpolate(s2RSp, [0, 0.3], [0, 1], { extrapolateRight: 'clamp' })

  // label
  const s2LblOp = interpolate(s2L, [270, 283], [0, 1], clamp)

  // === STAGE 3: Code ===
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
                Protected Routes
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
                Protected Routes
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

                {/* stage 1: protected guard */}
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
                      When a user isn't authenticated...
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                      {/* route guard card */}
                      <div style={{ opacity: s1LeftOpacity }}>
                        <RouteGuardCard shieldGlow={shieldGlow} />
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

                      {/* blocked dashboard browser */}
                      <div style={{ opacity: s1ROp, transform: `scale(${s1RSc})` }}>
                        <MiniBrowser url="app.com/dashboard" width={480} height={360}>
                          <div
                            style={{
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'center',
                              height: '100%',
                              background: '#fef2f2',
                            }}
                          >
                            <div
                              style={{
                                width: 64,
                                height: 64,
                                borderRadius: '50%',
                                background: '#fecaca',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginBottom: 14,
                              }}
                            >
                              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                                <rect
                                  x="3"
                                  y="11"
                                  width="18"
                                  height="12"
                                  rx="2"
                                  fill="#ef4444"
                                />
                                <path
                                  d="M7 11V7a5 5 0 0110 0v4"
                                  stroke="#ef4444"
                                  strokeWidth="2"
                                  fill="none"
                                />
                              </svg>
                            </div>
                            <div
                              style={{
                                fontSize: 16,
                                fontFamily: UI,
                                fontWeight: 700,
                                color: '#991b1b',
                              }}
                            >
                              Access Denied
                            </div>
                            <div
                              style={{
                                fontSize: 12,
                                fontFamily: UI,
                                color: '#b91c1c',
                                marginTop: 6,
                              }}
                            >
                              Screen removed from navigator
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
                        opacity: s1LblOp,
                      }}
                    >
                      Guard controls which screens are available
                    </div>
                  </div>
                )}

                {/* stage 2: middleware redirect */}
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
                        opacity: s2LeftOpacity,
                      }}
                    >
                      Server middleware intercepts the request...
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                      {/* blocked dashboard attempt */}
                      <div style={{ opacity: s2LeftOpacity, position: 'relative' }}>
                        <MiniBrowser url="app.com/dashboard" width={480} height={360}>
                          <div
                            style={{
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'center',
                              height: '100%',
                            }}
                          >
                            <div
                              style={{
                                fontSize: 56,
                                fontWeight: 700,
                                color: '#dc2626',
                                fontFamily: UI,
                              }}
                            >
                              401
                            </div>
                            <div
                              style={{
                                fontSize: 14,
                                fontFamily: UI,
                                fontWeight: 600,
                                color: '#dc2626',
                                marginTop: 8,
                              }}
                            >
                              Unauthorized
                            </div>
                          </div>
                          {/* red flash overlay */}
                          {redirectFlash > 0 && (
                            <div
                              style={{
                                position: 'absolute',
                                inset: 0,
                                background: 'rgba(239, 68, 68, 0.15)',
                                opacity: redirectFlash,
                                pointerEvents: 'none',
                              }}
                            />
                          )}
                        </MiniBrowser>
                      </div>

                      {/* arrow with redirect label */}
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: 4,
                          opacity: s2ArrOp,
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
                          redirect
                        </span>
                      </div>

                      {/* login page */}
                      <div style={{ opacity: s2ROp, transform: `scale(${s2RSc})` }}>
                        <MiniBrowser url="app.com/login" width={480} height={360}>
                          <div
                            style={{
                              padding: 24,
                              display: 'flex',
                              flexDirection: 'column',
                              gap: 14,
                              alignItems: 'center',
                              justifyContent: 'center',
                              height: '100%',
                            }}
                          >
                            <div
                              style={{
                                fontSize: 18,
                                fontFamily: UI,
                                fontWeight: 700,
                                color: '#1f2328',
                                marginBottom: 8,
                              }}
                            >
                              Sign In
                            </div>
                            {/* email field */}
                            <div
                              style={{
                                width: '75%',
                                height: 36,
                                borderRadius: 6,
                                border: '1px solid #d0d7de',
                                background: '#f6f8fa',
                                display: 'flex',
                                alignItems: 'center',
                                padding: '0 12px',
                              }}
                            >
                              <span
                                style={{
                                  fontSize: 13,
                                  fontFamily: UI,
                                  color: '#9ca3af',
                                }}
                              >
                                Email
                              </span>
                            </div>
                            {/* password field */}
                            <div
                              style={{
                                width: '75%',
                                height: 36,
                                borderRadius: 6,
                                border: '1px solid #d0d7de',
                                background: '#f6f8fa',
                                display: 'flex',
                                alignItems: 'center',
                                padding: '0 12px',
                              }}
                            >
                              <span
                                style={{
                                  fontSize: 13,
                                  fontFamily: UI,
                                  color: '#9ca3af',
                                }}
                              >
                                Password
                              </span>
                            </div>
                            {/* login button */}
                            <div
                              style={{
                                width: '75%',
                                height: 36,
                                borderRadius: 6,
                                background: '#3b82f6',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginTop: 4,
                              }}
                            >
                              <span
                                style={{
                                  fontSize: 14,
                                  fontFamily: UI,
                                  fontWeight: 600,
                                  color: '#fff',
                                }}
                              >
                                Log In
                              </span>
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
                        opacity: s2LblOp,
                      }}
                    >
                      Middleware redirects before the page loads
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
                    {[LAYOUT_SNIPPET, MIDDLEWARE_SNIPPET].map((snippet, si) => (
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
