import { TransitionSeries, springTiming } from '@remotion/transitions'
import { AbsoluteFill } from 'remotion'

import { DataScene } from './scenes/DataScene'
import { FrameworkScene } from './scenes/FrameworkScene'
import { IntoTheBoxScene } from './scenes/IntoTheBoxScene'
import { LogoOrbitScene } from './scenes/LogoOrbitScene'
import { UIScene } from './scenes/UIScene'
import { WhatIfScene } from './scenes/WhatIfScene'
import { glass } from './transitions/GlassTransition'

const FPS = 60

// scene durations
const WHATIF_DURATION = Math.round(2 * FPS)
const LOGO_ORBIT_DURATION = Math.round(5 * FPS)
const FRAMEWORK_DURATION = Math.round(3.5 * FPS)
const UI_DURATION = Math.round(3 * FPS)
const DATA_DURATION = Math.round(3 * FPS)
const BOX_DURATION = Math.round(4 * FPS)

const T_DURATION = 35

export const TOTAL_DURATION =
  WHATIF_DURATION +
  LOGO_ORBIT_DURATION +
  FRAMEWORK_DURATION +
  UI_DURATION +
  DATA_DURATION +
  BOX_DURATION -
  T_DURATION * 5

export type LaunchIntroProps = {
  tagline: string
}

export const LaunchIntro: React.FC<LaunchIntroProps> = ({ tagline }) => {
  return (
    <AbsoluteFill style={{ backgroundColor: '#050505' }}>
      <TransitionSeries>
        {/* beat 1: "what if..." text */}
        <TransitionSeries.Sequence durationInFrames={WHATIF_DURATION}>
          <WhatIfScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={glass()}
          timing={springTiming({
            config: { damping: 200 },
            durationInFrames: T_DURATION,
          })}
        />

        {/* beat 2: logos orbit + converge + "just worked." */}
        <TransitionSeries.Sequence durationInFrames={LOGO_ORBIT_DURATION}>
          <LogoOrbitScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={glass()}
          timing={springTiming({
            config: { damping: 200 },
            durationInFrames: T_DURATION,
          })}
        />

        {/* beat 3: framework - one v1 */}
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

        {/* beat 4: ui - tamagui v2 */}
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

        {/* beat 5: data - zero */}
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

        {/* beat 6: into the box - finale */}
        <TransitionSeries.Sequence durationInFrames={BOX_DURATION}>
          <IntoTheBoxScene tagline={tagline} />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  )
}
