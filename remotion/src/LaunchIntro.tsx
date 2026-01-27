import { TransitionSeries, springTiming } from '@remotion/transitions'
import { fade } from '@remotion/transitions/fade'
import { useEffect, useState } from 'react'
import { AbsoluteFill } from 'remotion'

import { loadProjectFonts } from './load-fonts'
import { CTAScene } from './scenes/CTAScene'
import { HelloTakeoutScene } from './scenes/HelloTakeoutScene'
import { LogoRevealScene } from './scenes/LogoRevealScene'
import { TechStackScene } from './scenes/TechStackScene'

const FPS = 60

// scene durations (~10s total at 60fps = 600 frames)
const SCENE_1_DURATION = Math.round(3 * FPS)
const SCENE_2_DURATION = Math.round(2.5 * FPS)
const SCENE_3_DURATION = Math.round(3 * FPS)
const SCENE_4_DURATION = Math.round(3 * FPS)

// transition durations
const T1_DURATION = 30
const T2_DURATION = 30
const T3_DURATION = 30

export const TOTAL_DURATION =
  SCENE_1_DURATION +
  SCENE_2_DURATION +
  SCENE_3_DURATION +
  SCENE_4_DURATION -
  T1_DURATION -
  T2_DURATION -
  T3_DURATION

export type LaunchIntroProps = {
  tagline: string
}

export const LaunchIntro: React.FC<LaunchIntroProps> = ({ tagline }) => {
  const [fontsLoaded, setFontsLoaded] = useState(false)

  useEffect(() => {
    loadProjectFonts().then(() => setFontsLoaded(true))
  }, [])

  if (!fontsLoaded) {
    return null
  }

  return (
    <AbsoluteFill style={{ backgroundColor: '#0a0a0a' }}>
      <TransitionSeries>
        {/* scene 1: hello takeout handwriting */}
        <TransitionSeries.Sequence durationInFrames={SCENE_1_DURATION}>
          <HelloTakeoutScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={springTiming({
            config: { damping: 200 },
            durationInFrames: T1_DURATION,
          })}
        />

        {/* scene 2: logo reveal */}
        <TransitionSeries.Sequence durationInFrames={SCENE_2_DURATION}>
          <LogoRevealScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={springTiming({
            config: { damping: 200 },
            durationInFrames: T2_DURATION,
          })}
        />

        {/* scene 3: tech stack */}
        <TransitionSeries.Sequence durationInFrames={SCENE_3_DURATION}>
          <TechStackScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={springTiming({
            config: { damping: 200 },
            durationInFrames: T3_DURATION,
          })}
        />

        {/* scene 4: cta */}
        <TransitionSeries.Sequence durationInFrames={SCENE_4_DURATION}>
          <CTAScene tagline={tagline} />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  )
}
