import { memo, useContext } from 'react'
import { YStack } from 'tamagui'

import { animationClamped } from '../animations/animationClamped'
import { ListItemContext } from './ListItemContext'

export const ListItemBackground = memo(() => {
  const { disableHover, variant, active, editing } = useContext(ListItemContext)

  return (
    <YStack
      fullscreen
      transition={variant === 'sidebar' ? animationClamped('quickerLessBouncy') : null}
      rounded="$4"
      z={-1}
      pointerEvents="none"
      opacity={1}
      my={1}
      {...{
        shadowColor: 'transparent',
        shadowRadius: 4,
        shadowOffset: { height: 2, width: 0 },
      }}
      {...(!disableHover &&
        !active && {
          '$group-item-hover': {
            opacity: 0.25,
            bg: '$color4',
          },
          '$group-item-press': {
            opacity: 0.1,
            bg: '$color2',
          },
        })}
      {...(active &&
        !editing && {
          bg: '$color3',
          opacity: 0.65,
          shadowColor: '$shadow3',
          shadowRadius: 4,
          shadowOffset: { height: 2, width: 0 },
          // '$group-item-hover': {
          //   bg: '$color1',
          // },
          // '$group-item-press': {
          //   bg: '$color1',
          // },
        })}
    />
  )
})
