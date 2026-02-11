import { Composition } from 'remotion'
import { z } from 'zod'

import { FeatureFlash, FEATURE_FLASH_DURATION } from './FeatureFlash'
import { LaunchIntro, TOTAL_DURATION } from './LaunchIntro'
import { RapidIntro, RAPID_INTRO_TOTAL_DURATION } from './RapidIntro'
import {
  FakeDesktopScene,
  FAKE_DESKTOP_DURATION,
} from './scenes/FakeDesktopScene'
import {
  RoutingWindowScene,
  ROUTING_WINDOW_DURATION,
} from './scenes/RoutingWindowScene'
import {
  StackHeaderWindowScene,
  STACK_HEADER_WINDOW_DURATION,
} from './scenes/StackHeaderWindowScene'
import {
  OnePromoCombined,
  ONE_PROMO_COMBINED_DURATION,
} from './scenes/OnePromoCombined'
import {
  IntroLandingScene,
  INTRO_LANDING_DURATION,
} from './scenes/IntroLandingScene'
import {
  OnePromoFull,
  ONE_PROMO_FULL_DURATION,
} from './OnePromoFull'
import {
  PrefetchWindowScene,
  PREFETCH_WINDOW_DURATION,
} from './scenes/PrefetchWindowScene'

const LaunchIntroSchema = z.object({
  tagline: z.string(),
})

export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="IntroLanding"
        component={IntroLandingScene}
        durationInFrames={INTRO_LANDING_DURATION}
        fps={60}
        width={1920}
        height={1080}
      />

      <Composition
        id="OnePromoDesktop"
        component={FakeDesktopScene}
        durationInFrames={FAKE_DESKTOP_DURATION}
        fps={60}
        width={1920}
        height={1080}
      />

      <Composition
        id="OnePromoRouting"
        component={RoutingWindowScene}
        durationInFrames={ROUTING_WINDOW_DURATION}
        fps={60}
        width={1920}
        height={1080}
      />

      <Composition
        id="OnePromoStackHeader"
        component={StackHeaderWindowScene}
        durationInFrames={STACK_HEADER_WINDOW_DURATION}
        fps={60}
        width={1920}
        height={1080}
      />

      <Composition
        id="OnePromoPrefetch"
        component={PrefetchWindowScene}
        durationInFrames={PREFETCH_WINDOW_DURATION}
        fps={60}
        width={1920}
        height={1080}
      />

      <Composition
        id="OnePromoCombined"
        component={OnePromoCombined}
        durationInFrames={ONE_PROMO_COMBINED_DURATION}
        fps={60}
        width={1920}
        height={1080}
      />

      <Composition
        id="OnePromoFull"
        component={OnePromoFull}
        durationInFrames={ONE_PROMO_FULL_DURATION}
        fps={60}
        width={1920}
        height={1080}
      />

      <Composition
        id="FeatureFlash"
        component={FeatureFlash}
        durationInFrames={FEATURE_FLASH_DURATION}
        fps={60}
        width={1920}
        height={1080}
      />

      <Composition
        id="LaunchIntro"
        component={LaunchIntro}
        durationInFrames={TOTAL_DURATION}
        fps={60}
        width={1920}
        height={1080}
        schema={LaunchIntroSchema}
        defaultProps={{
          tagline: 'ship faster. ship everywhere.',
        }}
      />

      <Composition
        id="RapidIntro"
        component={RapidIntro}
        durationInFrames={RAPID_INTRO_TOTAL_DURATION}
        fps={60}
        width={1920}
        height={1080}
      />
    </>
  )
}
