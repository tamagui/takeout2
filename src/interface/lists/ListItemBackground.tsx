import { memo, useContext } from 'react'
import { YStack } from 'tamagui'

import { animationClamped } from '../animations/animationClamped'
import { ListItemContext } from './ListItemContext'

export const ListItemBackground = memo(() => {
  const { disableHover, variant, active, editing } = useContext(ListItemContext)

  return (
    <YStack
      position="absolute"
      inset={0}
      transition={variant === 'sidebar' ? animationClamped('quickerLessBouncy') : null}
      rounded="4"
      z={-1}
      pointerEvents="none"
      opacity={1}
      my={1}
      shadowColor="transparent"
      shadowRadius={4}
      shadowOffset={{ height: 2, width: 0 }}
      {...(!disableHover &&
        !active && {
          opacity: 'group-hover/item:0.25 group-press/item:0.1',
          bg: 'group-hover/item:color4 group-press/item:color2',
        })}
      {...(active &&
        !editing && {
          bg: 'color3',
          opacity: 0.65,
          shadowColor: 'shadow3',
          shadowRadius: 4,
          shadowOffset: { height: 2, width: 0 },
        })}
    />
  )
})
