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

// painting icon is 3rd in left column (index 2)
const CURSOR_START = { x: 700, y: 500 }
const ICON_CENTER = { x: 68, y: 261 }

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

const SPREAD_SNIPPET: CodeSnippet = {
  title: 'app/home+page.tsx',
  lines: [
    [
      { text: 'import ', color: C.keyword },
      { text: 'hero ', color: C.param },
      { text: 'from ', color: C.keyword },
      { text: "'/hero.jpg?imagedata'", color: C.string },
    ],
    [],
    [
      { text: '// hero = { src, width, height, blurDataURL }', color: C.punct },
    ],
    [],
    [
      { text: 'export ', color: C.keyword },
      { text: 'default ', color: C.keyword },
      { text: 'function ', color: C.keyword },
      { text: 'Home', color: C.func },
      { text: '() {', color: C.text },
    ],
    [
      { text: '  return ', color: C.keyword },
      { text: '(', color: C.text },
    ],
    [
      { text: '    <', color: C.text },
      { text: 'img', color: C.component },
    ],
    [
      { text: '      {', color: C.text },
      { text: '...hero', color: C.param },
      { text: '}', color: C.text },
    ],
    [
      { text: '      alt', color: C.param },
      { text: '=', color: C.text },
      { text: '"Hero image"', color: C.string },
    ],
    [
      { text: '    />', color: C.text },
    ],
    [
      { text: '  )', color: C.text },
    ],
    [{ text: '}', color: C.text }],
  ],
}

const LQIP_SNIPPET: CodeSnippet = {
  title: 'components/BlurImage.tsx',
  lines: [
    [
      { text: 'import ', color: C.keyword },
      { text: 'photo ', color: C.param },
      { text: 'from ', color: C.keyword },
      { text: "'./photo.jpg?imagedata'", color: C.string },
    ],
    [],
    [
      { text: 'const ', color: C.keyword },
      { text: '[loaded, setLoaded]', color: C.param },
      { text: ' = ', color: C.text },
      { text: 'useState', color: C.func },
      { text: '(false)', color: C.text },
    ],
    [],
    [
      { text: '// blur placeholder — instant', color: C.punct },
    ],
    [
      { text: '<', color: C.text },
      { text: 'img', color: C.component },
      { text: ' src', color: C.param },
      { text: '={photo.', color: C.text },
      { text: 'blurDataURL', color: C.param },
      { text: '}', color: C.text },
    ],
    [
      { text: '  style', color: C.param },
      { text: '={{ ', color: C.text },
      { text: 'filter', color: C.param },
      { text: ": '", color: C.text },
      { text: 'blur(20px)', color: C.string },
      { text: "' }}", color: C.text },
    ],
    [
      { text: '/>', color: C.text },
    ],
    [],
    [
      { text: '// full image — fades in on load', color: C.punct },
    ],
    [
      { text: '<', color: C.text },
      { text: 'img', color: C.component },
      { text: ' {', color: C.text },
      { text: '...photo', color: C.param },
      { text: '}', color: C.text },
    ],
    [
      { text: '  onLoad', color: C.param },
      { text: '={() => ', color: C.text },
      { text: 'setLoaded', color: C.func },
      { text: '(true)}', color: C.text },
    ],
    [
      { text: '/>', color: C.text },
    ],
  ],
}

// === VISUAL COMPONENTS ===

// metadata fields that highlight sequentially
const META_FIELDS = [
  { key: 'src', value: "'/hero.jpg'", color: C.string },
  { key: 'width', value: '1920', color: C.param },
  { key: 'height', value: '1080', color: C.param },
  { key: 'blurDataURL', value: "'data:image/jpeg;base64,...'", color: C.string },
]

// import + metadata card
const MetadataCard: React.FC<{
  localFrame: number
}> = ({ localFrame }) => (
  <div
    style={{
      width: 460,
      background: '#fff',
      borderRadius: 10,
      border: '1px solid #e0e0e0',
      overflow: 'hidden',
    }}
  >
    {/* header: import statement */}
    <div
      style={{
        padding: '14px 18px',
        background: '#f6f8fa',
        borderBottom: '1px solid #e0e0e0',
      }}
    >
      <div style={{ fontFamily: MONO, fontSize: 13, lineHeight: 1.6 }}>
        <span style={{ color: C.keyword }}>import </span>
        <span style={{ color: C.param }}>hero </span>
        <span style={{ color: C.keyword }}>from </span>
        <span style={{ color: C.string }}>'/hero.jpg</span>
        <span
          style={{
            color: '#fff',
            background: '#3b82f6',
            padding: '1px 4px',
            borderRadius: 3,
            fontSize: 12,
            fontWeight: 700,
          }}
        >
          ?imagedata
        </span>
        <span style={{ color: C.string }}>'</span>
      </div>
    </div>

    {/* returned object */}
    <div style={{ padding: '14px 18px' }}>
      <div
        style={{
          fontSize: 11,
          fontFamily: MONO,
          color: '#8b949e',
          marginBottom: 8,
          textTransform: 'uppercase',
          letterSpacing: 0.5,
        }}
      >
        returns at build time
      </div>

      <div
        style={{
          fontFamily: MONO,
          fontSize: 14,
          lineHeight: 1.7,
          color: C.punct,
        }}
      >
        {'{'}
      </div>

      {META_FIELDS.map((field, i) => {
        const highlightStart = 20 + i * 20
        const highlightProgress = interpolate(
          localFrame,
          [highlightStart, highlightStart + 12],
          [0, 1],
          clamp
        )

        return (
          <div
            key={field.key}
            style={{
              fontFamily: MONO,
              fontSize: 14,
              lineHeight: 1.7,
              paddingLeft: 16,
              paddingRight: 8,
              borderRadius: 4,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: `rgba(59, 130, 246, ${highlightProgress * 0.06})`,
            }}
          >
            <span style={{ flex: 1 }}>
              <span style={{ color: C.param }}>{field.key}</span>
              <span style={{ color: C.punct }}>: </span>
              <span style={{ color: field.color }}>{field.value}</span>
              <span style={{ color: C.punct }}>,</span>
            </span>
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: '#3b82f6',
                opacity: highlightProgress,
                transform: `scale(${interpolate(highlightProgress, [0, 1], [0.5, 1])})`,
              }}
            >
              {'\u2713'}
            </span>
          </div>
        )
      })}

      <div
        style={{
          fontFamily: MONO,
          fontSize: 14,
          lineHeight: 1.7,
          color: C.punct,
        }}
      >
        {'}'}
      </div>
    </div>
  </div>
)

// image preview card showing blur → sharp transition
const ImagePreviewCard: React.FC<{
  localFrame: number
}> = ({ localFrame }) => {
  // blur fades out as sharp image loads
  const blurOpacity = interpolate(localFrame, [0, 50], [1, 0], clamp)
  const sharpOpacity = interpolate(localFrame, [20, 60], [0, 1], clamp)
  const dimensionBadgeOp = interpolate(localFrame, [40, 50], [0, 1], clamp)
  const clsBadgeOp = interpolate(localFrame, [65, 75], [0, 1], clamp)

  return (
    <div
      style={{
        width: 380,
        background: '#fff',
        borderRadius: 10,
        border: '1px solid #e0e0e0',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          height: 36,
          background: '#f6f8fa',
          borderBottom: '1px solid #e0e0e0',
          display: 'flex',
          alignItems: 'center',
          padding: '0 14px',
          gap: 8,
        }}
      >
        <span style={{ fontSize: 13, fontFamily: UI, fontWeight: 700, color: '#1f2328' }}>
          Browser Preview
        </span>
        <div style={{ flex: 1 }} />
        <span
          style={{
            fontSize: 10,
            fontFamily: MONO,
            color: '#22c55e',
            fontWeight: 600,
            opacity: clsBadgeOp,
          }}
        >
          CLS: 0
        </span>
      </div>

      {/* image area */}
      <div
        style={{
          position: 'relative',
          height: 220,
          background: '#f0f0f0',
          overflow: 'hidden',
        }}
      >
        {/* blur placeholder layer */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            filter: 'blur(20px)',
            transform: 'scale(1.1)',
            opacity: blurOpacity,
          }}
        />

        {/* sharp image layer (gradient simulating a loaded photo) */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
            opacity: sharpOpacity,
          }}
        />

        {/* "image loaded" overlay text */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: sharpOpacity,
          }}
        >
          <span
            style={{
              fontSize: 36,
              fontFamily: UI,
              fontWeight: 700,
              color: 'rgba(255,255,255,0.9)',
              textShadow: '0 2px 8px rgba(0,0,0,0.3)',
            }}
          >
            hero.jpg
          </span>
        </div>

        {/* dimension badge */}
        <div
          style={{
            position: 'absolute',
            bottom: 10,
            right: 10,
            background: 'rgba(0,0,0,0.7)',
            borderRadius: 6,
            padding: '4px 10px',
            opacity: dimensionBadgeOp,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <span style={{ fontSize: 12, fontFamily: MONO, color: '#fff', fontWeight: 600 }}>
            1920 × 1080
          </span>
        </div>
      </div>

      {/* status bar */}
      <div
        style={{
          padding: '10px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          borderTop: '1px solid #e0e0e0',
        }}
      >
        {/* progress stages */}
        {[
          { label: 'Blur placeholder', done: blurOpacity > 0.5, color: '#8b949e' },
          { label: 'Full image', done: sharpOpacity > 0.8, color: '#22c55e' },
        ].map((step, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
            }}
          >
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: step.done ? step.color : '#e0e0e0',
              }}
            />
            <span
              style={{
                fontSize: 11,
                fontFamily: UI,
                fontWeight: 500,
                color: step.done ? step.color : '#8b949e',
              }}
            >
              {step.label}
            </span>
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

export const IMAGE_DATA_WINDOW_DURATION = TOTAL

export const ImageDataWindowScene: React.FC = () => {
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

  // === STAGE 1: metadata card → image preview ===
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
                Image Data
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
                Image Data
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

                {/* stage 1: metadata card → image preview */}
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
                      Import with ?imagedata for instant metadata...
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                      {/* metadata object card */}
                      <div style={{ opacity: s1LeftOpacity }}>
                        <MetadataCard localFrame={Math.max(0, s1L - 30)} />
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
                          build time
                        </span>
                      </div>

                      {/* image preview with blur → sharp */}
                      <div style={{ opacity: s1ROp, transform: `scale(${s1RSc})` }}>
                        <ImagePreviewCard localFrame={Math.max(0, s1L - 156)} />
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
                      Zero layout shift — blur to sharp
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
                    {[SPREAD_SNIPPET, LQIP_SNIPPET].map((snippet, si) => (
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
