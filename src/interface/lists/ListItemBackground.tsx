import { memo, useContext } from 'react'
import { YStack } from 'tamagui'

import { transitionQuickerLessBouncyClamped } from '../animations/animationClamped'
import { ListItemContext } from './ListItemContext'

export const ListItemBackground = memo(() => {
  const { disableHover, variant, active, editing } = useContext(ListItemContext)

  return (
    <YStack
      position="absolute"
      inset={0}
      transition={variant === 'sidebar' ? transitionQuickerLessBouncyClamped : null}
      rounded="4"
      z={-1}
      pointerEvents="none"
      opacity={
        active && !editing
          ? 0.65
          : !disableHover
            ? '1 group-hover/item:0.25 group-press/item:0.1'
            : 1
      }
      my={1}
      bg={
        active && !editing
          ? 'color3'
          : !disableHover
            ? 'group-hover/item:color4 group-press/item:color2'
            : undefined
      }
      shadowColor={active && !editing ? 'shadow-color' : 'transparent'}
      shadowRadius={4}
      shadowOffset={{ height: 2, width: 0 }}
    />
  )
})
