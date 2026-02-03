import { TransitionSeries, springTiming } from '@remotion/transitions'
import { AbsoluteFill } from 'remotion'

import { RapidTextIntroScene } from './scenes/RapidTextIntroScene'
import { TakeoutRevealScene } from './scenes/TakeoutRevealScene'
import { glass } from './transitions/GlassTransition'

const FPS = 60

// 12 words * 8 frames each = 96 frames, plus intro delay
const RAPID_TEXT_DURATION = Math.round(2.5 * FPS)
const REVEAL_DURATION = Math.round(3 * FPS)
const T_DURATION = 30

export const RAPID_INTRO_TOTAL_DURATION =
  RAPID_TEXT_DURATION + REVEAL_DURATION - T_DURATION

export const RapidIntro: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: '#050505' }}>
      <TransitionSeries>
        {/* rapid text cycling */}
        <TransitionSeries.Sequence durationInFrames={RAPID_TEXT_DURATION}>
          <RapidTextIntroScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={glass()}
          timing={springTiming({
            config: { damping: 200 },
            durationInFrames: T_DURATION,
          })}
        />

        {/* takeout logo reveal */}
        <TransitionSeries.Sequence durationInFrames={REVEAL_DURATION}>
          <TakeoutRevealScene />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  )
}
