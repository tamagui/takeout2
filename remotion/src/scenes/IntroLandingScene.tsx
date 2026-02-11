import { CameraMotionBlur } from '@remotion/motion-blur'
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame,
} from 'remotion'

const FONT =
  "'SF Mono', 'Fira Code', 'Cascadia Code', Menlo, Monaco, 'Courier New', monospace"

// timeline (at 60fps)
const TERMINAL_FADE_IN = 182
const TYPING_START = 202
const TYPING_END = 282
const LOADING_START = 290
const TRANSITION_START = 340
const SCENE_END = 400

// ball physics timeline — 4 bounces with proper physics easing
const DROP_FRAMES = [0, 45] as const // fall from sky
const BOUNCE1_UP = [45, 63] as const // big bounce up
const BOUNCE1_DOWN = [63, 78] as const // first bounce down
const BOUNCE2_UP = [78, 92] as const // medium bounce up
const BOUNCE2_DOWN = [92, 104] as const // second bounce down
const BOUNCE3_UP = [104, 114] as const // small bounce up
const BOUNCE3_DOWN = [114, 122] as const // third bounce down
const BOUNCE4_UP = [122, 128] as const // tiny bounce up
const BOUNCE4_DOWN = [128, 134] as const // settle
const ROLL_START = 138
const ROLL_END = 172

const BALL_START_X = -280 // starts left of center
const BALL_GROUND_Y = 0 // "ground" at center

const TEXT_TO_TYPE = 'onestack.dev'
const SPINNER_CHARS = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']

export const INTRO_LANDING_DURATION = SCENE_END

const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const

// ball position calculator — physics-based easing: decelerate up, accelerate down
function getBallY(frame: number): number {
  if (frame < DROP_FRAMES[1]) {
    return interpolate(frame, [...DROP_FRAMES], [-1200, BALL_GROUND_Y], {
      ...clamp,
      easing: Easing.in(Easing.quad),
    })
  }
  if (frame < BOUNCE1_UP[1]) {
    return interpolate(frame, [...BOUNCE1_UP], [BALL_GROUND_Y, -200], {
      ...clamp,
      easing: Easing.out(Easing.quad),
    })
  }
  if (frame < BOUNCE1_DOWN[1]) {
    return interpolate(frame, [...BOUNCE1_DOWN], [-200, BALL_GROUND_Y], {
      ...clamp,
      easing: Easing.in(Easing.quad),
    })
  }
  if (frame < BOUNCE2_UP[1]) {
    return interpolate(frame, [...BOUNCE2_UP], [BALL_GROUND_Y, -80], {
      ...clamp,
      easing: Easing.out(Easing.quad),
    })
  }
  if (frame < BOUNCE2_DOWN[1]) {
    return interpolate(frame, [...BOUNCE2_DOWN], [-80, BALL_GROUND_Y], {
      ...clamp,
      easing: Easing.in(Easing.quad),
    })
  }
  if (frame < BOUNCE3_UP[1]) {
    return interpolate(frame, [...BOUNCE3_UP], [BALL_GROUND_Y, -30], {
      ...clamp,
      easing: Easing.out(Easing.quad),
    })
  }
  if (frame < BOUNCE3_DOWN[1]) {
    return interpolate(frame, [...BOUNCE3_DOWN], [-30, BALL_GROUND_Y], {
      ...clamp,
      easing: Easing.in(Easing.quad),
    })
  }
  if (frame < BOUNCE4_UP[1]) {
    return interpolate(frame, [...BOUNCE4_UP], [BALL_GROUND_Y, -8], {
      ...clamp,
      easing: Easing.out(Easing.quad),
    })
  }
  if (frame < BOUNCE4_DOWN[1]) {
    return interpolate(frame, [...BOUNCE4_DOWN], [-8, BALL_GROUND_Y], {
      ...clamp,
      easing: Easing.in(Easing.quad),
    })
  }
  return BALL_GROUND_Y
}

// self-contained ball component — reads its own frame for Freeze compatibility
const AnimatedBall: React.FC = () => {
  const frame = useCurrentFrame()

  const ballY = getBallY(frame)

  const ballX = interpolate(frame, [ROLL_START, ROLL_END], [BALL_START_X, 0], {
    ...clamp,
    easing: Easing.out(Easing.cubic),
  })

  const ballRotation = interpolate(
    frame,
    [ROLL_START, ROLL_END],
    [0, 360],
    clamp,
  )

  return (
    <div
      style={{
        position: 'absolute',
        left: '50%',
        top: '50%',
        transform: `translate(-50%, -50%) translate(${ballX}px, ${ballY}px) rotate(${ballRotation}deg)`,
      }}
    >
      <Img
        src={staticFile('ball_circle.WEBP')}
        style={{
          width: 180,
          height: 180,
          borderRadius: '50%',
        }}
      />
    </div>
  )
}

export const IntroLandingScene: React.FC = () => {
  const frame = useCurrentFrame()

  // only blur during fast drop and roll — keep bounces crisp
  const isBallMoving =
    frame < DROP_FRAMES[1] || (frame >= ROLL_START && frame <= ROLL_END)

  // terminal fade in
  const terminalOpacity = interpolate(
    frame,
    [TERMINAL_FADE_IN, TERMINAL_FADE_IN + 20],
    [0, 1],
    clamp,
  )

  const terminalY = interpolate(
    frame,
    [TERMINAL_FADE_IN, TERMINAL_FADE_IN + 20],
    [30, 0],
    clamp,
  )

  // typing animation - character by character
  const typingProgress = interpolate(
    frame,
    [TYPING_START, TYPING_END],
    [0, TEXT_TO_TYPE.length],
    clamp,
  )
  const displayedText = TEXT_TO_TYPE.slice(0, Math.floor(typingProgress))

  // cursor blink — hidden once loading starts
  const isLoading = frame >= LOADING_START
  const cursorVisible =
    !isLoading &&
    (frame < TYPING_END
      ? frame % 30 < 20 || (frame >= TYPING_START && frame < TYPING_END)
      : frame % 30 < 20)

  // loading spinner
  const spinnerOpacity = interpolate(
    frame,
    [LOADING_START, LOADING_START + 10],
    [0, 1],
    clamp,
  )
  const spinnerIndex = Math.floor((frame - LOADING_START) / 4) % SPINNER_CHARS.length
  const spinnerChar = SPINNER_CHARS[Math.max(0, spinnerIndex)]

  // whole scene scale zoom on transition
  const sceneScale = interpolate(
    frame,
    [TRANSITION_START, SCENE_END],
    [1, 1.15],
    {
      ...clamp,
      easing: Easing.out(Easing.cubic),
    },
  )

  return (
    <AbsoluteFill>
      {/* mesh gradient background - warm sand tones */}
      <div
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          background: `
            radial-gradient(ellipse at 20% 50%, #f5e6c8 0%, transparent 50%),
            radial-gradient(ellipse at 80% 20%, #e8d5b0 0%, transparent 50%),
            radial-gradient(ellipse at 50% 80%, #f0dcc3 0%, transparent 50%),
            radial-gradient(ellipse at 70% 60%, #eddcc6 0%, transparent 40%),
            linear-gradient(135deg, #f2e0c4 0%, #e6d2b5 30%, #f0dabb 60%, #ecdbc5 100%)
          `,
          transform: `scale(${sceneScale})`,
        }}
      />

      {/* subtle noise texture overlay */}
      <div
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(0,0,0,0.03) 1px, transparent 0)`,
          backgroundSize: '24px 24px',
          transform: `scale(${sceneScale})`,
        }}
      />

      {/* main content container */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          transform: `scale(${sceneScale})`,
        }}
      >
        {/* motion trail behind ball during movement — additive blending creates subtle streak */}
        {isBallMoving && (
          <CameraMotionBlur shutterAngle={300} samples={12}>
            <AnimatedBall />
          </CameraMotionBlur>
        )}
        {/* crisp ball always on top — preserves true logo colors */}
        <AnimatedBall />

        {/* terminal input - centered well below ball */}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: `translate(-50%, 140px) translateY(${terminalY}px)`,
            opacity: terminalOpacity,
          }}
        >
          <div
            style={{
              background: 'rgba(30, 28, 25, 0.92)',
              borderRadius: 16,
              padding: '20px 36px',
              minWidth: 420,
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              boxShadow:
                '0 8px 40px rgba(0,0,0,0.18), 0 0 0 1px rgba(255,255,255,0.06)',
              backdropFilter: 'blur(20px)',
            }}
          >
            <span
              style={{
                fontFamily: FONT,
                fontSize: 28,
                color: '#8a8070',
                fontWeight: 500,
                userSelect: 'none',
              }}
            >
              $
            </span>
            <span
              style={{
                fontFamily: FONT,
                fontSize: 28,
                color: '#f5e6c8',
                fontWeight: 500,
                letterSpacing: 0.5,
              }}
            >
              {displayedText}
            </span>
            {/* cursor */}
            <span
              style={{
                fontFamily: FONT,
                fontSize: 28,
                color: '#f5ca05',
                fontWeight: 600,
                opacity: cursorVisible ? 1 : 0,
                marginLeft: -2,
              }}
            >
              |
            </span>
            {/* loading spinner */}
            {isLoading && (
              <span
                style={{
                  fontFamily: FONT,
                  fontSize: 26,
                  color: '#f5ca05',
                  fontWeight: 500,
                  opacity: spinnerOpacity,
                  marginLeft: 6,
                }}
              >
                {spinnerChar}
              </span>
            )}
          </div>
        </div>
      </div>

    </AbsoluteFill>
  )
}
