import type { CSSProperties } from 'react'
import { isWeb, YStack } from 'tamagui'

export const GradientBlurDown = ({ top, bottom = 0, ...rest }: CSSProperties) => {
  if (!isWeb) return null
  // return null

  return (
    <div
      style={{
        position: 'absolute',
        top,
        left: 0,
        right: 0,
        bottom,
        contain: 'paint layout',
        ...rest,
      }}
      className="gradient-blur"
    >
      <div />
      <div />
      <div />
      <div />
      <div />
      <div />
    </div>
  )
}

export const GradientBlurUp = ({
  height = 75,
  top = 0,
}: {
  height?: number
  top?: number
}) => {
  if (!isWeb) return null
  // return null

  return (
    <YStack position="absolute" t={top} l={0} r={0} overflow="hidden" height={height}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          transform: 'scaleY(-1)',
          contain: 'paint layout',
        }}
        className="gradient-blur"
      >
        <div />
        <div />
        <div />
        <div />
        <div />
        <div />
      </div>
    </YStack>
  )
}
