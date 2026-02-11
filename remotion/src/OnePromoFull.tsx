import { TransitionSeries, springTiming } from '@remotion/transitions'
import { fade } from '@remotion/transitions/fade'

import {
  IntroLandingScene,
  INTRO_LANDING_DURATION,
} from './scenes/IntroLandingScene'
import {
  OnePromoCombined,
  ONE_PROMO_COMBINED_DURATION,
} from './scenes/OnePromoCombined'

const TRANSITION_DURATION = 60

export const ONE_PROMO_FULL_DURATION =
  INTRO_LANDING_DURATION + ONE_PROMO_COMBINED_DURATION - TRANSITION_DURATION

export const OnePromoFull: React.FC = () => {
  return (
    <TransitionSeries>
      <TransitionSeries.Sequence durationInFrames={INTRO_LANDING_DURATION}>
        <IntroLandingScene />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition
        presentation={fade()}
        timing={springTiming({
          config: { damping: 200 },
          durationInFrames: TRANSITION_DURATION,
        })}
      />
      <TransitionSeries.Sequence durationInFrames={ONE_PROMO_COMBINED_DURATION}>
        <OnePromoCombined />
      </TransitionSeries.Sequence>
    </TransitionSeries>
  )
}
