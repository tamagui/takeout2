import { Composition } from 'remotion'
import { z } from 'zod'

import { LaunchIntro, TOTAL_DURATION } from './LaunchIntro'

const LaunchIntroSchema = z.object({
  tagline: z.string(),
})

export const RemotionRoot = () => {
  return (
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
  )
}
