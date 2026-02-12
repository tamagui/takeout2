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

// demo.mov icon is 7th in left column (index 6)
const CURSOR_START = { x: 700, y: 500 }
const ICON_CENTER = { x: 68, y: 661 }

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

const clamp = {
  extrapolateLeft: 'clamp' as const,
  extrapolateRight: 'clamp' as const,
}

// === CODE SNIPPETS (verified from ONE source: packages/one/src/hooks.tsx) ===

const BREADCRUMBS_SNIPPET: CodeSnippet = {
  title: 'breadcrumbs.tsx',
  lines: [
    [
      { text: 'import ', color: C.keyword },
      { text: '{ ', color: C.text },
      { text: 'useMatches', color: C.func },
      { text: ' } ', color: C.text },
      { text: 'from ', color: C.keyword },
      { text: "'one'", color: C.string },
    ],
    [],
    [
      { text: 'export ', color: C.keyword },
      { text: 'function ', color: C.keyword },
      { text: 'Breadcrumbs', color: C.func },
      { text: '() {', color: C.text },
    ],
    [
      { text: '  const ', color: C.keyword },
      { text: 'matches', color: C.param },
      { text: ' = ', color: C.text },
      { text: 'useMatches', color: C.func },
      { text: '()', color: C.text },
    ],
    [],
    [
      { text: '  return ', color: C.keyword },
      { text: '(', color: C.text },
    ],
    [
      { text: '    <', color: C.text },
      { text: 'nav', color: C.component },
      { text: '>', color: C.text },
    ],
    [
      { text: '      {matches.', color: C.text },
      { text: 'map', color: C.func },
      { text: '((', color: C.text },
      { text: 'match', color: C.param },
      { text: ') => (', color: C.text },
    ],
    [
      { text: '        <', color: C.text },
      { text: 'Link', color: C.component },
      { text: ' href', color: C.param },
      { text: '={match.', color: C.text },
      { text: 'pathname', color: C.param },
      { text: '}>', color: C.text },
    ],
    [
      { text: '          {match.', color: C.text },
      { text: 'loaderData', color: C.param },
      { text: '.', color: C.text },
      { text: 'title', color: C.param },
      { text: '}', color: C.text },
    ],
    [
      { text: '        </', color: C.text },
      { text: 'Link', color: C.component },
      { text: '>', color: C.text },
    ],
    [
      { text: '      ))}', color: C.text },
    ],
    [
      { text: '    </', color: C.text },
      { text: 'nav', color: C.component },
      { text: '>', color: C.text },
    ],
    [
      { text: '  )', color: C.text },
    ],
    [{ text: '}', color: C.text }],
  ],
}

const LAYOUT_SNIPPET: CodeSnippet = {
  title: '_layout.tsx',
  lines: [
    [
      { text: 'import ', color: C.keyword },
      { text: '{ ', color: C.text },
      { text: 'usePageMatch', color: C.func },
      { text: ' } ', color: C.text },
      { text: 'from ', color: C.keyword },
      { text: "'one'", color: C.string },
    ],
    [],
    [
      { text: 'export ', color: C.keyword },
      { text: 'function ', color: C.keyword },
      { text: 'Layout', color: C.func },
      { text: '({ ', color: C.text },
      { text: 'children', color: C.param },
      { text: ' }) {', color: C.text },
    ],
    [
      { text: '  const ', color: C.keyword },
      { text: 'page', color: C.param },
      { text: ' = ', color: C.text },
      { text: 'usePageMatch', color: C.func },
      { text: '()', color: C.text },
    ],
    [
      { text: '  const ', color: C.keyword },
      { text: 'meta', color: C.param },
      { text: ' = page?.', color: C.text },
      { text: 'loaderData', color: C.param },
      { text: '?.', color: C.text },
      { text: 'meta', color: C.param },
    ],
    [],
    [
      { text: '  return ', color: C.keyword },
      { text: '(', color: C.text },
    ],
    [
      { text: '    <>', color: C.text },
    ],
    [
      { text: '      <', color: C.text },
      { text: 'Head', color: C.component },
      { text: '>', color: C.text },
    ],
    [
      { text: '        <', color: C.text },
      { text: 'title', color: C.component },
      { text: '>{meta?.', color: C.text },
      { text: 'title', color: C.param },
      { text: '}</', color: C.text },
      { text: 'title', color: C.component },
      { text: '>', color: C.text },
    ],
    [
      { text: '      </', color: C.text },
      { text: 'Head', color: C.component },
      { text: '>', color: C.text },
    ],
    [
      { text: '      <', color: C.text },
      { text: 'Sidebar', color: C.component },
      { text: ' title', color: C.param },
      { text: '={meta?.', color: C.text },
      { text: 'title', color: C.param },
      { text: '} />', color: C.text },
    ],
    [
      { text: '      {', color: C.text },
      { text: 'children', color: C.param },
      { text: '}', color: C.text },
    ],
    [
      { text: '    </>', color: C.text },
    ],
    [
      { text: '  )', color: C.text },
    ],
    [{ text: '}', color: C.text }],
  ],
}

// === VISUAL COMPONENTS ===

// matched route entries for tree visualization
const ROUTE_MATCHES = [
  { routeId: '/', path: '/', title: 'Home' },
  { routeId: '/shop', path: '/shop', title: 'Shop' },
  { routeId: '/shop/electronics', path: '/shop/electronics', title: 'Electronics' },
  { routeId: '/shop/electronics/headphones', path: '/shop/electronics/headphones', title: 'Headphones' },
]

const RouteTree: React.FC<{
  highlightIndex: number
  localFrame: number
}> = ({ highlightIndex, localFrame }) => (
  <div
    style={{
      width: 480,
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
        Matched Routes
      </span>
      <span style={{ fontSize: 11, fontFamily: MONO, color: '#6e7781' }}>
        useMatches()
      </span>
    </div>
    {ROUTE_MATCHES.map((route, i) => {
      const isActive = i <= highlightIndex
      const revealOp = interpolate(
        localFrame,
        [i * 18, i * 18 + 10],
        [0, 1],
        clamp
      )
      return (
        <div
          key={i}
          style={{
            padding: '12px 18px',
            paddingLeft: 18 + i * 20,
            borderBottom: i < ROUTE_MATCHES.length - 1 ? '1px solid #f0f0f0' : 'none',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            opacity: isActive ? revealOp : 0.3,
            background: isActive ? 'rgba(59, 130, 246, 0.04)' : 'transparent',
          }}
        >
          {/* tree connector */}
          {i > 0 && (
            <span style={{ fontSize: 12, fontFamily: MONO, color: '#d0d7de' }}>
              {'\u2514'}
            </span>
          )}
          <span
            style={{
              fontSize: 14,
              fontFamily: MONO,
              fontWeight: 600,
              color: isActive ? C.func : '#8b949e',
              minWidth: 40,
            }}
          >
            {route.routeId}
          </span>
          <span style={{ fontSize: 11, fontFamily: MONO, color: '#6e7781' }}>
            {'\u2192'}
          </span>
          <span
            style={{
              fontSize: 13,
              fontFamily: MONO,
              color: C.param,
            }}
          >
            loaderData: {'{ '}title: "{route.title}"{ ' }'}
          </span>
        </div>
      )
    })}
  </div>
)

const BreadcrumbBar: React.FC<{
  highlightCount: number
}> = ({ highlightCount }) => (
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
        Breadcrumbs
      </span>
      <span style={{ fontSize: 11, fontFamily: MONO, color: '#6e7781' }}>
        rendered
      </span>
    </div>
    {/* breadcrumb trail */}
    <div
      style={{
        padding: '20px 18px',
        display: 'flex',
        alignItems: 'center',
        gap: 0,
        flexWrap: 'wrap',
      }}
    >
      {ROUTE_MATCHES.map((route, i) => {
        const isActive = i < highlightCount
        const isLast = i === ROUTE_MATCHES.length - 1
        return (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
            <span
              style={{
                fontSize: 15,
                fontFamily: UI,
                fontWeight: isLast ? 700 : 500,
                color: isActive
                  ? isLast
                    ? '#1f2328'
                    : '#3b82f6'
                  : '#d0d7de',
                textDecoration: isActive && !isLast ? 'underline' : 'none',
                textUnderlineOffset: 3,
                padding: '4px 8px',
                borderRadius: 4,
                background: isActive && isLast ? 'rgba(59, 130, 246, 0.08)' : 'transparent',
              }}
            >
              {route.title}
            </span>
            {!isLast && (
              <span
                style={{
                  fontSize: 13,
                  color: isActive ? '#8b949e' : '#d0d7de',
                  margin: '0 2px',
                }}
              >
                /
              </span>
            )}
          </div>
        )
      })}
    </div>
    {/* url path */}
    <div
      style={{
        padding: '10px 18px',
        borderTop: '1px solid #f0f0f0',
        display: 'flex',
        alignItems: 'center',
        gap: 6,
      }}
    >
      <span style={{ fontSize: 10, fontFamily: UI, fontWeight: 600, color: '#8b949e', textTransform: 'uppercase', letterSpacing: 0.5 }}>
        URL
      </span>
      <span style={{ fontSize: 13, fontFamily: MONO, color: '#57606a' }}>
        /shop/electronics/headphones
      </span>
    </div>
  </div>
)

// layout + page data visualization for stage 2
const LayoutFrame: React.FC<{
  showPageData: boolean
  glowProgress: number
}> = ({ showPageData, glowProgress }) => (
  <div
    style={{
      width: 460,
      height: 340,
      background: '#fff',
      borderRadius: 10,
      border: '1px solid #e0e0e0',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
    }}
  >
    {/* header bar showing layout */}
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
        _layout.tsx
      </span>
      <span style={{ fontSize: 11, fontFamily: MONO, color: '#6e7781' }}>
        parent
      </span>
    </div>

    <div style={{ flex: 1, display: 'flex' }}>
      {/* sidebar */}
      <div
        style={{
          width: 140,
          borderRight: '1px solid #e0e0e0',
          padding: 14,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
        <div
          style={{
            fontSize: 12,
            fontFamily: UI,
            fontWeight: 700,
            color: '#1f2328',
            marginBottom: 4,
          }}
        >
          {showPageData ? 'Headphones' : '???'}
        </div>
        {['Home', 'Shop', 'Electronics', 'Headphones'].map((item, i) => (
          <span
            key={i}
            style={{
              fontSize: 11,
              fontFamily: UI,
              fontWeight: i === 3 ? 600 : 400,
              color: i === 3 ? '#3b82f6' : '#6b7280',
            }}
          >
            {item}
          </span>
        ))}
      </div>

      {/* main content area */}
      <div style={{ flex: 1, padding: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {/* usePageMatch call indicator */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 10px',
            borderRadius: 6,
            background: glowProgress > 0 ? `rgba(130, 80, 223, ${0.06 * glowProgress})` : '#f6f8fa',
            border: glowProgress > 0
              ? `1px solid rgba(130, 80, 223, ${0.3 * glowProgress})`
              : '1px solid #e0e0e0',
            boxShadow: glowProgress > 0
              ? `0 0 ${8 * glowProgress}px rgba(130, 80, 223, ${0.15 * glowProgress})`
              : 'none',
          }}
        >
          <span style={{ fontSize: 11, fontFamily: MONO, fontWeight: 600, color: C.func }}>
            usePageMatch()
          </span>
          <span style={{ fontSize: 9, fontFamily: MONO, color: '#8b949e' }}>
            {'\u2192'} loaderData
          </span>
        </div>

        {/* page title from loader data */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 4 }}>
          <span style={{ fontSize: 9, fontFamily: UI, fontWeight: 600, color: '#8b949e', textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Page Title
          </span>
          <div
            style={{
              height: 28,
              borderRadius: 5,
              background: showPageData ? '#eff6ff' : '#f3f4f6',
              border: showPageData ? '1px solid #bfdbfe' : '1px solid #e5e7eb',
              display: 'flex',
              alignItems: 'center',
              padding: '0 10px',
            }}
          >
            <span
              style={{
                fontSize: 13,
                fontFamily: UI,
                fontWeight: 600,
                color: showPageData ? '#1f2328' : '#d0d7de',
              }}
            >
              {showPageData ? 'Premium Headphones' : '\u2014'}
            </span>
          </div>
        </div>

        {/* description from loader data */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontSize: 9, fontFamily: UI, fontWeight: 600, color: '#8b949e', textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Meta Description
          </span>
          <div
            style={{
              height: 44,
              borderRadius: 5,
              background: showPageData ? '#eff6ff' : '#f3f4f6',
              border: showPageData ? '1px solid #bfdbfe' : '1px solid #e5e7eb',
              display: 'flex',
              alignItems: 'center',
              padding: '0 10px',
            }}
          >
            <span
              style={{
                fontSize: 11,
                fontFamily: UI,
                color: showPageData ? '#57606a' : '#d0d7de',
                lineHeight: 1.3,
              }}
            >
              {showPageData ? 'Browse our collection of premium headphones...' : '\u2014'}
            </span>
          </div>
        </div>

        {/* content skeleton */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                height: 8,
                borderRadius: 4,
                background: '#e5e7eb',
                width: `${80 - i * 15}%`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  </div>
)

const MetadataCard: React.FC = () => (
  <div
    style={{
      width: 400,
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
        {'\u003Chead\u003E'}
      </span>
      <span style={{ fontSize: 11, fontFamily: MONO, color: '#6e7781' }}>
        generated
      </span>
    </div>
    {[
      { tag: 'title', value: 'Premium Headphones | Shop' },
      { tag: 'meta:description', value: 'Browse our collection of premium...' },
      { tag: 'og:title', value: 'Premium Headphones' },
    ].map((entry, i) => (
      <div
        key={i}
        style={{
          padding: '14px 18px',
          borderBottom: i < 2 ? '1px solid #f0f0f0' : 'none',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <span
          style={{
            fontSize: 12,
            fontFamily: MONO,
            fontWeight: 600,
            color: C.component,
            minWidth: 120,
          }}
        >
          {entry.tag}
        </span>
        <span
          style={{
            fontSize: 13,
            fontFamily: MONO,
            color: C.string,
            flex: 1,
          }}
        >
          {entry.value}
        </span>
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

export const USE_MATCHES_WINDOW_DURATION = 1340

export const UseMatchesWindowScene: React.FC = () => {
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

  // === STAGE 1: route tree → breadcrumbs ===
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

  // route tree highlight — stagger each entry
  const TREE_GLOW_START = 60
  const treeHighlight = interpolate(
    s1L,
    [TREE_GLOW_START, TREE_GLOW_START + 60],
    [0, 3],
    clamp
  )
  const routeHighlightIndex = Math.min(Math.floor(treeHighlight), 3)

  // breadcrumb count — reveals in sync with routes
  const breadcrumbCount = Math.min(Math.floor(treeHighlight) + 1, 4)

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

  // === STAGE 2: layout frame → metadata card ===
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

  // usePageMatch glow
  const PAGE_MATCH_GLOW_START = 60
  const pageMatchGlow = interpolate(
    s2L,
    [PAGE_MATCH_GLOW_START, PAGE_MATCH_GLOW_START + 15],
    [0, 1],
    clamp
  )
  const showPageData = s2L >= PAGE_MATCH_GLOW_START + 10

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
              top: 630,
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
                useMatches — Route Match Access
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
                useMatches
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

                {/* stage 1: route tree → breadcrumbs */}
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
                      Every matched route in one array...
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                      {/* route tree */}
                      <div style={{ opacity: s1LeftOpacity }}>
                        <RouteTree
                          highlightIndex={routeHighlightIndex}
                          localFrame={Math.max(0, s1L - 30)}
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

                      {/* breadcrumb bar */}
                      <div style={{ opacity: s1ROp, transform: `scale(${s1RSc})` }}>
                        <BreadcrumbBar highlightCount={breadcrumbCount} />
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
                      Build breadcrumbs from matched routes
                    </div>
                  </div>
                )}

                {/* stage 2: layout accessing page data → metadata */}
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
                      Layout reads the current page's data...
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                      {/* layout frame */}
                      <div style={{ opacity: s2LeftOpacity }}>
                        <LayoutFrame
                          showPageData={showPageData}
                          glowProgress={pageMatchGlow}
                        />
                      </div>

                      {/* arrow with method label */}
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
                          usePageMatch()
                        </span>
                      </div>

                      {/* metadata card */}
                      <div style={{ opacity: s2ROp, transform: `scale(${s2RSc})` }}>
                        <MetadataCard />
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
                      Parent layouts read child page data
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
                    {[BREADCRUMBS_SNIPPET, LAYOUT_SNIPPET].map((snippet, si) => (
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
