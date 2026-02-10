import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion'

import { FakeDesktopScene } from './FakeDesktopScene'

const MONO = "'SF Mono', 'Fira Code', 'Cascadia Code', monospace"
const UI = "'Inter', -apple-system, 'Segoe UI', Roboto, sans-serif"

// stack header icon is last in left column (index 8)
const CURSOR_START = { x: 700, y: 500 }
const ICON_CENTER = { x: 68, y: 861 }

// timeline (frames at 60fps)
const MOVE_START = 8
const MOVE_END = 35
const CLICK = 40
const WINDOW_OPEN = 52

// stage timeline — starts after zoom completes
const S1_ENTER = WINDOW_OPEN + 70
const S1_EXIT = WINDOW_OPEN + 210
const S2_ENTER = WINDOW_OPEN + 220
const S2_EXIT = WINDOW_OPEN + 360
const S3_ENTER = WINDOW_OPEN + 370
const STAGE_FADE = 20

// syntax highlight colors
const C = {
  keyword: '#cf222e',
  func: '#8250df',
  component: '#0550ae',
  param: '#953800',
  text: '#1f2328',
  punct: '#6e7781',
  string: '#0a3069',
}

// code types
type CodeToken = { text: string; color: string }
type CodeSnippet = { title: string; lines: CodeToken[][] }

// stage 1 left — traditional options API
export const OPTIONS_SNIPPET: CodeSnippet = {
  title: '_layout.tsx — options API',
  lines: [
    [
      { text: '<', color: C.text },
      { text: 'Stack.Screen', color: C.component },
    ],
    [
      { text: '  name', color: C.param },
      { text: '=', color: C.punct },
      { text: '"index"', color: C.string },
    ],
    [
      { text: '  options', color: C.param },
      { text: '={{', color: C.text },
    ],
    [
      { text: '    title', color: C.text },
      { text: ': ', color: C.punct },
      { text: "'Welcome'", color: C.string },
      { text: ',', color: C.punct },
    ],
    [
      { text: '    headerLargeTitle', color: C.text },
      { text: ': ', color: C.punct },
      { text: 'true', color: C.keyword },
      { text: ',', color: C.punct },
    ],
    [
      { text: '    headerBlurEffect', color: C.text },
      { text: ': ', color: C.punct },
      { text: "'regular'", color: C.string },
      { text: ',', color: C.punct },
    ],
    [
      { text: '    headerRight', color: C.text },
      { text: ': ', color: C.punct },
      { text: '() ', color: C.param },
      { text: '=> (', color: C.punct },
    ],
    [
      { text: '      <', color: C.text },
      { text: 'Button', color: C.component },
      { text: '>Action</', color: C.text },
      { text: 'Button', color: C.component },
      { text: '>', color: C.text },
    ],
    [{ text: '    ),', color: C.punct }],
    [{ text: '  }}', color: C.text }],
    [{ text: '/>', color: C.text }],
  ],
}

// stage 1 right — composition API
export const COMPOSITION_SNIPPET: CodeSnippet = {
  title: '_layout.tsx — composition API',
  lines: [
    [
      { text: '<', color: C.text },
      { text: 'Stack.Screen', color: C.component },
      { text: ' name', color: C.param },
      { text: '=', color: C.punct },
      { text: '"index"', color: C.string },
      { text: '>', color: C.text },
    ],
    [
      { text: '  <', color: C.text },
      { text: 'Stack.Header', color: C.component },
      { text: ' blurEffect', color: C.param },
      { text: '=', color: C.punct },
      { text: '"regular"', color: C.string },
      { text: '>', color: C.text },
    ],
    [
      { text: '    <', color: C.text },
      { text: 'Stack.Header.Title', color: C.component },
      { text: ' large', color: C.param },
      { text: '>', color: C.text },
    ],
    [{ text: '      Welcome', color: C.text }],
    [
      { text: '    </', color: C.text },
      { text: 'Stack.Header.Title', color: C.component },
      { text: '>', color: C.text },
    ],
    [
      { text: '    <', color: C.text },
      { text: 'Stack.Header.Right', color: C.component },
      { text: ' asChild', color: C.param },
      { text: '>', color: C.text },
    ],
    [
      { text: '      <', color: C.text },
      { text: 'Button', color: C.component },
      { text: '>Action</', color: C.text },
      { text: 'Button', color: C.component },
      { text: '>', color: C.text },
    ],
    [
      { text: '    </', color: C.text },
      { text: 'Stack.Header.Right', color: C.component },
      { text: '>', color: C.text },
    ],
    [
      { text: '  </', color: C.text },
      { text: 'Stack.Header', color: C.component },
      { text: '>', color: C.text },
    ],
    [
      { text: '</', color: C.text },
      { text: 'Stack.Screen', color: C.component },
      { text: '>', color: C.text },
    ],
  ],
}

// stage 2 — advanced configuration
export const ADVANCED_SNIPPET: CodeSnippet = {
  title: 'feed/_layout.tsx',
  lines: [
    [
      { text: '<', color: C.text },
      { text: 'Stack.Screen', color: C.component },
      { text: ' name', color: C.param },
      { text: '=', color: C.punct },
      { text: '"feed"', color: C.string },
      { text: '>', color: C.text },
    ],
    [
      { text: '  <', color: C.text },
      { text: 'Stack.Header', color: C.component },
    ],
    [
      { text: '    blurEffect', color: C.param },
      { text: '=', color: C.punct },
      { text: '"regular"', color: C.string },
    ],
    [
      { text: '    style', color: C.param },
      { text: '={{ ', color: C.text },
      { text: 'backgroundColor', color: C.param },
      { text: ': ', color: C.punct },
      { text: "'transparent'", color: C.string },
      { text: ' }}', color: C.text },
    ],
    [{ text: '  >', color: C.text }],
    [
      { text: '    <', color: C.text },
      { text: 'Stack.Header.Title', color: C.component },
      { text: ' large', color: C.param },
      { text: '>', color: C.text },
      { text: 'Feed', color: C.text },
      { text: '</', color: C.text },
      { text: 'Stack.Header.Title', color: C.component },
      { text: '>', color: C.text },
    ],
    [
      { text: '    <', color: C.text },
      { text: 'Stack.Header.Left', color: C.component },
      { text: ' asChild', color: C.param },
      { text: '>', color: C.text },
    ],
    [
      { text: '      <', color: C.text },
      { text: 'Button', color: C.component },
      { text: '>Back</', color: C.text },
      { text: 'Button', color: C.component },
      { text: '>', color: C.text },
    ],
    [
      { text: '    </', color: C.text },
      { text: 'Stack.Header.Left', color: C.component },
      { text: '>', color: C.text },
    ],
    [
      { text: '    <', color: C.text },
      { text: 'Stack.Header.SearchBar', color: C.component },
    ],
    [
      { text: '      placeholder', color: C.param },
      { text: '=', color: C.punct },
      { text: '"Search..."', color: C.string },
    ],
    [{ text: '    />', color: C.text }],
    [
      { text: '  </', color: C.text },
      { text: 'Stack.Header', color: C.component },
      { text: '>', color: C.text },
    ],
    [
      { text: '</', color: C.text },
      { text: 'Stack.Screen', color: C.component },
      { text: '>', color: C.text },
    ],
  ],
}

// stage 3 — code snippets
export const SNIPPET_1: CodeSnippet = {
  title: '_layout.tsx',
  lines: [
    [
      { text: 'import ', color: C.keyword },
      { text: '{ ', color: C.text },
      { text: 'Stack', color: C.component },
      { text: ' } ', color: C.text },
      { text: 'from ', color: C.keyword },
      { text: "'one'", color: C.string },
    ],
    [],
    [
      { text: 'export default ', color: C.keyword },
      { text: 'function ', color: C.keyword },
      { text: 'Layout', color: C.func },
      { text: '() {', color: C.text },
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
      { text: '=', color: C.punct },
      { text: '"index"', color: C.string },
      { text: '>', color: C.text },
    ],
    [
      { text: '        <', color: C.text },
      { text: 'Stack.Header', color: C.component },
      { text: '>', color: C.text },
    ],
    [
      { text: '          <', color: C.text },
      { text: 'Stack.Header.Title', color: C.component },
      { text: ' large', color: C.param },
      { text: '>', color: C.text },
      { text: 'Welcome', color: C.text },
      { text: '</', color: C.text },
      { text: 'Stack.Header.Title', color: C.component },
      { text: '>', color: C.text },
    ],
    [
      { text: '        </', color: C.text },
      { text: 'Stack.Header', color: C.component },
      { text: '>', color: C.text },
    ],
    [
      { text: '      </', color: C.text },
      { text: 'Stack.Screen', color: C.component },
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

export const SNIPPET_2: CodeSnippet = {
  title: 'search/_layout.tsx',
  lines: [
    [
      { text: '<', color: C.text },
      { text: 'Stack.Screen', color: C.component },
      { text: ' name', color: C.param },
      { text: '=', color: C.punct },
      { text: '"search"', color: C.string },
      { text: '>', color: C.text },
    ],
    [
      { text: '  <', color: C.text },
      { text: 'Stack.Header', color: C.component },
      { text: '>', color: C.text },
    ],
    [
      { text: '    <', color: C.text },
      { text: 'Stack.Header.Title', color: C.component },
      { text: '>', color: C.text },
      { text: 'Search', color: C.text },
      { text: '</', color: C.text },
      { text: 'Stack.Header.Title', color: C.component },
      { text: '>', color: C.text },
    ],
    [
      { text: '    <', color: C.text },
      { text: 'Stack.Header.SearchBar', color: C.component },
    ],
    [
      { text: '      placeholder', color: C.param },
      { text: '=', color: C.punct },
      { text: '"Search..."', color: C.string },
    ],
    [
      { text: '      onChangeText', color: C.param },
      { text: '={', color: C.text },
      { text: 'handleSearch', color: C.func },
      { text: '}', color: C.text },
    ],
    [{ text: '    />', color: C.text }],
    [
      { text: '  </', color: C.text },
      { text: 'Stack.Header', color: C.component },
      { text: '>', color: C.text },
    ],
    [
      { text: '</', color: C.text },
      { text: 'Stack.Screen', color: C.component },
      { text: '>', color: C.text },
    ],
  ],
}

// reusable code card for stages 1 and 2
export const CodeCard: React.FC<{
  snippet: CodeSnippet
  width?: number
}> = ({ snippet, width = 550 }) => (
  <div
    style={{
      width,
      borderRadius: 8,
      border: '1px solid #d0d7de',
      overflow: 'hidden',
      background: '#fff',
      display: 'flex',
      flexDirection: 'column',
      boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    }}
  >
    <div
      style={{
        height: 32,
        background: '#f6f8fa',
        borderBottom: '1px solid #d0d7de',
        display: 'flex',
        alignItems: 'center',
        padding: '0 12px',
        gap: 8,
      }}
    >
      <span style={{ fontSize: 14, color: '#6e7781' }}>⚛</span>
      <span
        style={{
          fontSize: 13,
          fontFamily: MONO,
          fontWeight: 500,
          color: '#57606a',
        }}
      >
        {snippet.title}
      </span>
    </div>
    <div style={{ padding: '12px 16px' }}>
      {snippet.lines.map((line, li) => (
        <div
          key={li}
          style={{
            fontFamily: MONO,
            fontSize: 14,
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

// iOS header mockup for stage 2
export const HeaderMockup: React.FC = () => (
  <div
    style={{
      width: 380,
      borderRadius: 28,
      background: '#f8f8f8',
      overflow: 'hidden',
      border: '3px solid #1f2328',
      boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
    }}
  >
    {/* status bar */}
    <div
      style={{
        height: 50,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        padding: '0 24px 6px',
      }}
    >
      <span
        style={{
          fontSize: 14,
          fontFamily: UI,
          fontWeight: 600,
          color: '#1f2328',
        }}
      >
        9:41
      </span>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <svg width="16" height="11" viewBox="0 0 16 11">
          <rect x="0" y="3" width="3" height="8" rx="1" fill="#1f2328" opacity="0.3" />
          <rect x="4.5" y="2" width="3" height="9" rx="1" fill="#1f2328" opacity="0.5" />
          <rect x="9" y="1" width="3" height="10" rx="1" fill="#1f2328" opacity="0.7" />
          <rect x="13" y="0" width="3" height="11" rx="1" fill="#1f2328" />
        </svg>
        <svg width="22" height="11" viewBox="0 0 22 11">
          <rect
            x="0.5"
            y="0.5"
            width="17"
            height="10"
            rx="2"
            stroke="#1f2328"
            strokeWidth="1"
            fill="none"
          />
          <rect x="2" y="2" width="12" height="7" rx="1" fill="#34C759" />
          <rect x="19" y="3" width="3" height="5" rx="1" fill="#1f2328" />
        </svg>
      </div>
    </div>

    {/* nav bar */}
    <div
      style={{
        height: 44,
        padding: '0 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <span style={{ fontSize: 17, color: '#007AFF', fontFamily: UI }}>
        {'\u2039'} Back
      </span>
      <span
        style={{
          fontSize: 17,
          fontFamily: UI,
          fontWeight: 600,
          color: '#1f2328',
        }}
      >
        Feed
      </span>
      <span style={{ fontSize: 17, color: '#007AFF', fontFamily: UI }}>
        Edit
      </span>
    </div>

    {/* large title */}
    <div style={{ padding: '2px 20px 8px' }}>
      <div
        style={{
          fontSize: 34,
          fontFamily: UI,
          fontWeight: 700,
          color: '#1f2328',
        }}
      >
        Feed
      </div>
    </div>

    {/* search bar */}
    <div
      style={{
        margin: '0 16px 16px',
        padding: '10px 12px',
        background: '#e8e8ed',
        borderRadius: 12,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}
    >
      <svg width="14" height="14" viewBox="0 0 14 14">
        <circle cx="6" cy="6" r="5" stroke="#8e8e93" strokeWidth="1.5" fill="none" />
        <line x1="10" y1="10" x2="13" y2="13" stroke="#8e8e93" strokeWidth="1.5" />
      </svg>
      <span style={{ fontSize: 16, fontFamily: UI, color: '#8e8e93' }}>
        Search...
      </span>
    </div>

    {/* separator */}
    <div style={{ height: 0.5, background: '#c6c6c8', margin: '0 16px' }} />

    {/* content rows */}
    <div style={{ padding: '4px 16px 24px' }}>
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          style={{
            height: 56,
            display: 'flex',
            alignItems: 'center',
            padding: '0 4px',
            gap: 14,
            borderBottom: i < 3 ? '0.5px solid #c6c6c8' : 'none',
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              background: '#e8e8ed',
            }}
          />
          <div style={{ flex: 1 }}>
            <div
              style={{
                height: 10,
                width: '65%',
                borderRadius: 5,
                background: '#e0e0e0',
                marginBottom: 6,
              }}
            />
            <div
              style={{
                height: 8,
                width: '45%',
                borderRadius: 4,
                background: '#f0f0f0',
              }}
            />
          </div>
          <svg width="8" height="14" viewBox="0 0 8 14">
            <path
              d="M1 1L7 7L1 13"
              stroke="#c7c7cc"
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
            />
          </svg>
        </div>
      ))}
    </div>
  </div>
)

export const STACK_HEADER_WINDOW_DURATION = 600

export const StackHeaderWindowScene: React.FC = () => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  // cursor movement
  const moveProgress = interpolate(frame, [MOVE_START, MOVE_END], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.4, 0, 0.2, 1),
  })
  const cursorX = interpolate(moveProgress, [0, 1], [CURSOR_START.x, ICON_CENTER.x])
  const cursorY = interpolate(moveProgress, [0, 1], [CURSOR_START.y, ICON_CENTER.y])

  // cursor fade in / out
  const cursorIn = interpolate(frame, [MOVE_START - 5, MOVE_START], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
  const cursorOut = interpolate(frame, [WINDOW_OPEN + 15, WINDOW_OPEN + 30], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

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

  // close animation timeline
  const CLOSE_CURSOR_START = 545
  const CLOSE_CURSOR_END = 570
  const CLOSE_CLICK = 574
  const WIN_CLOSE_START = 578
  const WIN_CLOSE_END = 598

  const CLOSE_BTN = { x: 182, y: 122 }
  const closeMoveProgress = interpolate(
    frame,
    [CLOSE_CURSOR_START, CLOSE_CURSOR_END],
    [0, 1],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.bezier(0.4, 0, 0.2, 1),
    }
  )
  const closeCursorX = interpolate(closeMoveProgress, [0, 1], [700, CLOSE_BTN.x])
  const closeCursorY = interpolate(closeMoveProgress, [0, 1], [650, CLOSE_BTN.y])
  const closeCursorIn = interpolate(
    frame,
    [CLOSE_CURSOR_START - 5, CLOSE_CURSOR_START],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  )
  const closeCursorOut = interpolate(frame, [WIN_CLOSE_END - 5, WIN_CLOSE_END], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
  const isCloseClicking = frame >= CLOSE_CLICK && frame < CLOSE_CLICK + 6
  const closeClickScale = isCloseClicking ? 0.82 : 1

  // window exit
  const winCloseProgress = interpolate(frame, [WIN_CLOSE_START, WIN_CLOSE_END], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
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

  // placeholder shimmer
  const placeholderIn = spring({
    frame: Math.max(0, frame - (WINDOW_OPEN + 10)),
    fps,
    config: { damping: 20, stiffness: 140 },
    durationInFrames: 25,
  })
  const placeholderOut = interpolate(frame, [S1_ENTER - 15, S1_ENTER], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
  const placeholderOpacity = Math.min(placeholderIn, placeholderOut)
  const shimmerX = interpolate((frame - WINDOW_OPEN) % 40, [0, 40], [-100, 200])

  // stage animations
  const s1Spring = spring({
    frame: Math.max(0, frame - S1_ENTER),
    fps,
    config: { damping: 20, stiffness: 140 },
    durationInFrames: 25,
  })
  const s1Exit = interpolate(frame, [S1_EXIT, S1_EXIT + STAGE_FADE], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
  const stage1Opacity = Math.min(s1Spring, s1Exit)
  const stage1Y = interpolate(s1Spring, [0, 1], [15, 0])

  // stage 1 sub-animations
  const s1Local = Math.max(0, frame - S1_ENTER)

  const HIGHLIGHT_START = 30
  const highlightProgress = interpolate(
    s1Local,
    [HIGHLIGHT_START, HIGHLIGHT_START + 18],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  )
  const highlightOpacity = interpolate(highlightProgress, [0, 0.3, 1], [0, 0.5, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  const arrowOpacity = interpolate(s1Local, [42, 52], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  const rightCardSpring = spring({
    frame: Math.max(0, s1Local - 48),
    fps,
    config: { damping: 18, stiffness: 120 },
    durationInFrames: 25,
  })
  const rightCardScale = interpolate(rightCardSpring, [0, 1], [0.85, 1])
  const rightCardOpacity = interpolate(rightCardSpring, [0, 0.3], [0, 1], {
    extrapolateRight: 'clamp',
  })

  const s1LabelOpacity = interpolate(s1Local, [65, 78], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  // stage 2
  const s2Spring = spring({
    frame: Math.max(0, frame - S2_ENTER),
    fps,
    config: { damping: 20, stiffness: 140 },
    durationInFrames: 25,
  })
  const s2Exit = interpolate(frame, [S2_EXIT, S2_EXIT + STAGE_FADE], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
  const stage2Opacity = Math.min(s2Spring, s2Exit)
  const stage2Y = interpolate(s2Spring, [0, 1], [15, 0])

  const s2Local = Math.max(0, frame - S2_ENTER)

  const S2_GLOW_START = 28
  const s2GlowProgress = interpolate(
    s2Local,
    [S2_GLOW_START, S2_GLOW_START + 20],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  )
  const s2GlowOpacity = interpolate(s2GlowProgress, [0, 0.3, 1], [0, 0.6, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  const s2ArrowOpacity = interpolate(s2Local, [42, 52], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  const s2RightSpring = spring({
    frame: Math.max(0, s2Local - 48),
    fps,
    config: { damping: 18, stiffness: 120 },
    durationInFrames: 25,
  })
  const s2RightScale = interpolate(s2RightSpring, [0, 1], [0.85, 1])
  const s2RightOpacity = interpolate(s2RightSpring, [0, 0.3], [0, 1], {
    extrapolateRight: 'clamp',
  })

  const s2LabelOpacity = interpolate(s2Local, [65, 78], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  // stage 3
  const s3Spring = spring({
    frame: Math.max(0, frame - S3_ENTER),
    fps,
    config: { damping: 20, stiffness: 140 },
    durationInFrames: 25,
  })
  const stage3Opacity = s3Spring
  const stage3Y = interpolate(s3Spring, [0, 1], [15, 0])

  // camera zoom
  const ZOOM_START = WINDOW_OPEN + 35
  const ZOOM_END = WINDOW_OPEN + 65
  const zoomIn = interpolate(frame, [ZOOM_START, ZOOM_END], [1, 1.18], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.cubic),
  })

  const ZOOM_OUT_START = 505
  const ZOOM_OUT_END = 542
  const zoomOut = interpolate(frame, [ZOOM_OUT_START, ZOOM_OUT_END], [1.18, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.cubic),
  })

  const cameraZoom = Math.min(zoomIn, zoomOut)

  return (
    <AbsoluteFill>
      {/* camera zoom */}
      <div
        style={{
          width: '100%',
          height: '100%',
          transform: `scale(${cameraZoom})`,
          transformOrigin: '960px 540px',
        }}
      >
        {/* desktop background */}
        <FakeDesktopScene />

        {/* icon selection highlight */}
        {showHighlight && (
          <div
            style={{
              position: 'absolute',
              left: 14,
              top: 830,
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
                Stack Header — Composition API
              </div>
              <div style={{ width: 52 }} />
            </div>

            {/* content area */}
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
              {/* radial dot grid background */}
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
                  fontSize: 38,
                  fontFamily: UI,
                  fontWeight: 700,
                  color: '#1f2328',
                  marginBottom: 24,
                  flexShrink: 0,
                  textAlign: 'center',
                }}
              >
                Stack Header Composition API
              </div>

              {/* stages container */}
              <div style={{ flex: 1, position: 'relative' }}>
                {/* shimmer skeleton */}
                {placeholderOpacity > 0 && (
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      opacity: placeholderOpacity,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 40,
                    }}
                  >
                    <div
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
                          background: `linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.5) 50%, transparent 100%)`,
                          transform: `translateX(${shimmerX}%)`,
                        }}
                      />
                    </div>
                    <div
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
                          background: `linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.5) 50%, transparent 100%)`,
                          transform: `translateX(${shimmerX}%)`,
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* stage 1: options API → composition API */}
                {stage1Opacity > 0 && (
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      opacity: stage1Opacity,
                      transform: `translateY(${stage1Y}px)`,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 20,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 24,
                        fontFamily: UI,
                        fontWeight: 600,
                        color: '#57606a',
                      }}
                    >
                      The traditional options approach...
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 20,
                      }}
                    >
                      {/* options API card with highlight pulse */}
                      <div style={{ position: 'relative' }}>
                        <CodeCard snippet={OPTIONS_SNIPPET} />
                        {highlightOpacity > 0 && (
                          <div
                            style={{
                              position: 'absolute',
                              inset: -4,
                              borderRadius: 12,
                              border: '3px solid rgba(239, 68, 68, 0.5)',
                              boxShadow: '0 0 16px rgba(239, 68, 68, 0.3)',
                              opacity: highlightOpacity,
                              pointerEvents: 'none',
                            }}
                          />
                        )}
                      </div>

                      {/* arrow */}
                      <div
                        style={{
                          fontSize: 36,
                          color: '#3b82f6',
                          fontWeight: 700,
                          opacity: arrowOpacity,
                        }}
                      >
                        {'\u2192'}
                      </div>

                      {/* composition API card — springs in */}
                      <div
                        style={{
                          opacity: rightCardOpacity,
                          transform: `scale(${rightCardScale})`,
                        }}
                      >
                        <CodeCard snippet={COMPOSITION_SNIPPET} />
                      </div>
                    </div>

                    <div
                      style={{
                        fontSize: 22,
                        fontFamily: UI,
                        color: '#3b82f6',
                        fontWeight: 600,
                        background: 'rgba(59, 130, 246, 0.08)',
                        padding: '10px 20px',
                        borderRadius: 8,
                        opacity: s1LabelOpacity,
                      }}
                    >
                      Declarative JSX replaces nested options
                    </div>
                  </div>
                )}

                {/* stage 2: advanced config → iOS header mockup */}
                {stage2Opacity > 0 && (
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      opacity: stage2Opacity,
                      transform: `translateY(${stage2Y}px)`,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 20,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 24,
                        fontFamily: UI,
                        fontWeight: 600,
                        color: '#57606a',
                      }}
                    >
                      Build rich native headers in JSX...
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 20,
                      }}
                    >
                      {/* advanced config code card with glow */}
                      <div style={{ position: 'relative' }}>
                        <CodeCard snippet={ADVANCED_SNIPPET} width={500} />
                        {s2GlowOpacity > 0 && (
                          <div
                            style={{
                              position: 'absolute',
                              inset: -4,
                              borderRadius: 12,
                              border: '3px solid rgba(59, 130, 246, 0.5)',
                              boxShadow: '0 0 16px rgba(59, 130, 246, 0.3)',
                              opacity: s2GlowOpacity,
                              pointerEvents: 'none',
                            }}
                          />
                        )}
                      </div>

                      {/* arrow */}
                      <div
                        style={{
                          fontSize: 36,
                          color: '#3b82f6',
                          fontWeight: 700,
                          opacity: s2ArrowOpacity,
                        }}
                      >
                        {'\u2192'}
                      </div>

                      {/* iOS header screenshot — springs in */}
                      <div
                        style={{
                          opacity: s2RightOpacity,
                          transform: `scale(${s2RightScale})`,
                        }}
                      >
                        <Img
                          src={staticFile('screenshots/HeaderStack.png')}
                          style={{
                            height: 580,
                            width: Math.round(580 * (777 / 1570)),
                            borderRadius: 28,
                            boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
                            objectFit: 'cover',
                          }}
                        />
                      </div>
                    </div>

                    <div
                      style={{
                        fontSize: 22,
                        fontFamily: UI,
                        color: '#3b82f6',
                        fontWeight: 600,
                        background: 'rgba(59, 130, 246, 0.08)',
                        padding: '10px 20px',
                        borderRadius: 8,
                        opacity: s2LabelOpacity,
                      }}
                    >
                      Large titles, search, buttons — all in JSX
                    </div>
                  </div>
                )}

                {/* stage 3: code snippets side by side */}
                {stage3Opacity > 0 && (
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      opacity: stage3Opacity,
                      transform: `translateY(${stage3Y}px)`,
                      display: 'flex',
                      gap: 24,
                      overflow: 'hidden',
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                  >
                    {[SNIPPET_1, SNIPPET_2].map((snippet, si) => (
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
                          <span style={{ fontSize: 15, color: '#6e7781' }}>
                            {'\u269B'}
                          </span>
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
