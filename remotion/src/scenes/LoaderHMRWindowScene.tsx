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

// icon position
const CURSOR_START = { x: 700, y: 500 }
const ICON_CENTER = { x: 68, y: 160 }

// timeline (frames at 60fps)
const MOVE_START = 8
const MOVE_END = 35
const CLICK = 40
const WINDOW_OPEN = 52

// 2-stage layout (1 LEFT+RIGHT + 1 single-content)
const S1_ENTER = WINDOW_OPEN + 70
const S1_EXIT = WINDOW_OPEN + 460
const S2_ENTER = WINDOW_OPEN + 480
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

const LOADER_SNIPPET: CodeSnippet = {
  title: 'app/blog/[slug].tsx',
  lines: [
    [
      { text: 'import ', color: C.keyword },
      { text: '{ ', color: C.text },
      { text: 'watchFile', color: C.func },
      { text: ' } ', color: C.text },
      { text: 'from ', color: C.keyword },
      { text: "'one'", color: C.string },
    ],
    [
      { text: 'import ', color: C.keyword },
      { text: '{ ', color: C.text },
      { text: 'readFile', color: C.func },
      { text: ' } ', color: C.text },
      { text: 'from ', color: C.keyword },
      { text: "'node:fs/promises'", color: C.string },
    ],
    [],
    [
      { text: 'export ', color: C.keyword },
      { text: 'async ', color: C.keyword },
      { text: 'function ', color: C.keyword },
      { text: 'loader', color: C.func },
      { text: '({ ', color: C.text },
      { text: 'params', color: C.param },
      { text: ' }) {', color: C.text },
    ],
    [
      { text: '  ', color: C.text },
      { text: 'const ', color: C.keyword },
      { text: 'path', color: C.text },
      { text: ' = ', color: C.punct },
      { text: '`./content/${', color: C.string },
      { text: 'params.slug', color: C.param },
      { text: '}.mdx`', color: C.string },
    ],
    [
      { text: '  ', color: C.text },
      { text: 'watchFile', color: C.func },
      { text: '(path)', color: C.text },
    ],
    [
      { text: '  ', color: C.text },
      { text: 'return ', color: C.keyword },
      { text: 'await ', color: C.keyword },
      { text: 'readFile', color: C.func },
      { text: '(path, ', color: C.text },
      { text: "'utf-8'", color: C.string },
      { text: ')', color: C.text },
    ],
    [{ text: '}', color: C.text }],
  ],
}

// file tree
type TreeEntry = {
  indent: number
  name: string
  isFolder: boolean
  active?: boolean
}

const FILE_TREE: TreeEntry[] = [
  { indent: 0, name: '...', isFolder: true },
  { indent: 0, name: 'blog', isFolder: true },
  { indent: 1, name: '[slug].tsx', isFolder: false, active: true },
  { indent: 0, name: 'content', isFolder: true },
  { indent: 1, name: 'hello-world.mdx', isFolder: false, active: true },
  { indent: 1, name: 'getting-started.mdx', isFolder: false },
]

// mini code editor wireframe
const MiniEditor: React.FC<{
  filename: string
  lines: { text: string; color: string }[]
  saveFlash?: number
  editHighlight?: number
  width?: number
  height?: number
}> = ({ filename, lines, saveFlash = 0, editHighlight = -1, width = 560, height = 420 }) => (
  <div
    style={{
      width,
      height,
      borderRadius: 8,
      border: '1px solid #d0d7de',
      overflow: 'hidden',
      background: '#1e1e1e',
      display: 'flex',
      flexDirection: 'column',
      boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    }}
  >
    {/* editor title bar */}
    <div
      style={{
        height: 30,
        background: '#2d2d2d',
        borderBottom: '1px solid #404040',
        display: 'flex',
        alignItems: 'center',
        padding: '0 10px',
        gap: 6,
        flexShrink: 0,
      }}
    >
      <div style={{ display: 'flex', gap: 4 }}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              background: ['#FF5F57', '#FFBD2E', '#28CA42'][i],
            }}
          />
        ))}
      </div>
      <div
        style={{
          flex: 1,
          textAlign: 'center',
          fontSize: 10,
          fontFamily: MONO,
          color: '#9d9d9d',
        }}
      >
        {filename}
      </div>
    </div>

    {/* editor content */}
    <div style={{ flex: 1, padding: '12px 0', position: 'relative', overflow: 'hidden' }}>
      {lines.map((line, i) => (
        <div
          key={i}
          style={{
            display: 'flex',
            alignItems: 'center',
            height: 24,
            padding: '0 16px',
            background: i === editHighlight ? 'rgba(59, 130, 246, 0.12)' : 'transparent',
          }}
        >
          <span
            style={{
              width: 28,
              fontSize: 10,
              fontFamily: MONO,
              color: '#6e7681',
              textAlign: 'right',
              marginRight: 16,
              flexShrink: 0,
            }}
          >
            {i + 1}
          </span>
          <span
            style={{
              fontSize: 11,
              fontFamily: MONO,
              color: line.color,
              whiteSpace: 'pre',
            }}
          >
            {line.text}
          </span>
        </div>
      ))}

      {/* save flash overlay */}
      {saveFlash > 0 && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(34, 197, 94, 0.08)',
            opacity: saveFlash,
            pointerEvents: 'none',
          }}
        />
      )}
    </div>

    {/* status bar */}
    <div
      style={{
        height: 22,
        background: '#007acc',
        display: 'flex',
        alignItems: 'center',
        padding: '0 10px',
        flexShrink: 0,
      }}
    >
      <span
        style={{
          fontSize: 9,
          fontFamily: UI,
          color: '#fff',
          fontWeight: 500,
        }}
      >
        MDX
      </span>
    </div>
  </div>
)

// mini browser showing rendered page
const MiniBrowserPage: React.FC<{
  url: string
  title: string
  bodyLines: string[]
  freshGlow?: number
  width?: number
  height?: number
}> = ({ url, title, bodyLines, freshGlow = 0, width = 560, height = 420 }) => (
  <div
    style={{
      width,
      height,
      borderRadius: 8,
      border: '1px solid #d0d7de',
      overflow: 'hidden',
      background: '#fff',
      display: 'flex',
      flexDirection: 'column',
      boxShadow: freshGlow > 0
        ? `0 2px 8px rgba(0,0,0,0.06), 0 0 0 2px rgba(34,197,94,${freshGlow * 0.4})`
        : '0 2px 8px rgba(0,0,0,0.06)',
    }}
  >
    {/* browser chrome */}
    <div
      style={{
        height: 26,
        background: '#f6f8fa',
        borderBottom: '1px solid #d0d7de',
        display: 'flex',
        alignItems: 'center',
        padding: '0 8px',
        gap: 5,
        flexShrink: 0,
      }}
    >
      <div style={{ display: 'flex', gap: 4 }}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              background: ['#FF5F57', '#FFBD2E', '#28CA42'][i],
            }}
          />
        ))}
      </div>
      <div
        style={{
          flex: 1,
          background: '#fff',
          borderRadius: 4,
          border: '1px solid #e0e0e0',
          padding: '2px 8px',
          fontSize: 10,
          fontFamily: UI,
          color: '#57606a',
        }}
      >
        {url}
      </div>
    </div>

    {/* page content */}
    <div style={{ flex: 1, padding: 20, position: 'relative' }}>
      <div
        style={{
          fontSize: 18,
          fontFamily: UI,
          fontWeight: 700,
          color: '#1f2328',
          marginBottom: 14,
        }}
      >
        {title}
      </div>

      {bodyLines.map((line, i) => (
        <div
          key={i}
          style={{
            height: 8,
            borderRadius: 4,
            background: i === bodyLines.length - 1 && freshGlow > 0
              ? `rgba(34, 197, 94, ${0.15 + freshGlow * 0.25})`
              : '#e8e8e8',
            width: `${line === 'short' ? 45 : line === 'medium' ? 70 : 90}%`,
            marginBottom: 8,
          }}
        />
      ))}

      {/* new content indicator */}
      {freshGlow > 0 && (
        <div
          style={{
            marginTop: 12,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            opacity: freshGlow,
          }}
        >
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: '#22c55e',
            }}
          />
          <span
            style={{
              fontSize: 9,
              fontFamily: UI,
              fontWeight: 600,
              color: '#22c55e',
            }}
          >
            Content updated — no reload
          </span>
        </div>
      )}
    </div>
  </div>
)

export const LOADER_HMR_WINDOW_DURATION = 930

export const LoaderHMRWindowScene: React.FC = () => {
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
  const CLOSE_CURSOR_START = 870
  const CLOSE_CURSOR_END = 895
  const CLOSE_CLICK = 899
  const WIN_CLOSE_START = 903
  const WIN_CLOSE_END = 923

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
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }
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
    interpolate(winSpring, [0, 0.15], [0, 1], {
      extrapolateRight: 'clamp',
    }) * interpolate(winCloseProgress, [0, 1], [1, 0])

  // combine cursor phases
  const isOpenPhase = frame < WINDOW_OPEN + 60
  const finalCursorX = isOpenPhase ? cursorX : closeCursorX
  const finalCursorY = isOpenPhase ? cursorY : closeCursorY
  const finalCursorOpacity = isOpenPhase
    ? cursorIn * cursorOut
    : closeCursorIn * closeCursorOut
  const finalClickScale = isOpenPhase ? clickScale : closeClickScale

  // shimmer placeholder
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

  // stage 1 animations
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

  const s1LeftOpacity = interpolate(s1Local, [30, 42], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  // save flash interaction on editor
  const SAVE_START = 60
  const saveFlashProgress = interpolate(s1Local, [SAVE_START, SAVE_START + 20], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
  const saveFlashOpacity = interpolate(saveFlashProgress, [0, 0.2, 1], [0, 0.8, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  // arrow fades in 1.5s after save
  const arrowOpacity = interpolate(s1Local, [150, 160], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  // right browser springs in after arrow
  const rightSpring = spring({
    frame: Math.max(0, s1Local - 156),
    fps,
    config: { damping: 18, stiffness: 120 },
    durationInFrames: 25,
  })
  const rightScale = interpolate(rightSpring, [0, 1], [0.85, 1])
  const rightOpacity = interpolate(rightSpring, [0, 0.3], [0, 1], {
    extrapolateRight: 'clamp',
  })

  // fresh glow on browser after it appears
  const freshGlowProgress = interpolate(s1Local, [170, 200], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
  const freshGlow = interpolate(freshGlowProgress, [0, 0.3, 1], [0, 1, 0.6], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  // bottom label fades in 1.5s after right browser
  const s1LabelOpacity = interpolate(s1Local, [270, 283], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  // stage 2 animations
  const s2Spring = spring({
    frame: Math.max(0, frame - S2_ENTER),
    fps,
    config: { damping: 20, stiffness: 140 },
    durationInFrames: 25,
  })
  const stage2Opacity = s2Spring
  const stage2Y = interpolate(s2Spring, [0, 1], [15, 0])

  // camera zoom
  const ZOOM_START = WINDOW_OPEN + 35
  const ZOOM_END = WINDOW_OPEN + 65
  const zoomIn = interpolate(frame, [ZOOM_START, ZOOM_END], [1, 1.18], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.cubic),
  })

  const ZOOM_OUT_START = 830
  const ZOOM_OUT_END = 867
  const zoomOut = interpolate(frame, [ZOOM_OUT_START, ZOOM_OUT_END], [1.18, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.cubic),
  })

  const cameraZoom = Math.min(zoomIn, zoomOut)

  // editor content lines
  const editorLines = [
    { text: '---', color: '#ce9178' },
    { text: 'title: Hello World', color: '#9cdcfe' },
    { text: 'date: 2025-01-15', color: '#9cdcfe' },
    { text: '---', color: '#ce9178' },
    { text: '', color: '#d4d4d4' },
    { text: '# Welcome to my blog', color: '#569cd6' },
    { text: '', color: '#d4d4d4' },
    { text: 'This is a **great** post about', color: '#d4d4d4' },
    { text: 'building with One framework.', color: '#d4d4d4' },
    { text: '', color: '#d4d4d4' },
    { text: '## New section added here', color: '#569cd6' },
    { text: '', color: '#d4d4d4' },
    { text: 'Instant update on save!', color: '#6a9955' },
  ]

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
              top: 130,
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
                Loader HMR — watchFile()
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
              {/* dot grid */}
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
                Loader HMR
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

                {/* stage 1: edit file → instant browser update */}
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
                      Edit a content file and save...
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 20,
                      }}
                    >
                      {/* left: code editor with save flash */}
                      <div style={{ opacity: s1LeftOpacity, position: 'relative' }}>
                        <MiniEditor
                          filename="content/hello-world.mdx"
                          lines={editorLines}
                          saveFlash={saveFlashOpacity}
                          editHighlight={saveFlashProgress > 0 ? 12 : -1}
                        />
                        {/* cmd+S badge */}
                        {saveFlashOpacity > 0 && (
                          <div
                            style={{
                              position: 'absolute',
                              top: -14,
                              right: -14,
                              background: '#1e1e1e',
                              border: '1px solid #555',
                              borderRadius: 6,
                              padding: '4px 10px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 4,
                              opacity: saveFlashOpacity,
                            }}
                          >
                            <span
                              style={{
                                fontSize: 10,
                                fontFamily: MONO,
                                color: '#ccc',
                                fontWeight: 600,
                              }}
                            >
                              ⌘S
                            </span>
                          </div>
                        )}
                      </div>

                      {/* arrow */}
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: 8,
                        }}
                      >
                        <div
                          style={{
                            fontSize: 36,
                            color: '#3b82f6',
                            fontWeight: 700,
                            opacity: arrowOpacity,
                          }}
                        >
                          →
                        </div>
                        <div
                          style={{
                            fontSize: 11,
                            fontFamily: UI,
                            color: '#94a3b8',
                            fontWeight: 500,
                            opacity: arrowOpacity,
                            textAlign: 'center',
                            lineHeight: 1.3,
                          }}
                        >
                          instant
                        </div>
                      </div>

                      {/* right: browser showing updated page */}
                      <div
                        style={{
                          opacity: rightOpacity,
                          transform: `scale(${rightScale})`,
                        }}
                      >
                        <MiniBrowserPage
                          url="localhost:3000/blog/hello-world"
                          title="Welcome to my blog"
                          bodyLines={[
                            'long',
                            'long',
                            'medium',
                            'long',
                            'short',
                            'long',
                            'medium',
                          ]}
                          freshGlow={rightOpacity > 0.5 ? freshGlow : 0}
                        />
                      </div>
                    </div>

                    <div
                      style={{
                        fontSize: 66,
                        fontFamily: UI,
                        color: '#57606a',
                        fontWeight: 600,
                        opacity: s1LabelOpacity,
                      }}
                    >
                      Loader re-runs, page updates instantly
                    </div>
                  </div>
                )}

                {/* stage 2: file tree + code */}
                {stage2Opacity > 0 && (
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      opacity: stage2Opacity,
                      transform: `translateY(${stage2Y}px)`,
                      display: 'flex',
                      gap: 24,
                      overflow: 'hidden',
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                  >
                    {/* file tree card */}
                    <div
                      style={{
                        width: 300,
                        flexShrink: 0,
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
                        }}
                      >
                        <span
                          style={{
                            fontSize: 13,
                            fontFamily: UI,
                            fontWeight: 600,
                            color: '#57606a',
                          }}
                        >
                          app/
                        </span>
                      </div>

                      {FILE_TREE.map((entry, i) => (
                        <div
                          key={`${entry.name}-${i}`}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            height: 46,
                            paddingLeft: 18 + entry.indent * 22,
                            paddingRight: 14,
                            borderBottom:
                              i < FILE_TREE.length - 1
                                ? '1px solid #f0f0f0'
                                : 'none',
                          }}
                        >
                          <Img
                            src={staticFile(
                              entry.isFolder
                                ? 'icons/folder2.png'
                                : 'icons/note.png'
                            )}
                            style={{
                              width: 22,
                              height: 22,
                              objectFit: 'contain',
                              marginRight: 10,
                              flexShrink: 0,
                              opacity: 0.7,
                            }}
                          />
                          <span
                            style={{
                              fontSize: 17,
                              fontFamily: UI,
                              fontWeight: entry.isFolder ? 600 : 400,
                              color: '#1f2328',
                              flex: 1,
                            }}
                          >
                            {entry.name}
                          </span>
                          {entry.active && (
                            <div
                              style={{
                                width: 10,
                                height: 10,
                                borderRadius: '50%',
                                background: '#3b82f6',
                                flexShrink: 0,
                              }}
                            />
                          )}
                        </div>
                      ))}
                    </div>

                    {/* code snippet */}
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 20,
                        justifyContent: 'center',
                      }}
                    >
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
                          <span style={{ fontSize: 15, color: '#6e7781' }}>
                            ⚛
                          </span>
                          <span
                            style={{
                              fontSize: 15,
                              fontFamily: MONO,
                              fontWeight: 500,
                              color: '#57606a',
                            }}
                          >
                            {LOADER_SNIPPET.title}
                          </span>
                        </div>
                        <div style={{ padding: '14px 18px' }}>
                          {LOADER_SNIPPET.lines.map((line, li) => (
                            <div
                              key={li}
                              style={{
                                fontFamily: MONO,
                                fontSize: 19,
                                lineHeight: 1.7,
                                whiteSpace: 'pre',
                                background:
                                  li === 5
                                    ? 'rgba(34, 197, 94, 0.08)'
                                    : 'transparent',
                                borderRadius: li === 5 ? 4 : 0,
                                padding: li === 5 ? '0 4px' : 0,
                                margin: li === 5 ? '0 -4px' : 0,
                              }}
                            >
                              {line.length === 0 ? (
                                '\u00A0'
                              ) : (
                                line.map((token, ti) => (
                                  <span
                                    key={ti}
                                    style={{ color: token.color }}
                                  >
                                    {token.text}
                                  </span>
                                ))
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* highlight callout */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 12,
                          padding: '14px 20px',
                          background: 'rgba(34, 197, 94, 0.08)',
                          border: '1px solid rgba(34, 197, 94, 0.25)',
                          borderRadius: 10,
                        }}
                      >
                        <div
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: '50%',
                            background: '#22c55e',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#fff',
                            fontSize: 16,
                            fontWeight: 700,
                            flexShrink: 0,
                          }}
                        >
                          ✓
                        </div>
                        <span
                          style={{
                            fontSize: 22,
                            fontFamily: UI,
                            fontWeight: 600,
                            color: '#166534',
                          }}
                        >
                          watchFile() — file changes trigger loader refresh
                        </span>
                      </div>
                    </div>
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
