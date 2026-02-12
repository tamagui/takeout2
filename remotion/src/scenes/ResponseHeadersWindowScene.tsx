import React from 'react'
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

// refresh icon is 4th in left column (index 3) — "Zero Sync"
const CURSOR_START = { x: 700, y: 500 }
const ICON_CENTER = { x: 68, y: 361 }

// timeline (frames at 60fps)
const MOVE_START = 8
const MOVE_END = 35
const CLICK = 40
const WINDOW_OPEN = 52

// 2-stage timeline (1 LEFT+RIGHT + 1 single-content code)
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

// === CODE SNIPPETS (verified from ONE source: tests/test/app/ssr/cache-headers+ssr.tsx) ===

const ISR_SNIPPET: CodeSnippet = {
  title: 'blog/[slug]+ssr.tsx',
  lines: [
    [
      { text: 'import ', color: C.keyword },
      { text: '{ ', color: C.text },
      { text: 'setResponseHeaders', color: C.func },
      { text: ', ', color: C.text },
      { text: 'useLoader', color: C.func },
      { text: ' } ', color: C.text },
      { text: 'from ', color: C.keyword },
      { text: "'one'", color: C.string },
    ],
    [],
    [
      { text: 'export ', color: C.keyword },
      { text: 'async ', color: C.keyword },
      { text: 'function ', color: C.keyword },
      { text: 'loader', color: C.func },
      { text: '() {', color: C.text },
    ],
    [
      { text: '  await ', color: C.keyword },
      { text: 'setResponseHeaders', color: C.func },
      { text: '(', color: C.text },
      { text: 'h', color: C.param },
      { text: ' => {', color: C.text },
    ],
    [
      { text: '    h.', color: C.text },
      { text: 'set', color: C.func },
      { text: '(', color: C.text },
      { text: "'Cache-Control'", color: C.string },
      { text: ',', color: C.text },
    ],
    [
      { text: "      'public, s-maxage=3600,", color: C.string },
    ],
    [
      { text: "       stale-while-revalidate=86400'", color: C.string },
      { text: ')', color: C.text },
    ],
    [
      { text: '  })', color: C.text },
    ],
    [
      { text: '  return ', color: C.keyword },
      { text: '{ ', color: C.text },
      { text: 'post', color: C.param },
      { text: ': ', color: C.text },
      { text: 'await ', color: C.keyword },
      { text: 'getPost', color: C.func },
      { text: '() }', color: C.text },
    ],
    [{ text: '}', color: C.text }],
  ],
}

// verified from ONE docs: apps/onestack.dev/data/docs/helpers-utility-functions.mdx
const COOKIE_SNIPPET: CodeSnippet = {
  title: 'auth/login+api.ts',
  lines: [
    [
      { text: 'import ', color: C.keyword },
      { text: '{ ', color: C.text },
      { text: 'setResponseHeaders', color: C.func },
      { text: ' } ', color: C.text },
      { text: 'from ', color: C.keyword },
      { text: "'one'", color: C.string },
    ],
    [],
    [
      { text: 'export ', color: C.keyword },
      { text: 'async ', color: C.keyword },
      { text: 'function ', color: C.keyword },
      { text: 'POST', color: C.func },
      { text: '(req) {', color: C.text },
    ],
    [
      { text: '  const ', color: C.keyword },
      { text: '{ ', color: C.text },
      { text: 'token', color: C.param },
      { text: ' } = ', color: C.text },
      { text: 'await ', color: C.keyword },
      { text: 'authenticate', color: C.func },
      { text: '(req)', color: C.text },
    ],
    [],
    [
      { text: '  await ', color: C.keyword },
      { text: 'setResponseHeaders', color: C.func },
      { text: '(', color: C.text },
      { text: 'h', color: C.param },
      { text: ' => {', color: C.text },
    ],
    [
      { text: '    h.', color: C.text },
      { text: 'append', color: C.func },
      { text: '(', color: C.text },
      { text: "'Set-Cookie'", color: C.string },
      { text: ',', color: C.text },
    ],
    [
      { text: "      `session=${", color: C.string },
      { text: 'token', color: C.param },
      { text: "}; HttpOnly; Secure`", color: C.string },
      { text: ')', color: C.text },
    ],
    [
      { text: '  })', color: C.text },
    ],
    [
      { text: '  return ', color: C.keyword },
      { text: 'Response', color: C.component },
      { text: '.', color: C.text },
      { text: 'json', color: C.func },
      { text: '({ ', color: C.text },
      { text: 'success', color: C.param },
      { text: ': ', color: C.text },
      { text: 'true', color: C.keyword },
      { text: ' })', color: C.text },
    ],
    [{ text: '}', color: C.text }],
  ],
}

// === VISUAL COMPONENTS ===

// header builder card showing setResponseHeaders API
const HEADER_ROWS = [
  { key: 'Cache-Control', value: 's-maxage=3600, stale-while-revalidate=86400', tag: 'ISR' as const },
  { key: 'Set-Cookie', value: 'session=abc; HttpOnly; Secure', tag: 'Auth' as const },
  { key: 'X-Custom', value: 'my-value', tag: 'Custom' as const },
]

const TAG_COLORS = {
  ISR: { bg: 'rgba(59, 130, 246, 0.08)', text: '#3b82f6', border: 'rgba(59, 130, 246, 0.2)' },
  Auth: { bg: 'rgba(168, 85, 247, 0.08)', text: '#a855f7', border: 'rgba(168, 85, 247, 0.2)' },
  Custom: { bg: 'rgba(245, 158, 11, 0.08)', text: '#f59e0b', border: 'rgba(245, 158, 11, 0.2)' },
}

const HeaderBuilderCard: React.FC<{
  localFrame: number
  glowRow: number
}> = ({ localFrame, glowRow }) => (
  <div
    style={{
      width: 460,
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
        setResponseHeaders
      </span>
      <span style={{ fontSize: 11, fontFamily: MONO, color: '#6e7781' }}>
        from 'one'
      </span>
    </div>

    {/* function signature */}
    <div
      style={{
        padding: '10px 18px',
        borderBottom: '1px solid #f0f0f0',
        fontFamily: MONO,
        fontSize: 13,
        color: '#6e7781',
      }}
    >
      <span style={{ color: C.keyword }}>await </span>
      <span style={{ color: C.func }}>setResponseHeaders</span>
      <span style={{ color: C.text }}>(</span>
      <span style={{ color: C.param }}>headers</span>
      <span style={{ color: C.text }}>{' => { ... })'}</span>
    </div>

    {HEADER_ROWS.map((row, i) => {
      const itemOp = interpolate(localFrame, [i * 16, i * 16 + 10], [0, 1], clamp)
      const isGlowing = i <= glowRow
      const tagColor = TAG_COLORS[row.tag]
      return (
        <div
          key={i}
          style={{
            padding: '12px 18px',
            borderBottom: i < HEADER_ROWS.length - 1 ? '1px solid #f0f0f0' : 'none',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            opacity: itemOp,
            position: 'relative',
            background: isGlowing
              ? `rgba(59, 130, 246, ${0.02 * glowRow})`
              : 'transparent',
          }}
        >
          {/* tag */}
          <span
            style={{
              fontSize: 9,
              fontFamily: UI,
              fontWeight: 700,
              color: tagColor.text,
              background: tagColor.bg,
              padding: '2px 6px',
              borderRadius: 3,
              textTransform: 'uppercase',
              letterSpacing: 0.5,
              border: `1px solid ${tagColor.border}`,
              flexShrink: 0,
            }}
          >
            {row.tag}
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 13,
                fontFamily: MONO,
                fontWeight: 600,
                color: '#1f2328',
              }}
            >
              {row.key}
            </div>
            <div
              style={{
                fontSize: 11,
                fontFamily: MONO,
                color: '#6e7781',
                marginTop: 2,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {row.value}
            </div>
          </div>
        </div>
      )
    })}
  </div>
)

// CDN response card showing how headers flow to the CDN
const CDN_ITEMS = [
  { icon: '\u26A1', label: 'CDN caches response', sub: 's-maxage=3600 (1 hour)' },
  { icon: '\uD83D\uDD04', label: 'Stale revalidation', sub: 'serves stale while refreshing' },
  { icon: '\uD83D\uDD12', label: 'Secure cookies set', sub: 'HttpOnly, SameSite=Strict' },
]

const CDNResponseCard: React.FC<{
  localFrame: number
}> = ({ localFrame }) => (
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
        CDN Response
      </span>
      <span style={{ fontSize: 11, fontFamily: MONO, color: '#6e7781' }}>
        200 OK
      </span>
    </div>

    {CDN_ITEMS.map((item, i) => {
      const itemOp = interpolate(localFrame, [i * 15, i * 15 + 10], [0, 1], clamp)
      return (
        <div
          key={i}
          style={{
            padding: '16px 18px',
            borderBottom: i < CDN_ITEMS.length - 1 ? '1px solid #f0f0f0' : 'none',
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            opacity: itemOp,
          }}
        >
          <span style={{ fontSize: 22 }}>{item.icon}</span>
          <div>
            <div
              style={{
                fontSize: 16,
                fontFamily: UI,
                fontWeight: 600,
                color: '#1f2328',
              }}
            >
              {item.label}
            </div>
            <div
              style={{
                fontSize: 12,
                fontFamily: MONO,
                color: '#6e7781',
                marginTop: 2,
              }}
            >
              {item.sub}
            </div>
          </div>
        </div>
      )
    })}
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

// 2 stages: 1 LEFT+RIGHT + 1 code = ~930 frames
export const RESPONSE_HEADERS_WINDOW_DURATION = TOTAL

export const ResponseHeadersWindowScene: React.FC = () => {
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

  // close animation timeline (last 100 frames, relative to TOTAL)
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

  // === STAGE 1: Header Builder → CDN Response ===
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

  // header rows glow progressively
  const GLOW_START = 60
  const glowRow = interpolate(s1L, [GLOW_START, GLOW_START + 40], [0, 2], clamp)

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

  // === STAGE 2: Code snippets ===
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
                Response Headers
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
                Response Headers
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

                {/* stage 1: header builder → CDN response */}
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
                      ISR caching, cookies, custom headers...
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                      {/* header builder card */}
                      <div style={{ opacity: s1LeftOpacity }}>
                        <HeaderBuilderCard
                          localFrame={Math.max(0, s1L - 30)}
                          glowRow={Math.floor(glowRow)}
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

                      {/* CDN response card */}
                      <div style={{ opacity: s1ROp, transform: `scale(${s1RSc})` }}>
                        <CDNResponseCard localFrame={Math.max(0, s1L - 156)} />
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
                      Full control over CDN caching and cookies
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
                    {[ISR_SNIPPET, COOKIE_SNIPPET].map((snippet, si) => (
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
