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

// zero sync icon is 4th in left column (index 3)
const CURSOR_START = { x: 700, y: 500 }
const ICON_CENTER = { x: 68, y: 361 }

// timeline (frames at 60fps)
const MOVE_START = 8
const MOVE_END = 35
const CLICK = 40
const WINDOW_OPEN = 52

// stage timeline
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

// === CODE SNIPPETS ===

const HOOK_SNIPPET: CodeSnippet = {
  title: 'edit-profile.tsx',
  lines: [
    [
      { text: 'import ', color: C.keyword },
      { text: '{ ', color: C.text },
      { text: 'useBlocker', color: C.func },
      { text: ' } ', color: C.text },
      { text: 'from ', color: C.keyword },
      { text: "'one'", color: C.string },
    ],
    [],
    [
      { text: 'export ', color: C.keyword },
      { text: 'function ', color: C.keyword },
      { text: 'EditProfile', color: C.func },
      { text: '() {', color: C.text },
    ],
    [
      { text: '  const ', color: C.keyword },
      { text: '[', color: C.text },
      { text: 'isDirty', color: C.param },
      { text: ', ', color: C.text },
      { text: 'setIsDirty', color: C.param },
      { text: '] = ', color: C.text },
      { text: 'useState', color: C.func },
      { text: '(', color: C.text },
      { text: 'false', color: C.keyword },
      { text: ')', color: C.text },
    ],
    [
      { text: '  const ', color: C.keyword },
      { text: 'blocker', color: C.param },
      { text: ' = ', color: C.text },
      { text: 'useBlocker', color: C.func },
      { text: '(', color: C.text },
      { text: 'isDirty', color: C.param },
      { text: ')', color: C.text },
    ],
    [],
    [
      { text: '  return ', color: C.keyword },
      { text: '(', color: C.text },
    ],
    [
      { text: '    <', color: C.text },
      { text: 'Form', color: C.component },
      { text: ' onChange', color: C.param },
      { text: '={() => ', color: C.text },
      { text: 'setIsDirty', color: C.func },
      { text: '(', color: C.text },
      { text: 'true', color: C.keyword },
      { text: ')}>', color: C.text },
    ],
    [
      { text: '      ', color: C.text },
      { text: '{blocker.state === ', color: C.text },
      { text: "'blocked'", color: C.string },
      { text: ' && (', color: C.text },
    ],
    [
      { text: '        <', color: C.text },
      { text: 'ConfirmDialog', color: C.component },
    ],
    [
      { text: '          onStay', color: C.param },
      { text: '={blocker.', color: C.text },
      { text: 'reset', color: C.func },
      { text: '}', color: C.text },
    ],
    [
      { text: '          onLeave', color: C.param },
      { text: '={blocker.', color: C.text },
      { text: 'proceed', color: C.func },
      { text: '}', color: C.text },
    ],
    [
      { text: '        />', color: C.text },
    ],
    [
      { text: '      )}', color: C.text },
    ],
    [
      { text: '    </', color: C.text },
      { text: 'Form', color: C.component },
      { text: '>', color: C.text },
    ],
    [{ text: '  )', color: C.text }],
    [{ text: '}', color: C.text }],
  ],
}

const FUNCTION_SNIPPET: CodeSnippet = {
  title: 'conditional-blocker.tsx',
  lines: [
    [
      { text: 'import ', color: C.keyword },
      { text: '{ ', color: C.text },
      { text: 'useBlocker', color: C.func },
      { text: ' } ', color: C.text },
      { text: 'from ', color: C.keyword },
      { text: "'one'", color: C.string },
    ],
    [],
    [
      { text: 'const ', color: C.keyword },
      { text: 'blocker', color: C.param },
      { text: ' = ', color: C.text },
      { text: 'useBlocker', color: C.func },
      { text: '(({', color: C.text },
    ],
    [
      { text: '  ', color: C.text },
      { text: 'currentLocation', color: C.param },
      { text: ',', color: C.text },
    ],
    [
      { text: '  ', color: C.text },
      { text: 'nextLocation', color: C.param },
      { text: ',', color: C.text },
    ],
    [
      { text: '}) => {', color: C.text },
    ],
    [
      { text: '  return ', color: C.keyword },
      { text: 'isDirty', color: C.param },
    ],
    [
      { text: '    && ', color: C.text },
      { text: 'currentLocation', color: C.param },
      { text: ' !== ', color: C.text },
      { text: 'nextLocation', color: C.param },
    ],
    [{ text: '})', color: C.text }],
    [],
    [
      { text: '// blocker.state:', color: C.punct },
    ],
    [
      { text: '//   ', color: C.punct },
      { text: "'unblocked'", color: C.string },
      { text: ' | ', color: C.punct },
      { text: "'blocked'", color: C.string },
      { text: ' | ', color: C.punct },
      { text: "'proceeding'", color: C.string },
    ],
    [
      { text: '// blocker.', color: C.punct },
      { text: 'reset', color: C.func },
      { text: '()   ', color: C.punct },
      { text: '— cancel navigation', color: C.punct },
    ],
    [
      { text: '// blocker.', color: C.punct },
      { text: 'proceed', color: C.func },
      { text: '() ', color: C.punct },
      { text: '— allow navigation', color: C.punct },
    ],
  ],
}

// === VISUAL COMPONENTS ===

const FormCard: React.FC<{
  showDirty: boolean
  dimmed?: boolean
}> = ({ showDirty, dimmed = false }) => (
  <div
    style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
    }}
  >
    {/* nav bar */}
    <div
      style={{
        height: 36,
        borderBottom: '1px solid #e0e0e0',
        display: 'flex',
        alignItems: 'center',
        padding: '0 12px',
        gap: 16,
        background: '#fff',
        opacity: dimmed ? 0.4 : 1,
      }}
    >
      {['Home', 'Profile', 'Settings'].map((item, i) => (
        <span
          key={i}
          style={{
            fontSize: 11,
            fontFamily: UI,
            fontWeight: i === 1 ? 700 : 500,
            color: i === 1 ? '#3b82f6' : '#6b7280',
          }}
        >
          {item}
        </span>
      ))}
    </div>

    {/* form content */}
    <div
      style={{
        flex: 1,
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        opacity: dimmed ? 0.4 : 1,
      }}
    >
      <div
        style={{
          fontSize: 16,
          fontFamily: UI,
          fontWeight: 700,
          color: '#1f2328',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        Edit Profile
        {showDirty && (
          <span
            style={{
              fontSize: 9,
              fontFamily: UI,
              fontWeight: 600,
              color: '#f59e0b',
              background: '#fef3c7',
              padding: '2px 6px',
              borderRadius: 4,
              textTransform: 'uppercase',
              letterSpacing: 0.5,
            }}
          >
            Unsaved
          </span>
        )}
      </div>

      {/* name field */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <span style={{ fontSize: 10, fontFamily: UI, fontWeight: 600, color: '#6b7280' }}>
          Name
        </span>
        <div
          style={{
            height: 30,
            borderRadius: 5,
            border: showDirty ? '1.5px solid #3b82f6' : '1px solid #d0d7de',
            background: '#fff',
            display: 'flex',
            alignItems: 'center',
            padding: '0 10px',
          }}
        >
          <span
            style={{
              fontSize: 12,
              fontFamily: UI,
              color: showDirty ? '#1f2328' : '#9ca3af',
            }}
          >
            {showDirty ? 'Jane Cooper' : 'Name'}
          </span>
        </div>
      </div>

      {/* email field */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <span style={{ fontSize: 10, fontFamily: UI, fontWeight: 600, color: '#6b7280' }}>
          Email
        </span>
        <div
          style={{
            height: 30,
            borderRadius: 5,
            border: showDirty ? '1.5px solid #3b82f6' : '1px solid #d0d7de',
            background: '#fff',
            display: 'flex',
            alignItems: 'center',
            padding: '0 10px',
          }}
        >
          <span
            style={{
              fontSize: 12,
              fontFamily: UI,
              color: showDirty ? '#1f2328' : '#9ca3af',
            }}
          >
            {showDirty ? 'jane@example.com' : 'Email'}
          </span>
        </div>
      </div>

      {/* save button */}
      <div
        style={{
          height: 30,
          borderRadius: 5,
          background: '#3b82f6',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: 4,
          width: 90,
        }}
      >
        <span style={{ fontSize: 12, fontFamily: UI, fontWeight: 600, color: '#fff' }}>
          Save
        </span>
      </div>
    </div>
  </div>
)

const ConfirmOverlay: React.FC<{
  stayHighlight?: number
}> = ({ stayHighlight = 0 }) => (
  <div
    style={{
      position: 'absolute',
      inset: 0,
      background: 'rgba(0,0,0,0.35)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}
  >
    <div
      style={{
        width: '80%',
        background: '#fff',
        borderRadius: 10,
        boxShadow: '0 8px 30px rgba(0,0,0,0.18)',
        padding: 20,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      {/* warning icon */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            background: '#fef3c7',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
              stroke="#f59e0b"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </svg>
        </div>
        <span style={{ fontSize: 14, fontFamily: UI, fontWeight: 700, color: '#1f2328' }}>
          Unsaved Changes
        </span>
      </div>

      <span style={{ fontSize: 11, fontFamily: UI, color: '#6b7280', lineHeight: 1.4 }}>
        You have unsaved changes that will be lost if you leave this page.
      </span>

      {/* action buttons */}
      <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
        <div
          style={{
            flex: 1,
            height: 32,
            borderRadius: 6,
            border: '1px solid #d0d7de',
            background: stayHighlight > 0
              ? `rgba(59, 130, 246, ${0.08 * stayHighlight})`
              : '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: stayHighlight > 0
              ? `0 0 ${8 * stayHighlight}px rgba(59, 130, 246, ${0.3 * stayHighlight})`
              : 'none',
          }}
        >
          <span style={{ fontSize: 12, fontFamily: UI, fontWeight: 600, color: '#1f2328' }}>
            Stay
          </span>
        </div>
        <div
          style={{
            flex: 1,
            height: 32,
            borderRadius: 6,
            background: '#ef4444',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span style={{ fontSize: 12, fontFamily: UI, fontWeight: 600, color: '#fff' }}>
            Leave
          </span>
        </div>
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

export const USE_BLOCKER_WINDOW_DURATION = 1340

export const UseBlockerWindowScene: React.FC = () => {
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

  // === STAGE 1: form editing → navigation blocked ===
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

  // nav link click pulse on "Home" link
  const NAV_CLICK_START = 60
  const navClickProgress = interpolate(
    s1L,
    [NAV_CLICK_START, NAV_CLICK_START + 18],
    [0, 1],
    clamp
  )
  const navClickScale = interpolate(navClickProgress, [0, 1], [0, 2.5])
  const navClickOpacity = interpolate(navClickProgress, [0, 0.3, 1], [0, 0.5, 0], clamp)

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

  // === STAGE 2: blocker.reset() → form preserved ===
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

  // stay button glow
  const STAY_GLOW_START = 60
  const stayGlow = interpolate(s2L, [STAY_GLOW_START, STAY_GLOW_START + 15], [0, 1], clamp)

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
                useBlocker — Navigation Guard
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
                useBlocker
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

                {/* stage 1: form editing → navigation blocked */}
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
                      When a user edits a form and navigates away...
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                      {/* form with dirty state */}
                      <div style={{ opacity: s1LeftOpacity, position: 'relative' }}>
                        <MiniBrowser url="app.com/profile/edit" width={520} height={380}>
                          <FormCard showDirty />
                          {/* nav click ripple on "Home" link area */}
                          {navClickProgress > 0 && navClickProgress < 1 && (
                            <div
                              style={{
                                position: 'absolute',
                                left: 30,
                                top: 44,
                                width: 30,
                                height: 30,
                                borderRadius: '50%',
                                background: 'rgba(59, 130, 246, 0.35)',
                                transform: `translate(-50%, -50%) scale(${navClickScale})`,
                                opacity: navClickOpacity,
                                pointerEvents: 'none',
                              }}
                            />
                          )}
                        </MiniBrowser>
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

                      {/* form with confirmation dialog overlay */}
                      <div style={{ opacity: s1ROp, transform: `scale(${s1RSc})` }}>
                        <MiniBrowser url="app.com/profile/edit" width={520} height={380}>
                          <FormCard showDirty dimmed />
                          <ConfirmOverlay />
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
                      Navigation blocked until you decide
                    </div>
                  </div>
                )}

                {/* stage 2: choose to stay → form preserved */}
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
                      User chooses to stay or leave...
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                      {/* confirmation dialog with "Stay" highlighted */}
                      <div style={{ opacity: s2LeftOpacity, position: 'relative' }}>
                        <MiniBrowser url="app.com/profile/edit" width={520} height={380}>
                          <FormCard showDirty dimmed />
                          <ConfirmOverlay stayHighlight={stayGlow} />
                        </MiniBrowser>
                      </div>

                      {/* arrow with blocker.reset label */}
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
                          blocker.reset()
                        </span>
                      </div>

                      {/* form preserved - back to normal editing */}
                      <div style={{ opacity: s2ROp, transform: `scale(${s2RSc})` }}>
                        <MiniBrowser url="app.com/profile/edit" width={520} height={380}>
                          <FormCard showDirty />
                          {/* green success flash */}
                          <div
                            style={{
                              position: 'absolute',
                              inset: 0,
                              border: '2px solid rgba(34, 197, 94, 0.4)',
                              borderRadius: 0,
                              pointerEvents: 'none',
                            }}
                          />
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
                      Customizable confirmation prompts
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
                    {[HOOK_SNIPPET, FUNCTION_SNIPPET].map((snippet, si) => (
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
