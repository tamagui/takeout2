import { memo } from 'react'
import { SizableText } from 'tamagui'
import { abbreviateNumber } from '@take-out/helpers'

type BadgeCountProps = {
  count: number
  active?: boolean
  anchor?: 'left' | 'right'
  floating?: boolean
}

export const BadgeCount = memo(
  ({ count, active = false, anchor = 'right', floating }: BadgeCountProps) => {
    return (
      <SizableText
        bg={active ? '$blue7' : floating ? '$color1' : '$color2'}
        borderColor={active ? '$blue8' : '$color3'}
        borderWidth={0.5}
        color={active ? '$white' : '$color11'}
        fontSize={10}
        fontWeight="500"
        height={16}
        text="center"
        items="center"
        justify="center"
        lineHeight={10 * 1.5}
        position="absolute"
        {...(!floating && {
          borderWidth: 0.5,
          borderColor: '$color5',
        })}
        {...(floating && {
          shadowColor: '$shadow5',
          shadowRadius: 2,
          shadowOffset: { height: 1, width: 0 },
        })}
        {...(anchor === 'left' ? { l: -4 } : { r: -6 })}
        rounded="$10"
        select="none"
        t={-6}
        minW={16}
        z={10000000000}
      >
        {abbreviateNumber(count)}
      </SizableText>
    )
  }
)
