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

export const CONFIG_SNIPPET: CodeSnippet = {
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
      { text: 'one', color: C.func },
      { text: '({', color: C.text },
    ],
    [
      { text: '    web', color: C.param },
      { text: ': { ', color: C.text },
      { text: 'linkPrefetch', color: C.param },
      { text: ': ', color: C.text },
      { text: "'intent'", color: C.string },
      { text: ' }', color: C.text },
    ],
    [{ text: '  })]', color: C.text }],
    [{ text: '}', color: C.text }],
  ],
}

export const PRELOAD_SNIPPET: CodeSnippet = {
  title: 'router.ts — doPreload()',
  lines: [
    [
      { text: 'const ', color: C.keyword },
      { text: '[_preload, cssModule, loader] =', color: C.text },
    ],
    [
      { text: '  ', color: C.text },
      { text: 'await ', color: C.keyword },
      { text: 'Promise', color: C.component },
      { text: '.all', color: C.func },
      { text: '([', color: C.text },
    ],
    [
      { text: '    dynamicImport', color: C.func },
      { text: '(preloadPath),', color: C.text },
    ],
    [
      { text: '    dynamicImport', color: C.func },
      { text: '(cssPreloadPath)', color: C.text },
      { text: '?.catch', color: C.func },
      { text: '(() => ', color: C.text },
      { text: 'null', color: C.keyword },
      { text: '),', color: C.text },
    ],
    [
      { text: '    dynamicImport', color: C.func },
      { text: '(loaderPath)', color: C.text },
      { text: '?.catch', color: C.func },
      { text: '(() => ', color: C.text },
      { text: 'null', color: C.keyword },
      { text: '),', color: C.text },
    ],
    [
      { text: '    preloadRouteModules', color: C.func },
      { text: '(href),', color: C.text },
    ],
    [{ text: '  ])', color: C.text }],
  ],
}

export const SNIPPET_1 = CONFIG_SNIPPET
export const SNIPPET_2 = PRELOAD_SNIPPET

// nav links for sidebar demo
const NAV_LINKS = ['Getting Started', 'Routing', 'API Reference', 'Deployment', 'Themes']
const TARGET_IDX = 1

// pipeline items — staggered delays for waterfall effect
const PIPELINE_ITEMS = [
  { label: 'Route Bundle', delay: 50 },
  { label: 'CSS Module', delay: 60 },
  { label: 'Loader Data', delay: 70 },
  { label: 'Child Routes', delay: 80 },
]

const clamp = {
  extrapolateLeft: 'clamp' as const,
  extrapolateRight: 'clamp' as const,
}

export const PREFETCH_WINDOW_DURATION = 1340

// reusable code card
export const PrefetchCodeCard: React.FC<{
  snippet: CodeSnippet
  width?: number
}> = ({ snippet, width }) => (
  <div
    style={{
      background: '#fff',
      borderRadius: 10,
      border: '1px solid #d0d7de',
      overflow: 'hidden',
      ...(width ? { width } : {}),
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

// nav sidebar for intent demo
export const NavSidebar: React.FC<{
  targetGlow: number
}> = ({ targetGlow }) => (
  <div
    style={{
      width: 280,
      background: '#fff',
      borderRadius: 10,
      border: '1px solid #e0e0e0',
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
        borderRadius: '10px 10px 0 0',
      }}
    >
      <span
        style={{
          fontSize: 14,
          fontFamily: UI,
          fontWeight: 700,
          color: '#1f2328',
        }}
      >
        Documentation
      </span>
    </div>
    {NAV_LINKS.map((label, i) => (
      <div
        key={i}
        style={{
          padding: '12px 16px',
          borderBottom: i < NAV_LINKS.length - 1 ? '1px solid #f0f0f0' : 'none',
          background:
            i === TARGET_IDX && targetGlow > 0
              ? `rgba(59, 130, 246, ${0.1 * targetGlow})`
              : 'transparent',
          position: 'relative',
          borderRadius: i === NAV_LINKS.length - 1 ? '0 0 10px 10px' : 0,
        }}
      >
        <span
          style={{
            fontSize: 15,
            fontFamily: UI,
            fontWeight: i === TARGET_IDX ? 600 : 400,
            color: i === TARGET_IDX && targetGlow > 0 ? '#3b82f6' : '#57606a',
          }}
        >
          {label}
        </span>
        {i === TARGET_IDX && targetGlow > 0 && (
          <div
            style={{
              position: 'absolute',
              inset: -2,
              borderRadius: 6,
              border: '2px solid rgba(59, 130, 246, 0.4)',
              boxShadow: `0 0 ${12 * targetGlow}px rgba(59, 130, 246, ${0.3 * targetGlow})`,
              opacity: targetGlow,
              pointerEvents: 'none',
            }}
          />
        )}
      </div>
    ))}
  </div>
)

// pipeline visualization
export const PipelineViz: React.FC<{
  localFrame: number
}> = ({ localFrame }) => (
  <div
    style={{
      width: 380,
      background: '#1a1b1e',
      borderRadius: 10,
      overflow: 'hidden',
      border: '1px solid #2d2e32',
    }}
  >
    <div
      style={{
        height: 40,
        background: '#222326',
        borderBottom: '1px solid #2d2e32',
        display: 'flex',
        alignItems: 'center',
        padding: '0 16px',
        gap: 8,
      }}
    >
      <div style={{ display: 'flex', gap: 6 }}>
        {['#ff5f57', '#ffbd2e', '#28ca42'].map((bg) => (
          <div
            key={bg}
            style={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              background: bg,
            }}
          />
        ))}
      </div>
      <span
        style={{
          fontSize: 13,
          fontFamily: MONO,
          fontWeight: 500,
          color: '#8b949e',
          marginLeft: 8,
        }}
      >
        Preload Pipeline
      </span>
      <span style={{ fontSize: 11, fontFamily: MONO, color: '#484f58' }}>
        /docs/routing
      </span>
    </div>
    <div style={{ padding: 16 }}>
      {PIPELINE_ITEMS.map((item, i) => {
        const progress = interpolate(
          localFrame,
          [10 + item.delay, 45 + item.delay],
          [0, 100],
          clamp
        )
        const itemOp = interpolate(
          localFrame,
          [item.delay, item.delay + 8],
          [0, 1],
          clamp
        )

        return (
          <div
            key={i}
            style={{
              marginBottom: i < PIPELINE_ITEMS.length - 1 ? 14 : 0,
              opacity: itemOp,
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: 6,
              }}
            >
              <span
                style={{
                  fontSize: 13,
                  fontFamily: UI,
                  fontWeight: 600,
                  color: '#c9d1d9',
                }}
              >
                {item.label}
              </span>
              <span
                style={{
                  fontSize: 12,
                  fontFamily: MONO,
                  color: progress >= 100 ? '#8b949e' : '#484f58',
                }}
              >
                {progress >= 100 ? '\u2713' : `${Math.round(progress)}%`}
              </span>
            </div>
            <div
              style={{
                height: 6,
                background: '#2d2e32',
                borderRadius: 3,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${progress}%`,
                  background: '#8b949e',
                  borderRadius: 3,
                }}
              />
            </div>
          </div>
        )
      })}
    </div>
  </div>
)

// ======= STANDALONE SCENE =======

export const PrefetchWindowScene: React.FC = () => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  // cursor + window open
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

  // shimmer
  const shimmerSp = spring({
    frame: Math.max(0, frame - (WINDOW_OPEN + 10)),
    fps,
    config: { damping: 20, stiffness: 140 },
    durationInFrames: 25,
  })
  const shimmerOut = interpolate(frame, [S1_ENTER - 15, S1_ENTER], [1, 0], clamp)
  const placeholderOp = Math.min(shimmerSp, shimmerOut)
  const shimmerX = interpolate((frame - WINDOW_OPEN) % 40, [0, 40], [-100, 200])

  // === STAGE 1: Intent Detection ===
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

  // left content fades in after stage enters
  const s1LeftOpacity = interpolate(s1L, [30, 42], [0, 1], clamp)

  // cursor inside stage content moves toward target link
  const intentCursorX = interpolate(s1L, [45, 95], [250, 100], {
    ...clamp,
    easing: Easing.out(Easing.cubic),
  })
  const intentCursorY = interpolate(s1L, [45, 95], [240, 130], {
    ...clamp,
    easing: Easing.out(Easing.cubic),
  })
  const targetGlow = interpolate(s1L, [66, 78], [0, 1], clamp)
  const prefetchToastOp = interpolate(s1L, [74, 82], [0, 1], clamp)
  // arrow fades in 1.5s after glow
  const s1ArrOp = interpolate(s1L, [150, 160], [0, 1], clamp)
  // right card springs in after arrow
  const s1RSp = spring({
    frame: Math.max(0, s1L - 156),
    fps,
    config: { damping: 18, stiffness: 120 },
    durationInFrames: 25,
  })
  const s1RSc = interpolate(s1RSp, [0, 1], [0.85, 1])
  const s1ROp = interpolate(s1RSp, [0, 0.3], [0, 1], { extrapolateRight: 'clamp' })
  // label fades in 1.5s after right card
  const s1LblOp = interpolate(s1L, [270, 283], [0, 1], clamp)

  // === STAGE 2: Preload Pipeline ===
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

  // left content fades in after stage enters
  const s2LeftOpacity = interpolate(s2L, [30, 42], [0, 1], clamp)

  // arrow fades in 1.5s after left
  const s2ArrOp = interpolate(s2L, [150, 160], [0, 1], clamp)
  // right card springs in after arrow
  const s2RSp = spring({
    frame: Math.max(0, s2L - 156),
    fps,
    config: { damping: 18, stiffness: 120 },
    durationInFrames: 25,
  })
  const s2RSc = interpolate(s2RSp, [0, 1], [0.85, 1])
  const s2ROp = interpolate(s2RSp, [0, 0.3], [0, 1], { extrapolateRight: 'clamp' })
  // label fades in 1.5s after right card
  const s2LblOp = interpolate(s2L, [270, 283], [0, 1], clamp)

  // === STAGE 3: Code Snippets ===
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
                Smart Link Prefetching
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
                Smart Link Prefetching
              </div>

              <div style={{ flex: 1, position: 'relative' }}>
                {/* shimmer */}
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

                {/* stage 1: intent detection */}
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
                        fontSize: 24,
                        fontFamily: UI,
                        fontWeight: 600,
                        color: '#57606a',
                        opacity: s1LeftOpacity,
                      }}
                    >
                      Cursor moves toward a link...
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                      <div
                        style={{
                          position: 'relative',
                          marginRight: 200,
                          opacity: s1LeftOpacity,
                        }}
                      >
                        <NavSidebar targetGlow={targetGlow} />
                        {/* mini cursor */}
                        <svg
                          style={{
                            position: 'absolute',
                            left: intentCursorX - 6,
                            top: intentCursorY - 2,
                            pointerEvents: 'none',
                            zIndex: 10,
                          }}
                          width="16"
                          height="24"
                          viewBox="0 0 24 36"
                        >
                          <path
                            d="M2 1L2 27L8 21L13 32L17 30L12 19L19 18L2 1Z"
                            fill="white"
                            stroke="#333"
                            strokeWidth="1.5"
                            strokeLinejoin="round"
                          />
                        </svg>
                        {/* prefetch toast */}
                        {prefetchToastOp > 0 && (
                          <div
                            style={{
                              position: 'absolute',
                              left: 290,
                              top: 80,
                              background: '#1e1c19',
                              color: '#f5e6c8',
                              fontFamily: MONO,
                              fontSize: 13,
                              padding: '8px 14px',
                              borderRadius: 8,
                              opacity: prefetchToastOp,
                              whiteSpace: 'nowrap',
                              boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
                            }}
                          >
                            {'\u26A1'} prefetching /docs/routing
                          </div>
                        )}
                      </div>
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
                      <div style={{ opacity: s1ROp, transform: `scale(${s1RSc})` }}>
                        <PrefetchCodeCard snippet={CONFIG_SNIPPET} />
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
                      Intent-based — prefetches before you hover
                    </div>
                  </div>
                )}

                {/* stage 2: preload pipeline */}
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
                        fontSize: 24,
                        fontFamily: UI,
                        fontWeight: 600,
                        color: '#57606a',
                        opacity: s2LeftOpacity,
                      }}
                    >
                      Everything loads in parallel...
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                      <div style={{ opacity: s2LeftOpacity }}>
                        <PipelineViz localFrame={s2L} />
                      </div>
                      <div
                        style={{
                          fontSize: 36,
                          color: '#3b82f6',
                          fontWeight: 700,
                          opacity: s2ArrOp,
                        }}
                      >
                        {'\u2192'}
                      </div>
                      <div style={{ opacity: s2ROp, transform: `scale(${s2RSc})` }}>
                        <PrefetchCodeCard snippet={PRELOAD_SNIPPET} />
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
                      Bundle + CSS + data — zero-latency navigation
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
                    {[CONFIG_SNIPPET, PRELOAD_SNIPPET].map((snippet, si) => (
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

        {/* cursor */}
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
