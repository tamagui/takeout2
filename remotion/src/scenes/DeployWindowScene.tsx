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

// native app icon is 6th in left column (index 5)
const CURSOR_START = { x: 700, y: 500 }
const ICON_CENTER = { x: 68, y: 561 }

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

// verified from ONE source: src/vite/types.ts — deploy?: 'node' | 'vercel' | 'cloudflare'
export const DEPLOY_CONFIG_SNIPPET: CodeSnippet = {
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
      { text: 'deploy', color: C.param },
      { text: ': ', color: C.text },
      { text: "'vercel'", color: C.string },
      { text: ' }', color: C.text },
    ],
    [{ text: '  })]', color: C.text }],
    [{ text: '}', color: C.text }],
  ],
}

// verified from ONE source: src/cli/build.ts — auto-generated worker entry
export const WORKER_SNIPPET: CodeSnippet = {
  title: 'worker.js — auto-generated',
  lines: [
    [
      { text: 'let ', color: C.keyword },
      { text: 'app', color: C.text },
    ],
    [],
    [
      { text: 'export default ', color: C.keyword },
      { text: '{', color: C.text },
    ],
    [
      { text: '  ', color: C.text },
      { text: 'async ', color: C.keyword },
      { text: 'fetch', color: C.func },
      { text: '(request, env, ctx) {', color: C.text },
    ],
    [
      { text: '    ', color: C.text },
      { text: 'if ', color: C.keyword },
      { text: '(!app) {', color: C.text },
    ],
    [
      { text: '      app = ', color: C.text },
      { text: 'await ', color: C.keyword },
      { text: 'serve', color: C.func },
      { text: '(buildInfo, lazyRoutes)', color: C.text },
    ],
    [{ text: '    }', color: C.text }],
    [
      { text: '    ', color: C.text },
      { text: 'return ', color: C.keyword },
      { text: 'app.', color: C.text },
      { text: 'fetch', color: C.func },
      { text: '(request)', color: C.text },
    ],
    [{ text: '  }', color: C.text }],
    [{ text: '}', color: C.text }],
  ],
}

export const SNIPPET_1 = DEPLOY_CONFIG_SNIPPET
export const SNIPPET_2 = WORKER_SNIPPET

// platforms with brand logos + colors
const PLATFORMS = [
  {
    name: 'Node.js',
    value: 'node',
    logo: 'branches/node.png',
    color: '#339933',
    activatesAt: 0,
  },
  {
    name: 'Vercel',
    value: 'vercel',
    logo: 'branches/vercel.png',
    color: '#000000',
    activatesAt: 80,
  },
  {
    name: 'Cloudflare',
    value: 'cloudflare',
    logo: 'branches/cloudflare.png',
    color: '#F38020',
    activatesAt: 130,
  },
]

// build output lines — muted monochrome
const BUILD_LINES = [
  { text: '$ one build', color: '#c9d1d9', delay: 0 },
  { text: '  \u25B8 Scanning routes...         12 found', color: '#8b949e', delay: 8 },
  { text: '  \u25B8 Bundling server entry...    done', color: '#8b949e', delay: 20 },
  { text: '  \u25B8 Generating static pages...  done', color: '#8b949e', delay: 32 },
  { text: '  \u25B8 Creating .vercel/output/    done', color: '#8b949e', delay: 44 },
  { text: '  \u2713 Ready to deploy', color: '#c9d1d9', delay: 58 },
]

const clamp = {
  extrapolateLeft: 'clamp' as const,
  extrapolateRight: 'clamp' as const,
}

export const DEPLOY_WINDOW_DURATION = 1340 // ~22.3s at 60fps

// reusable code card
export const DeployCodeCard: React.FC<{
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

// platform selector with brand logos, colors, and animated checkmark
export const PlatformSelector: React.FC<{
  activeIndex: number
  localFrame: number
}> = ({ activeIndex, localFrame }) => (
  <div
    style={{
      width: 320,
      background: '#fff',
      borderRadius: 12,
      border: '1px solid #d0d7de',
      overflow: 'hidden',
      boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
    }}
  >
    <div
      style={{
        height: 44,
        background: '#f6f8fa',
        borderBottom: '1px solid #d0d7de',
        display: 'flex',
        alignItems: 'center',
        padding: '0 16px',
      }}
    >
      <span
        style={{
          fontSize: 15,
          fontFamily: UI,
          fontWeight: 600,
          color: '#1f2328',
        }}
      >
        Deploy Target
      </span>
    </div>
    {PLATFORMS.map((platform, i) => {
      const isActive = i === activeIndex
      const checkProgress = interpolate(
        localFrame,
        [platform.activatesAt, platform.activatesAt + 10],
        [0, 1],
        clamp
      )
      const checkScale = isActive ? checkProgress : 0
      return (
        <div
          key={i}
          style={{
            padding: '14px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            borderBottom: i < PLATFORMS.length - 1 ? '1px solid #f0f0f0' : 'none',
            background: isActive ? `${platform.color}0a` : 'transparent',
          }}
        >
          <Img
            src={staticFile(platform.logo)}
            style={{
              width: 28,
              height: 28,
              objectFit: 'contain',
              opacity: isActive ? 1 : 0.35,
            }}
          />
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontSize: 15,
                fontFamily: UI,
                fontWeight: 600,
                color: isActive ? platform.color : '#8b949e',
              }}
            >
              {platform.name}
            </div>
            <div
              style={{
                fontSize: 12,
                fontFamily: MONO,
                color: '#8b949e',
                marginTop: 2,
              }}
            >
              '{platform.value}'
            </div>
          </div>
          <div
            style={{
              width: 20,
              height: 20,
              borderRadius: 10,
              background: platform.color,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 12,
              color: '#fff',
              fontWeight: 700,
              transform: `scale(${checkScale})`,
              opacity: checkScale,
            }}
          >
            {'\u2713'}
          </div>
        </div>
      )
    })}
  </div>
)

// build output terminal — clean dark card
export const BuildOutput: React.FC<{
  localFrame: number
}> = ({ localFrame }) => (
  <div
    style={{
      width: 420,
      background: '#161b22',
      borderRadius: 10,
      border: '1px solid #30363d',
      overflow: 'hidden',
      boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
    }}
  >
    <div
      style={{
        height: 32,
        background: '#21262d',
        borderBottom: '1px solid #30363d',
        display: 'flex',
        alignItems: 'center',
        padding: '0 12px',
        gap: 6,
      }}
    >
      {['#ff5f57', '#febc2e', '#28c840'].map((bg) => (
        <div
          key={bg}
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: bg,
            opacity: 0.7,
          }}
        />
      ))}
      <span
        style={{
          flex: 1,
          textAlign: 'center',
          fontSize: 11,
          fontFamily: MONO,
          color: '#8b949e',
        }}
      >
        terminal
      </span>
      <div style={{ width: 38 }} />
    </div>
    <div style={{ padding: '14px 18px' }}>
      {BUILD_LINES.map((line, i) => {
        const op = interpolate(localFrame, [line.delay, line.delay + 6], [0, 1], clamp)
        return (
          <div
            key={i}
            style={{
              fontFamily: MONO,
              fontSize: 14,
              lineHeight: 1.9,
              color: line.color,
              opacity: op,
              whiteSpace: 'pre',
            }}
          >
            {line.text}
          </div>
        )
      })}
    </div>
  </div>
)

// ======= STANDALONE SCENE =======

export const DeployWindowScene: React.FC = () => {
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
  // close animation timeline (last 100 frames)
  const CLOSE_CURSOR_START = DEPLOY_WINDOW_DURATION - 60
  const CLOSE_CURSOR_END = DEPLOY_WINDOW_DURATION - 35
  const CLOSE_CLICK = DEPLOY_WINDOW_DURATION - 31
  const WIN_CLOSE_START = DEPLOY_WINDOW_DURATION - 27
  const WIN_CLOSE_END = DEPLOY_WINDOW_DURATION - 7

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

  // window exit — shrink and fade after cursor clicks X
  const winCloseProgress = interpolate(frame, [WIN_CLOSE_START, WIN_CLOSE_END], [0, 1], {
    ...clamp,
    easing: Easing.inOut(Easing.cubic),
  })

  const winScale =
    interpolate(winSpring, [0, 1], [0.2, 1]) *
    interpolate(winCloseProgress, [0, 1], [1, 0.2])
  const winOpacity =
    interpolate(winSpring, [0, 0.15], [0, 1], {
      extrapolateRight: 'clamp',
    }) * interpolate(winCloseProgress, [0, 1], [1, 0])

  // combine cursor phases: opening (move to icon) and closing (move to X)
  const isOpenPhase = frame < WINDOW_OPEN + 60
  const finalCursorX = isOpenPhase ? cursorX : closeCursorX
  const finalCursorY = isOpenPhase ? cursorY : closeCursorY
  const finalCursorOpacity = isOpenPhase
    ? cursorIn * cursorOut
    : closeCursorIn * closeCursorOut
  const finalClickScale = isOpenPhase ? clickScale : closeClickScale

  // camera zoom in + out
  const zoomIn = interpolate(frame, [WINDOW_OPEN + 35, WINDOW_OPEN + 65], [1, 1.18], {
    ...clamp,
    easing: Easing.inOut(Easing.cubic),
  })
  const ZOOM_OUT_START = DEPLOY_WINDOW_DURATION - 100
  const ZOOM_OUT_END = DEPLOY_WINDOW_DURATION - 63
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

  // === STAGE 1: Platform selector + config ===
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

  // left content + subtitle fade in
  const s1LeftOp = interpolate(s1L, [30, 42], [0, 1], clamp)

  // platform cycling: Node → Vercel → Cloudflare
  const activePlatform = s1L < 80 ? 0 : s1L < 130 ? 1 : 2

  // arrow fades in 1.5s after interaction
  const s1ArrOp = interpolate(s1L, [150, 160], [0, 1], clamp)
  // right content springs in after arrow
  const s1RSp = spring({
    frame: Math.max(0, s1L - 156),
    fps,
    config: { damping: 18, stiffness: 120 },
    durationInFrames: 25,
  })
  const s1RSc = interpolate(s1RSp, [0, 1], [0.85, 1])
  const s1ROp = interpolate(s1RSp, [0, 0.3], [0, 1], { extrapolateRight: 'clamp' })
  // label fades in 1.5s after right content
  const s1LblOp = interpolate(s1L, [270, 283], [0, 1], clamp)

  // === STAGE 2: Build output + worker ===
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

  // left content + subtitle fade in
  const s2LeftOp = interpolate(s2L, [30, 42], [0, 1], clamp)

  // arrow fades in 1.5s after interaction
  const s2ArrOp = interpolate(s2L, [150, 160], [0, 1], clamp)
  // right content springs in after arrow
  const s2RSp = spring({
    frame: Math.max(0, s2L - 156),
    fps,
    config: { damping: 18, stiffness: 120 },
    durationInFrames: 25,
  })
  const s2RSc = interpolate(s2RSp, [0, 1], [0.85, 1])
  const s2ROp = interpolate(s2RSp, [0, 0.3], [0, 1], { extrapolateRight: 'clamp' })
  // label fades in 1.5s after right content
  const s2LblOp = interpolate(s2L, [270, 283], [0, 1], clamp)

  // === STAGE 3: Code snippets ===
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
              top: 530,
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
                Deploy Everywhere
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
                Deploy Everywhere
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

                {/* stage 1: platform selector + config */}
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
                        opacity: s1LeftOp,
                      }}
                    >
                      One config, three platforms...
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                      <div style={{ opacity: s1LeftOp }}>
                        <PlatformSelector activeIndex={activePlatform} localFrame={s1L} />
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
                        <DeployCodeCard snippet={DEPLOY_CONFIG_SNIPPET} />
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
                      One line — deploy anywhere
                    </div>
                  </div>
                )}

                {/* stage 2: build output + worker entry */}
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
                        opacity: s2LeftOp,
                      }}
                    >
                      Build generates platform output...
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                      <div style={{ opacity: s2LeftOp }}>
                        <BuildOutput localFrame={s2L} />
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
                        <DeployCodeCard snippet={WORKER_SNIPPET} />
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
                      Auto-generated worker — zero setup
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
                    {[DEPLOY_CONFIG_SNIPPET, WORKER_SNIPPET].map((snippet, si) => (
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

        {/* cursor (open phase + close phase combined) */}
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
