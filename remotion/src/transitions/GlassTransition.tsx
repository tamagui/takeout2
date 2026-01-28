import type { TransitionPresentation, TransitionPresentationComponentProps } from '@remotion/transitions'
import { AbsoluteFill, interpolate } from 'remotion'

const GlassComponent: React.FC<
  TransitionPresentationComponentProps<Record<string, never>>
> = ({ children, presentationDirection, presentationProgress }) => {
  const isExiting = presentationDirection === 'exiting'

  const blur = isExiting
    ? interpolate(presentationProgress, [0, 1], [0, 14])
    : interpolate(presentationProgress, [0, 1], [14, 0])

  const scale = isExiting
    ? interpolate(presentationProgress, [0, 1], [1, 0.96])
    : interpolate(presentationProgress, [0, 1], [1.04, 1])

  const opacity = isExiting
    ? interpolate(presentationProgress, [0, 0.5, 1], [1, 0.7, 0])
    : interpolate(presentationProgress, [0, 0.5, 1], [0, 0.7, 1])

  const brightness = isExiting
    ? interpolate(presentationProgress, [0, 0.4, 1], [1, 1.25, 1.4])
    : interpolate(presentationProgress, [0, 0.6, 1], [1.4, 1.25, 1])

  return (
    <AbsoluteFill
      style={{
        filter: `blur(${blur}px) brightness(${brightness})`,
        transform: `scale(${scale})`,
        opacity,
      }}
    >
      {children}
    </AbsoluteFill>
  )
}

export const glass = (): TransitionPresentation<Record<string, never>> => ({
  component: GlassComponent,
  props: {},
})
