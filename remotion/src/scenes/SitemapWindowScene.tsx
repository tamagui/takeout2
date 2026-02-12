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

// native app icon is 6th in left column (index 5)
const CURSOR_START = { x: 700, y: 500 }
const ICON_CENTER = { x: 68, y: 561 }

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

// === CODE SNIPPETS (verified from ONE source) ===

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
      { text: '        sitemap', color: C.param },
      { text: ': {', color: C.text },
    ],
    [
      { text: '          baseUrl', color: C.param },
      { text: ': ', color: C.text },
      { text: "'https://example.com'", color: C.string },
      { text: ',', color: C.text },
    ],
    [
      { text: '          priority', color: C.param },
      { text: ': ', color: C.text },
      { text: '0.7', color: C.param },
      { text: ',', color: C.text },
    ],
    [
      { text: '          changefreq', color: C.param },
      { text: ': ', color: C.text },
      { text: "'weekly'", color: C.string },
      { text: ',', color: C.text },
    ],
    [
      { text: '          exclude', color: C.param },
      { text: ': [', color: C.text },
      { text: "'/admin/*'", color: C.string },
      { text: '],', color: C.text },
    ],
    [
      { text: '        },', color: C.text },
    ],
    [
      { text: '      },', color: C.text },
    ],
    [
      { text: '    }),', color: C.text },
    ],
    [
      { text: '  ],', color: C.text },
    ],
    [{ text: '}', color: C.text }],
  ],
}

const ROUTE_SNIPPET: CodeSnippet = {
  title: 'blog/[slug]+page.tsx',
  lines: [
    [
      { text: '// per-route sitemap overrides', color: C.punct },
    ],
    [
      { text: 'export ', color: C.keyword },
      { text: 'const ', color: C.keyword },
      { text: 'sitemap', color: C.param },
      { text: ' = {', color: C.text },
    ],
    [
      { text: '  priority', color: C.param },
      { text: ': ', color: C.text },
      { text: '0.9', color: C.param },
      { text: ',', color: C.text },
    ],
    [
      { text: '  changefreq', color: C.param },
      { text: ': ', color: C.text },
      { text: "'daily'", color: C.string },
      { text: ',', color: C.text },
    ],
    [
      { text: '  lastmod', color: C.param },
      { text: ': ', color: C.text },
      { text: "'2025-01-15'", color: C.string },
      { text: ',', color: C.text },
    ],
    [{ text: '}', color: C.text }],
    [],
    [
      { text: '// or exclude a route entirely:', color: C.punct },
    ],
    [
      { text: '// export const sitemap = { exclude: true }', color: C.punct },
    ],
    [],
    [
      { text: 'export ', color: C.keyword },
      { text: 'default ', color: C.keyword },
      { text: 'function ', color: C.keyword },
      { text: 'BlogPost', color: C.func },
      { text: '() {', color: C.text },
    ],
    [
      { text: '  const ', color: C.keyword },
      { text: '{ ', color: C.text },
      { text: 'slug', color: C.param },
      { text: ' } = ', color: C.text },
      { text: 'useParams', color: C.func },
      { text: '()', color: C.text },
    ],
    [
      { text: '  return ', color: C.keyword },
      { text: '<', color: C.text },
      { text: 'Article', color: C.component },
      { text: ' slug', color: C.param },
      { text: '={slug} />', color: C.text },
    ],
    [{ text: '}', color: C.text }],
  ],
}

// === VISUAL COMPONENTS ===

// route entries with sitemap metadata
const ROUTE_ENTRIES = [
  { path: '/', priority: 1.0, changefreq: 'daily', badge: 'home', excluded: false },
  { path: '/blog', priority: 0.8, changefreq: 'daily', badge: 'index', excluded: false },
  { path: '/blog/react-19', priority: 0.9, changefreq: 'daily', badge: 'override', excluded: false },
  { path: '/about', priority: 0.7, changefreq: 'weekly', badge: 'default', excluded: false },
  { path: '/admin/dashboard', priority: 0, changefreq: '', badge: 'excluded', excluded: true },
]

const BADGE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  home: { bg: '#eff6ff', text: '#3b82f6', border: '#bfdbfe' },
  index: { bg: '#f0fdf4', text: '#22c55e', border: '#bbf7d0' },
  override: { bg: '#fef3c7', text: '#d97706', border: '#fde68a' },
  default: { bg: '#f6f8fa', text: '#6e7781', border: '#e0e0e0' },
  excluded: { bg: '#fef2f2', text: '#cf222e', border: '#fecaca' },
}

const RouteList: React.FC<{
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
        Routes
      </span>
      <span style={{ fontSize: 11, fontFamily: MONO, color: '#6e7781' }}>
        sitemap metadata
      </span>
    </div>
    {ROUTE_ENTRIES.map((route, i) => {
      const isActive = i <= highlightIndex
      const revealOp = interpolate(
        localFrame,
        [i * 14, i * 14 + 10],
        [0, 1],
        clamp
      )
      const badgeStyle = BADGE_COLORS[route.badge]

      return (
        <div
          key={i}
          style={{
            padding: '12px 18px',
            borderBottom: i < ROUTE_ENTRIES.length - 1 ? '1px solid #f0f0f0' : 'none',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            opacity: isActive ? revealOp : 0.3,
            background: isActive && !route.excluded
              ? 'rgba(59, 130, 246, 0.03)'
              : route.excluded && isActive
                ? 'rgba(207, 34, 46, 0.03)'
                : 'transparent',
          }}
        >
          <span
            style={{
              fontSize: 14,
              fontFamily: MONO,
              fontWeight: 600,
              color: route.excluded ? '#cf222e' : C.func,
              minWidth: 160,
              textDecoration: route.excluded ? 'line-through' : 'none',
            }}
          >
            {route.path}
          </span>

          {!route.excluded ? (
            <>
              <span
                style={{
                  fontSize: 12,
                  fontFamily: MONO,
                  fontWeight: 600,
                  color: '#1f2328',
                  background: '#f6f8fa',
                  padding: '2px 6px',
                  borderRadius: 4,
                  minWidth: 30,
                  textAlign: 'center',
                }}
              >
                {route.priority.toFixed(1)}
              </span>
              <span
                style={{
                  fontSize: 11,
                  fontFamily: MONO,
                  color: '#8b949e',
                }}
              >
                {route.changefreq}
              </span>
            </>
          ) : null}

          <div style={{ flex: 1 }} />
          <span
            style={{
              fontSize: 9,
              fontFamily: UI,
              fontWeight: 600,
              color: badgeStyle.text,
              background: badgeStyle.bg,
              padding: '2px 8px',
              borderRadius: 10,
              border: `1px solid ${badgeStyle.border}`,
              textTransform: 'uppercase',
              letterSpacing: 0.5,
            }}
          >
            {route.badge}
          </span>
        </div>
      )
    })}
  </div>
)

// XML preview card
const XmlPreview: React.FC = () => {
  const XML_TAG = '#cf222e'
  const XML_ATTR = '#8250df'
  const XML_VAL = '#0a3069'
  const XML_PUNCT = '#6e7781'

  const lines = [
    { tokens: [{ text: '<?xml version="1.0" encoding="UTF-8"?>', color: XML_PUNCT }] },
    { tokens: [{ text: '<urlset xmlns="...sitemaps.org...">', color: XML_PUNCT }] },
    { tokens: [] },
    { tokens: [{ text: '  <', color: XML_PUNCT }, { text: 'url', color: XML_TAG }, { text: '>', color: XML_PUNCT }] },
    { tokens: [{ text: '    <', color: XML_PUNCT }, { text: 'loc', color: XML_ATTR }, { text: '>', color: XML_PUNCT }, { text: 'https://example.com/', color: XML_VAL }, { text: '</', color: XML_PUNCT }, { text: 'loc', color: XML_ATTR }, { text: '>', color: XML_PUNCT }] },
    { tokens: [{ text: '    <', color: XML_PUNCT }, { text: 'priority', color: XML_ATTR }, { text: '>', color: XML_PUNCT }, { text: '1.0', color: XML_VAL }, { text: '</', color: XML_PUNCT }, { text: 'priority', color: XML_ATTR }, { text: '>', color: XML_PUNCT }] },
    { tokens: [{ text: '    <', color: XML_PUNCT }, { text: 'changefreq', color: XML_ATTR }, { text: '>', color: XML_PUNCT }, { text: 'daily', color: XML_VAL }, { text: '</', color: XML_PUNCT }, { text: 'changefreq', color: XML_ATTR }, { text: '>', color: XML_PUNCT }] },
    { tokens: [{ text: '  </', color: XML_PUNCT }, { text: 'url', color: XML_TAG }, { text: '>', color: XML_PUNCT }] },
    { tokens: [] },
    { tokens: [{ text: '  <', color: XML_PUNCT }, { text: 'url', color: XML_TAG }, { text: '>', color: XML_PUNCT }] },
    { tokens: [{ text: '    <', color: XML_PUNCT }, { text: 'loc', color: XML_ATTR }, { text: '>', color: XML_PUNCT }, { text: '.../blog/react-19', color: XML_VAL }, { text: '</', color: XML_PUNCT }, { text: 'loc', color: XML_ATTR }, { text: '>', color: XML_PUNCT }] },
    { tokens: [{ text: '    <', color: XML_PUNCT }, { text: 'lastmod', color: XML_ATTR }, { text: '>', color: XML_PUNCT }, { text: '2025-01-15', color: XML_VAL }, { text: '</', color: XML_PUNCT }, { text: 'lastmod', color: XML_ATTR }, { text: '>', color: XML_PUNCT }] },
    { tokens: [{ text: '    <', color: XML_PUNCT }, { text: 'priority', color: XML_ATTR }, { text: '>', color: XML_PUNCT }, { text: '0.9', color: XML_VAL }, { text: '</', color: XML_PUNCT }, { text: 'priority', color: XML_ATTR }, { text: '>', color: XML_PUNCT }] },
    { tokens: [{ text: '  </', color: XML_PUNCT }, { text: 'url', color: XML_TAG }, { text: '>', color: XML_PUNCT }] },
    { tokens: [] },
    { tokens: [{ text: '</', color: XML_PUNCT }, { text: 'urlset', color: XML_TAG }, { text: '>', color: XML_PUNCT }] },
  ]

  return (
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
          sitemap.xml
        </span>
        <span style={{ fontSize: 11, fontFamily: MONO, color: '#6e7781' }}>
          generated
        </span>
      </div>
      <div style={{ padding: '12px 16px' }}>
        {lines.map((line, li) => (
          <div
            key={li}
            style={{
              fontFamily: MONO,
              fontSize: 12,
              lineHeight: 1.65,
              whiteSpace: 'pre',
            }}
          >
            {line.tokens.length === 0
              ? '\u00A0'
              : line.tokens.map((token, ti) => (
                  <span key={ti} style={{ color: token.color }}>
                    {token.text}
                  </span>
                ))}
          </div>
        ))}
      </div>
    </div>
  )
}

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

export const SITEMAP_WINDOW_DURATION = TOTAL

export const SitemapWindowScene: React.FC = () => {
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

  // === STAGE 1: route list → XML output ===
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

  // route highlight — stagger each entry
  const ROUTE_GLOW_START = 60
  const routeHighlight = interpolate(
    s1L,
    [ROUTE_GLOW_START, ROUTE_GLOW_START + 70],
    [0, 4],
    clamp
  )
  const routeHighlightIndex = Math.min(Math.floor(routeHighlight), 4)

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
              top: 530,
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
                Sitemaps
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
                Sitemaps
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

                {/* stage 1: route list → XML output */}
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
                      Each route controls its sitemap entry...
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                      {/* route list with metadata */}
                      <div style={{ opacity: s1LeftOpacity }}>
                        <RouteList
                          highlightIndex={routeHighlightIndex}
                          localFrame={Math.max(0, s1L - 30)}
                        />
                      </div>

                      {/* arrow */}
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
                          one build
                        </span>
                      </div>

                      {/* XML output */}
                      <div style={{ opacity: s1ROp, transform: `scale(${s1RSc})` }}>
                        <XmlPreview />
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
                      Auto-generated with per-route overrides
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
                    {[CONFIG_SNIPPET, ROUTE_SNIPPET].map((snippet, si) => (
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
