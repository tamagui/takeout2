import { memo } from 'react'
import { Circle, XStack } from 'tamagui'
import { colors } from './colors'
import { validColor } from './validColor'

export const ColorsRow = memo(function ColorsRow({
  selected,
  onSelect,
}: {
  selected: number | string
  onSelect: (props: { index: number; color: string }) => void
}) {
  return (
    <XStack gap="$2" mb="$4" flexWrap="wrap" flex={1}>
      {colors.map((color, index) => {
        return (
          <Circle
            key={index}
            size={20}
            bg={validColor(color)}
            borderWidth={2}
            borderColor={
              (typeof selected === 'number' ? selected === index : selected === color)
                ? '$color'
                : 'transparent'
            }
            onPress={() => onSelect({ index, color })}
            hoverStyle={{
              borderColor: '$color',
            }}
          />
        )
      })}
    </XStack>
  )
})
