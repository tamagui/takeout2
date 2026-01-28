import { TransitionSeries, springTiming } from '@remotion/transitions'
import { AbsoluteFill } from 'remotion'

import { DataScene } from './scenes/DataScene'
import { FrameworkScene } from './scenes/FrameworkScene'
import { FrameworkWordsScene } from './scenes/FrameworkWordsScene'
import { ShipFasterScene } from './scenes/ShipFasterScene'
import { Takeout2Scene } from './scenes/Takeout2Scene'
import { UIScene } from './scenes/UIScene'
import { URLScene } from './scenes/URLScene'
import { glass } from './transitions/GlassTransition'

const FPS = 60

// scene durations
const WORDS_DURATION = Math.round(2 * FPS)
const FRAMEWORK_DURATION = Math.round(2.5 * FPS)
const UI_DURATION = Math.round(2.5 * FPS)
const DATA_DURATION = Math.round(2 * FPS)
const URL_DURATION = Math.round(1.5 * FPS)
const SHIP_FASTER_DURATION = Math.round(2.5 * FPS)
const TAKEOUT2_DURATION = Math.round(3 * FPS)

const T_DURATION = 35

export const TOTAL_DURATION =
  WORDS_DURATION +
  FRAMEWORK_DURATION +
  UI_DURATION +
  DATA_DURATION +
  URL_DURATION +
  SHIP_FASTER_DURATION +
  TAKEOUT2_DURATION -
  T_DURATION * 6

export type LaunchIntroProps = {
  tagline: string
}

export const LaunchIntro: React.FC<LaunchIntroProps> = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: '#050505' }}>
      <TransitionSeries>
        {/* beat 1: "framework. ui. data." text */}
        <TransitionSeries.Sequence durationInFrames={WORDS_DURATION}>
          <FrameworkWordsScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={glass()}
          timing={springTiming({
            config: { damping: 200 },
            durationInFrames: T_DURATION,
          })}
        />

        {/* beat 2: One - Version 1 */}
        <TransitionSeries.Sequence durationInFrames={FRAMEWORK_DURATION}>
          <FrameworkScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={glass()}
          timing={springTiming({
            config: { damping: 200 },
            durationInFrames: T_DURATION,
          })}
        />

        {/* beat 3: Tamagui - Version 2 */}
        <TransitionSeries.Sequence durationInFrames={UI_DURATION}>
          <UIScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={glass()}
          timing={springTiming({
            config: { damping: 200 },
            durationInFrames: T_DURATION,
          })}
        />

        {/* beat 4: Zero */}
        <TransitionSeries.Sequence durationInFrames={DATA_DURATION}>
          <DataScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={glass()}
          timing={springTiming({
            config: { damping: 200 },
            durationInFrames: T_DURATION,
          })}
        />

        {/* beat 5: url */}
        <TransitionSeries.Sequence durationInFrames={URL_DURATION}>
          <URLScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={glass()}
          timing={springTiming({
            config: { damping: 200 },
            durationInFrames: T_DURATION,
          })}
        />

        {/* beat 6: "ship faster. ship everywhere." */}
        <TransitionSeries.Sequence durationInFrames={SHIP_FASTER_DURATION}>
          <ShipFasterScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={glass()}
          timing={springTiming({
            config: { damping: 200 },
            durationInFrames: T_DURATION,
          })}
        />

        {/* beat 7: Takeout 2 outro */}
        <TransitionSeries.Sequence durationInFrames={TAKEOUT2_DURATION}>
          <Takeout2Scene />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  )
}
