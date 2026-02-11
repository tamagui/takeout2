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
import {
  MONO,
  UI,
  MiniBrowser,
  FeedCards,
  FILE_TREE,
  SNIPPET_1 as R_SNIPPET_1,
  SNIPPET_2 as R_SNIPPET_2,
} from './RoutingWindowScene'
import {
  CodeCard,
  HeaderMockup,
  OPTIONS_SNIPPET,
  COMPOSITION_SNIPPET,
  ADVANCED_SNIPPET,
  SNIPPET_1 as H_SNIPPET_1,
  SNIPPET_2 as H_SNIPPET_2,
} from './StackHeaderWindowScene'

// timeline (frames at 60fps) — 2s pause before cursor appears
const DELAY = 120
const CURSOR_START = { x: 700, y: 500 }
const ICON_CENTER = { x: 68, y: 160 }
const MOVE_START = DELAY + 8
const MOVE_END = DELAY + 35
const CLICK = DELAY + 40
const WINDOW_OPEN = DELAY + 52

// per-feature relative stage timing
const S1 = 0
const S1_EXIT = 140
const S2 = 150
const S2_EXIT = 290
const S3 = 300
const SF = 20
const FEAT_DUR = 380

// absolute feature positions
const F1 = WINDOW_OPEN + 70 // 122
const F2 = F1 + FEAT_DUR + 40 // 542

// transition
const TRANS_OUT = F1 + FEAT_DUR // 502 — f1 fades out
const TRANS_IN = F2 // 542 — f2 fades in

// camera
const ZOOM_IN_START = WINDOW_OPEN + 35
const ZOOM_IN_END = WINDOW_OPEN + 65
const ZOOM_OUT_START = F2 + FEAT_DUR - 10 // 912
const ZOOM_OUT_END = ZOOM_OUT_START + 38 // 950

// close phase
const CL_CURSOR_START = ZOOM_OUT_END + 5
const CL_CURSOR_END = CL_CURSOR_START + 25
const CL_CLICK = CL_CURSOR_END + 4
const CL_WIN_START = CL_CLICK + 4
const CL_WIN_END = CL_WIN_START + 20
const CLOSE_BTN = { x: 182, y: 122 }

export const ONE_PROMO_COMBINED_DURATION = CL_WIN_END + 12

const clamp = {
  extrapolateLeft: 'clamp' as const,
  extrapolateRight: 'clamp' as const,
}

// === ROUTING FEATURE STAGES ===

const RoutingStages: React.FC<{ localFrame: number; fps: number }> = ({
  localFrame,
  fps,
}) => {
  // stage 1
  const s1Sp = spring({
    frame: Math.max(0, localFrame - S1),
    fps,
    config: { damping: 20, stiffness: 140 },
    durationInFrames: 25,
  })
  const s1Ex = interpolate(localFrame, [S1_EXIT, S1_EXIT + SF], [1, 0], clamp)
  const st1Op = Math.min(s1Sp, s1Ex)
  const st1Y = interpolate(s1Sp, [0, 1], [15, 0])

  const s1L = Math.max(0, localFrame - S1)
  const ripProg = interpolate(s1L, [30, 48], [0, 1], clamp)
  const ripScale = interpolate(ripProg, [0, 1], [0, 2.5])
  const ripOp = interpolate(ripProg, [0, 0.3, 1], [0, 0.5, 0], clamp)
  const arrOp = interpolate(s1L, [42, 52], [0, 1], clamp)
  const rBrSp = spring({
    frame: Math.max(0, s1L - 48),
    fps,
    config: { damping: 18, stiffness: 120 },
    durationInFrames: 25,
  })
  const rBrSc = interpolate(rBrSp, [0, 1], [0.85, 1])
  const rBrOp = interpolate(rBrSp, [0, 0.3], [0, 1], {
    extrapolateRight: 'clamp',
  })
  const lblOp = interpolate(s1L, [65, 78], [0, 1], clamp)

  // stage 2
  const s2Sp = spring({
    frame: Math.max(0, localFrame - S2),
    fps,
    config: { damping: 20, stiffness: 140 },
    durationInFrames: 25,
  })
  const s2Ex = interpolate(localFrame, [S2_EXIT, S2_EXIT + SF], [1, 0], clamp)
  const st2Op = Math.min(s2Sp, s2Ex)
  const st2Y = interpolate(s2Sp, [0, 1], [15, 0])

  const s2L = Math.max(0, localFrame - S2)
  const pulsProg = interpolate(s2L, [28, 48], [0, 1], clamp)
  const pulsOp = interpolate(pulsProg, [0, 0.3, 1], [0, 0.6, 0], clamp)
  const s2ArrOp = interpolate(s2L, [42, 52], [0, 1], clamp)
  const s2RSp = spring({
    frame: Math.max(0, s2L - 48),
    fps,
    config: { damping: 18, stiffness: 120 },
    durationInFrames: 25,
  })
  const s2RSc = interpolate(s2RSp, [0, 1], [0.85, 1])
  const s2ROp = interpolate(s2RSp, [0, 0.3], [0, 1], {
    extrapolateRight: 'clamp',
  })
  const s2LblOp = interpolate(s2L, [65, 78], [0, 1], clamp)

  // stage 3
  const s3Sp = spring({
    frame: Math.max(0, localFrame - S3),
    fps,
    config: { damping: 20, stiffness: 140 },
    durationInFrames: 25,
  })
  const st3Y = interpolate(s3Sp, [0, 1], [15, 0])

  return (
    <>
      {/* stage 1: feed → modal */}
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
            When a user clicks from the feed...
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <MiniBrowser url="acme.com/feed" width={580} height={420}>
              <FeedCards highlightIndex={1} />
              {ripProg > 0 && ripProg < 1 && (
                <div
                  style={{
                    position: 'absolute',
                    left: '50%',
                    top: '22%',
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    background: 'rgba(59,130,246,0.35)',
                    transform: `translate(-50%,-50%) scale(${ripScale})`,
                    opacity: ripOp,
                    pointerEvents: 'none',
                  }}
                />
              )}
            </MiniBrowser>
            <div
              style={{
                fontSize: 36,
                color: '#3b82f6',
                fontWeight: 700,
                opacity: arrOp,
              }}
            >
              {'\u2192'}
            </div>
            <div style={{ opacity: rBrOp, transform: `scale(${rBrSc})` }}>
              <MiniBrowser url="acme.com/feed" width={580} height={420}>
                <FeedCards dimmed />
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'rgba(0,0,0,0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <div
                    style={{
                      width: '70%',
                      height: '55%',
                      background: '#fff',
                      borderRadius: 8,
                      boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <div
                      style={{
                        width: 80,
                        height: 80,
                        borderRadius: 8,
                        background: 'linear-gradient(135deg, #93c5fd, #3b82f6)',
                      }}
                    />
                  </div>
                </div>
              </MiniBrowser>
            </div>
          </div>
          <div
            style={{
              fontSize: 22,
              fontFamily: UI,
              color: '#3b82f6',
              fontWeight: 600,
              background: 'rgba(59,130,246,0.08)',
              padding: '10px 20px',
              borderRadius: 8,
              opacity: lblOp,
            }}
          >
            Photo opens as a modal overlay
          </div>
        </div>
      )}

      {/* stage 2: direct URL → full page */}
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
            When visiting the URL directly...
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <MiniBrowser url="acme.com/photo/123" width={580} height={420}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                }}
              >
                <div
                  style={{
                    width: 120,
                    height: 120,
                    borderRadius: 10,
                    background: 'linear-gradient(135deg, #93c5fd, #3b82f6)',
                  }}
                />
              </div>
              {pulsOp > 0 && (
                <div
                  style={{
                    position: 'absolute',
                    top: -32,
                    left: 0,
                    right: 0,
                    height: 28,
                    borderRadius: 4,
                    background: 'rgba(59,130,246,0.25)',
                    boxShadow: '0 0 12px rgba(59,130,246,0.4)',
                    opacity: pulsOp,
                    pointerEvents: 'none',
                  }}
                />
              )}
            </MiniBrowser>
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
              <MiniBrowser url="acme.com/photo/123" width={580} height={420}>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100%',
                  }}
                >
                  <div
                    style={{
                      flex: 1,
                      margin: 8,
                      borderRadius: 6,
                      background: 'linear-gradient(135deg, #93c5fd, #3b82f6)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <div
                      style={{
                        color: '#fff',
                        fontSize: 11,
                        fontFamily: UI,
                        fontWeight: 600,
                      }}
                    >
                      Full Page View
                    </div>
                  </div>
                  <div
                    style={{
                      padding: '0 8px 8px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 4,
                    }}
                  >
                    <div
                      style={{
                        height: 6,
                        borderRadius: 3,
                        background: '#e0e0e0',
                        width: '80%',
                      }}
                    />
                    <div
                      style={{
                        height: 6,
                        borderRadius: 3,
                        background: '#e0e0e0',
                        width: '60%',
                      }}
                    />
                  </div>
                </div>
              </MiniBrowser>
            </div>
          </div>
          <div
            style={{
              fontSize: 22,
              fontFamily: UI,
              color: '#3b82f6',
              fontWeight: 600,
              background: 'rgba(59,130,246,0.08)',
              padding: '10px 20px',
              borderRadius: 8,
              opacity: s2LblOp,
            }}
          >
            Same component renders as full page
          </div>
        </div>
      )}

      {/* stage 3: file tree + code snippets */}
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
                  borderBottom: i < FILE_TREE.length - 1 ? '1px solid #f0f0f0' : 'none',
                }}
              >
                <Img
                  src={staticFile(
                    entry.isFolder ? 'icons/folder2.png' : 'icons/note.png'
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
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 20,
              justifyContent: 'center',
            }}
          >
            {[R_SNIPPET_1, R_SNIPPET_2].map((snippet, si) => (
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
                      {line.map((token, ti) => (
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
        </div>
      )}
    </>
  )
}

// === STACK HEADER FEATURE STAGES ===

const StackHeaderStages: React.FC<{
  localFrame: number
  fps: number
}> = ({ localFrame, fps }) => {
  // stage 1
  const s1Sp = spring({
    frame: Math.max(0, localFrame - S1),
    fps,
    config: { damping: 20, stiffness: 140 },
    durationInFrames: 25,
  })
  const s1Ex = interpolate(localFrame, [S1_EXIT, S1_EXIT + SF], [1, 0], clamp)
  const st1Op = Math.min(s1Sp, s1Ex)
  const st1Y = interpolate(s1Sp, [0, 1], [15, 0])

  const s1L = Math.max(0, localFrame - S1)
  const hlProg = interpolate(s1L, [30, 48], [0, 1], clamp)
  const hlOp = interpolate(hlProg, [0, 0.3, 1], [0, 0.5, 0], clamp)
  const arrOp = interpolate(s1L, [42, 52], [0, 1], clamp)
  const rCSp = spring({
    frame: Math.max(0, s1L - 48),
    fps,
    config: { damping: 18, stiffness: 120 },
    durationInFrames: 25,
  })
  const rCSc = interpolate(rCSp, [0, 1], [0.85, 1])
  const rCOp = interpolate(rCSp, [0, 0.3], [0, 1], {
    extrapolateRight: 'clamp',
  })
  const lblOp = interpolate(s1L, [65, 78], [0, 1], clamp)

  // stage 2
  const s2Sp = spring({
    frame: Math.max(0, localFrame - S2),
    fps,
    config: { damping: 20, stiffness: 140 },
    durationInFrames: 25,
  })
  const s2Ex = interpolate(localFrame, [S2_EXIT, S2_EXIT + SF], [1, 0], clamp)
  const st2Op = Math.min(s2Sp, s2Ex)
  const st2Y = interpolate(s2Sp, [0, 1], [15, 0])

  const s2L = Math.max(0, localFrame - S2)
  const glowProg = interpolate(s2L, [28, 48], [0, 1], clamp)
  const glowOp = interpolate(glowProg, [0, 0.3, 1], [0, 0.6, 0], clamp)
  const s2ArrOp = interpolate(s2L, [42, 52], [0, 1], clamp)
  const s2RSp = spring({
    frame: Math.max(0, s2L - 48),
    fps,
    config: { damping: 18, stiffness: 120 },
    durationInFrames: 25,
  })
  const s2RSc = interpolate(s2RSp, [0, 1], [0.85, 1])
  const s2ROp = interpolate(s2RSp, [0, 0.3], [0, 1], {
    extrapolateRight: 'clamp',
  })
  const s2LblOp = interpolate(s2L, [65, 78], [0, 1], clamp)

  // stage 3
  const s3Sp = spring({
    frame: Math.max(0, localFrame - S3),
    fps,
    config: { damping: 20, stiffness: 140 },
    durationInFrames: 25,
  })
  const st3Y = interpolate(s3Sp, [0, 1], [15, 0])

  return (
    <>
      {/* stage 1: options → composition */}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <div style={{ position: 'relative' }}>
              <CodeCard snippet={OPTIONS_SNIPPET} />
              {hlOp > 0 && (
                <div
                  style={{
                    position: 'absolute',
                    inset: -4,
                    borderRadius: 12,
                    border: '3px solid rgba(239,68,68,0.5)',
                    boxShadow: '0 0 16px rgba(239,68,68,0.3)',
                    opacity: hlOp,
                    pointerEvents: 'none',
                  }}
                />
              )}
            </div>
            <div
              style={{
                fontSize: 36,
                color: '#3b82f6',
                fontWeight: 700,
                opacity: arrOp,
              }}
            >
              {'\u2192'}
            </div>
            <div style={{ opacity: rCOp, transform: `scale(${rCSc})` }}>
              <CodeCard snippet={COMPOSITION_SNIPPET} />
            </div>
          </div>
          <div
            style={{
              fontSize: 22,
              fontFamily: UI,
              color: '#3b82f6',
              fontWeight: 600,
              background: 'rgba(59,130,246,0.08)',
              padding: '10px 20px',
              borderRadius: 8,
              opacity: lblOp,
            }}
          >
            Declarative JSX replaces nested options
          </div>
        </div>
      )}

      {/* stage 2: advanced → mockup */}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <div style={{ position: 'relative' }}>
              <CodeCard snippet={ADVANCED_SNIPPET} width={500} />
              {glowOp > 0 && (
                <div
                  style={{
                    position: 'absolute',
                    inset: -4,
                    borderRadius: 12,
                    border: '3px solid rgba(59,130,246,0.5)',
                    boxShadow: '0 0 16px rgba(59,130,246,0.3)',
                    opacity: glowOp,
                    pointerEvents: 'none',
                  }}
                />
              )}
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
              <Img
                src={staticFile('screenshots/HeaderStack.png')}
                style={{
                  height: 580,
                  width: Math.round(580 * (777 / 1570)),
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
              background: 'rgba(59,130,246,0.08)',
              padding: '10px 20px',
              borderRadius: 8,
              opacity: s2LblOp,
            }}
          >
            Large titles, search, buttons — all in JSX
          </div>
        </div>
      )}

      {/* stage 3: two snippets side by side */}
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
          {[H_SNIPPET_1, H_SNIPPET_2].map((snippet, si) => (
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
          ))}
        </div>
      )}
    </>
  )
}

// === COMBINED SCENE ===

export const OnePromoCombined: React.FC = () => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  // === OPEN PHASE ===
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

  // window entrance
  const winSpring = spring({
    frame: Math.max(0, frame - WINDOW_OPEN),
    fps,
    config: { damping: 16, stiffness: 100, mass: 0.9 },
    durationInFrames: 35,
  })

  // === CLOSE PHASE ===
  const closeMoveProgress = interpolate(frame, [CL_CURSOR_START, CL_CURSOR_END], [0, 1], {
    ...clamp,
    easing: Easing.bezier(0.4, 0, 0.2, 1),
  })
  const closeCursorX = interpolate(closeMoveProgress, [0, 1], [700, CLOSE_BTN.x])
  const closeCursorY = interpolate(closeMoveProgress, [0, 1], [650, CLOSE_BTN.y])
  const closeCursorIn = interpolate(
    frame,
    [CL_CURSOR_START - 5, CL_CURSOR_START],
    [0, 1],
    clamp
  )
  const closeCursorOut = interpolate(frame, [CL_WIN_END - 5, CL_WIN_END], [1, 0], clamp)
  const isCloseClicking = frame >= CL_CLICK && frame < CL_CLICK + 6
  const closeClickScale = isCloseClicking ? 0.82 : 1

  // window exit
  const winCloseProgress = interpolate(frame, [CL_WIN_START, CL_WIN_END], [0, 1], {
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

  // cursor phases
  const isOpenPhase = frame < WINDOW_OPEN + 60
  const finalCursorX = isOpenPhase ? cursorX : closeCursorX
  const finalCursorY = isOpenPhase ? cursorY : closeCursorY
  const finalCursorOpacity = isOpenPhase
    ? cursorIn * cursorOut
    : closeCursorIn * closeCursorOut
  const finalClickScale = isOpenPhase ? clickScale : closeClickScale

  // === CAMERA ZOOM ===
  const zoomIn = interpolate(frame, [ZOOM_IN_START, ZOOM_IN_END], [1, 1.18], {
    ...clamp,
    easing: Easing.inOut(Easing.cubic),
  })
  const zoomOut = interpolate(frame, [ZOOM_OUT_START, ZOOM_OUT_END], [1.18, 1], {
    ...clamp,
    easing: Easing.inOut(Easing.cubic),
  })
  const cameraZoom = Math.min(zoomIn, zoomOut)

  // === INITIAL SHIMMER (during zoom, before F1) ===
  const shimmerIn = spring({
    frame: Math.max(0, frame - (WINDOW_OPEN + 10)),
    fps,
    config: { damping: 20, stiffness: 140 },
    durationInFrames: 25,
  })
  const shimmerOut = interpolate(frame, [F1 - 15, F1], [1, 0], clamp)
  const initShimmerOp = Math.min(shimmerIn, shimmerOut)
  const shimmerX = interpolate((frame - WINDOW_OPEN) % 40, [0, 40], [-100, 200])

  // === TRANSITION SHIMMER (between features) ===
  const transShimmerIn = interpolate(
    frame,
    [TRANS_OUT + 5, TRANS_OUT + 20],
    [0, 1],
    clamp
  )
  const transShimmerOut = interpolate(frame, [TRANS_IN - 10, TRANS_IN + 5], [1, 0], clamp)
  const transShimmerOp =
    Math.min(transShimmerIn, transShimmerOut) *
    (frame > TRANS_OUT && frame < TRANS_IN + 10 ? 1 : 0)
  const transShimmerX = interpolate((frame - TRANS_OUT) % 40, [0, 40], [-100, 200])

  // === FEATURE CONTENT OPACITY ===
  const f1Op = interpolate(frame, [TRANS_OUT, TRANS_OUT + 20], [1, 0], clamp)
  const f2Op = interpolate(frame, [TRANS_IN - 10, TRANS_IN + 10], [0, 1], clamp)
  const f1LocalFrame = frame - F1
  const f2LocalFrame = frame - F2

  // === TITLE CROSSFADE ===
  const titleF1Op = interpolate(frame, [TRANS_OUT, TRANS_OUT + 15], [1, 0], clamp)
  const titleF2Op = interpolate(frame, [TRANS_IN - 5, TRANS_IN + 10], [0, 1], clamp)
  const barF1Op = titleF1Op
  const barF2Op = titleF2Op

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
        {/* desktop */}
        <FakeDesktopScene />

        {/* icon highlight */}
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
                // borderBottom: '2px solid #bbb',
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
                  position: 'relative',
                }}
              >
                <span style={{ opacity: barF1Op }}>File-Based Routing — app/</span>
                {barF2Op > 0 && (
                  <span
                    style={{
                      position: 'absolute',
                      left: 0,
                      right: 0,
                      opacity: barF2Op,
                    }}
                  >
                    Stack Header — Composition API
                  </span>
                )}
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

              {/* feature title with crossfade */}
              <div
                style={{
                  fontSize: 38,
                  fontFamily: UI,
                  fontWeight: 700,
                  color: '#1f2328',
                  marginBottom: 24,
                  flexShrink: 0,
                  textAlign: 'center',
                  position: 'relative',
                  height: 48,
                }}
              >
                <span style={{ opacity: titleF1Op }}>Intercepting Routes</span>
                {titleF2Op > 0 && (
                  <span
                    style={{
                      position: 'absolute',
                      left: 0,
                      right: 0,
                      opacity: titleF2Op,
                    }}
                  >
                    Stack Header Composition API
                  </span>
                )}
              </div>

              {/* stages container */}
              <div style={{ flex: 1, position: 'relative' }}>
                {/* initial shimmer */}
                {initShimmerOp > 0 && (
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      opacity: initShimmerOp,
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

                {/* transition shimmer */}
                {transShimmerOp > 0 && (
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      opacity: transShimmerOp,
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
                            transform: `translateX(${transShimmerX}%)`,
                          }}
                        />
                      </div>
                    ))}
                  </div>
                )}

                {/* feature 1: routing */}
                {f1LocalFrame >= 0 && f1Op > 0 && (
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      opacity: f1Op,
                    }}
                  >
                    <RoutingStages localFrame={f1LocalFrame} fps={fps} />
                  </div>
                )}

                {/* feature 2: stack header */}
                {f2LocalFrame >= -10 && f2Op > 0 && (
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      opacity: f2Op,
                    }}
                  >
                    <StackHeaderStages localFrame={Math.max(0, f2LocalFrame)} fps={fps} />
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
