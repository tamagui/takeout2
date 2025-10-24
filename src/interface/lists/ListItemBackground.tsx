import { memo, useContext } from 'react'
import { YStack } from 'tamagui'
import { useAppTheme } from '../../features/app/AppTheme'
import { animationClamped } from '../animations/animationClamped'
import { ListItemContext } from './ListItemContext'

export const ListItemBackground = memo(() => {
  const { disableHover, variant, active, editing } = useContext(ListItemContext)
  const { colors } = useAppTheme()

  return (
    <YStack
      fullscreen
      animation={variant === 'sidebar' ? animationClamped('quickerLessBouncy') : null}
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
      {...(variant === 'sidebar' && {
        // animation: animationClamped(active ? '0ms' : 'quickestLessBouncy'),
        // animateOnly: ['transform'],
        my: 1,
        rounded: '$5',
        overflow: 'hidden',
        opacity: 0,
        scale: 0.85,
        shadowColor: '$shadow2',
        shadowRadius: 4,
        shadowOffset: { height: 2, width: 0 },
        bg: colors.itemInactiveBackground,

        ...(!editing && {
          ...(active && {
            scale: 1,
            bg: colors.itemActiveBackground,
            opacity: 1,

            shadowColor: '$shadow3',
            shadowRadius: 4,
            shadowOffset: { height: 2, width: 0 },

            '$group-item-press': {
              bg: colors.itemActiveBackground,
              scale: 1,
            },
          }),
          ...(!active && {
            '$group-item-hover': {
              bg: colors.itemInactiveBackgroundHover,
              opacity: 0.8,
              scale: 1,
            },

            '$group-item-press': {
              bg: colors.itemInactiveBackgroundPress,
              opacity: 0.4,
              rounded: '$6',
              scale: 0.95,
            },
          }),
        }),
      })}
    />
  )
})
