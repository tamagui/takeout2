import { TransitionSeries, springTiming } from '@remotion/transitions'
import { fade } from '@remotion/transitions/fade'
import { slide } from '@remotion/transitions/slide'
import { AbsoluteFill } from 'remotion'

import { DataScene } from './scenes/DataScene'
import { FrameworkScene } from './scenes/FrameworkScene'
import { IntoTheBoxScene } from './scenes/IntoTheBoxScene'
import { OpeningScene } from './scenes/OpeningScene'
import { UIScene } from './scenes/UIScene'

const FPS = 60

// scene durations (~9s total at 60fps)
const OPENING_DURATION = Math.round(2 * FPS)
const FRAMEWORK_DURATION = Math.round(2.5 * FPS)
const UI_DURATION = Math.round(2 * FPS)
const DATA_DURATION = Math.round(1.5 * FPS)
const BOX_DURATION = Math.round(2.5 * FPS)

const T_DURATION = 25

export const TOTAL_DURATION =
  OPENING_DURATION +
  FRAMEWORK_DURATION +
  UI_DURATION +
  DATA_DURATION +
  BOX_DURATION -
  T_DURATION * 4

export type LaunchIntroProps = {
  tagline: string
}

export const LaunchIntro: React.FC<LaunchIntroProps> = ({ tagline }) => {
  return (
    <AbsoluteFill style={{ backgroundColor: '#050505' }}>
      <TransitionSeries>
        {/* beat 1: opening - floating logos + "three problems" */}
        <TransitionSeries.Sequence durationInFrames={OPENING_DURATION}>
          <OpeningScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={slide({ direction: 'from-right' })}
          timing={springTiming({
            config: { damping: 200 },
            durationInFrames: T_DURATION,
          })}
        />

        {/* beat 2: framework - one v1 */}
        <TransitionSeries.Sequence durationInFrames={FRAMEWORK_DURATION}>
          <FrameworkScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={slide({ direction: 'from-right' })}
          timing={springTiming({
            config: { damping: 200 },
            durationInFrames: T_DURATION,
          })}
        />

        {/* beat 3: ui - tamagui v2 */}
        <TransitionSeries.Sequence durationInFrames={UI_DURATION}>
          <UIScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={slide({ direction: 'from-right' })}
          timing={springTiming({
            config: { damping: 200 },
            durationInFrames: T_DURATION,
          })}
        />

        {/* beat 4: data - zero */}
        <TransitionSeries.Sequence durationInFrames={DATA_DURATION}>
          <DataScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={springTiming({
            config: { damping: 200 },
            durationInFrames: T_DURATION,
          })}
        />

        {/* beat 5: into the box - finale */}
        <TransitionSeries.Sequence durationInFrames={BOX_DURATION}>
          <IntoTheBoxScene tagline={tagline} />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  )
}
