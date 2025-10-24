import { memo } from 'react'
import { YStack, type ViewProps, type YStackProps } from 'tamagui'
import { useAppTheme } from '../../features/app/AppTheme'
import { animationClamped } from '../animations/animationClamped'
import './DraggableVerticalSeparator.css'
import type { DragDirection } from './useDraggableDivider'

const stretchAmt = 80
const height = 200

export const DraggableVerticalSeparator = memo(
  ({
    isDragging,
    dragDirection,
    ...rest
  }: YStackProps & { isDragging: boolean; dragDirection: DragDirection }) => {
    const { colors } = useAppTheme()
    const x = 0 + (dragDirection === 'left' ? -1.5 : dragDirection === 'right' ? 1.5 : 0)

    const visibleStyle = {
      x: 5 + x,
      scaleX: 1,
      scaleY: 1.15,
    } satisfies ViewProps

    return (
      <YStack
        contain="strict"
        position="absolute"
        t="50%"
        y={-(height + stretchAmt) / 2}
        x={-5}
        // bg="green"
        width={11}
        height={height + stretchAmt}
        opacity={colors.mainLayoutBackgroundOpacity}
        z={1000}
        overflow="hidden"
        {...rest}
      >
        <YStack
          className={`draggable-vertical-separator`}
          animation={animationClamped('quickest')}
          // dont animate bg so it feels snappier
          animateOnly={['height', 'transform', 'opacity']}
          width={8}
          bg={colors.mainLayoutBackground}
          position="absolute"
          t={stretchAmt / 2}
          pointerEvents="auto"
          r={0}
          transformOrigin="center center"
          y={-2}
          x={6}
          scaleX={1}
          scaleY={1}
          height={height}
          $group-item-hover={
            isDragging
              ? {}
              : {
                  scaleX: 1,
                  scaleY: 1.05,
                  x: 5,
                }
          }
          $group-item-press={visibleStyle}
          {...(isDragging && visibleStyle)}
        />
      </YStack>
    )
  }
)
