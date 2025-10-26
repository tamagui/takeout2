import { SizableText, XStack } from 'tamagui'
import { Pressable } from '~/interface/buttons/Pressable'
import type { IconProps } from '~/interface/icons/types'

export interface InteractButtonProps {
  icon: React.ComponentType<IconProps>
  count: number
  onPress?: () => void
  active?: boolean
}

export function InteractButton({
  icon: Icon,
  count,
  onPress,
  active = false,
}: InteractButtonProps) {
  const formatReactionCount = (count: number) => {
    if (count >= 1000) {
      return `${Math.floor(count / 100) / 10}k`
    }
    return count.toString()
  }

  return (
    <XStack items="center" gap="$1.5">
      <Pressable items="center" justify="center" onPress={onPress}>
        <Icon
          size={22}
          color={active ? '$red10' : '$color11'}
          fill={active ? '$red10' : 'none'}
        />
      </Pressable>
      <SizableText minW={14} size="$3" fontWeight="600">
        {formatReactionCount(count)}
      </SizableText>
    </XStack>
  )
}
