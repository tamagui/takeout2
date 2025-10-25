import { memo } from 'react'
import { View, XStack, YStack } from 'tamagui'
import { Pressable } from '~/interface/buttons/Pressable'
import { Image } from '~/interface/image/Image'
import { LinearGradientSeparator } from '~/interface/separators/LinearGradientSeparator'
import { BodyText } from '~/interface/text/Body'

type TransactionRowProps = {
  avatar: string
  name: string
  change: number
  amount: string
  time: string
  onBuyPress?: () => void
}

export const TransactionRow = memo(
  ({ avatar, name, change, amount, time, onBuyPress }: TransactionRowProps) => {
    return (
      <YStack>
        <XStack py="$3" items="center" justify="space-between">
          <XStack items="center" gap="$3" width="35%">
            <Image src={avatar} width={33} height={33} rounded="$10" />
            <YStack flex={1}>
              <BodyText color="$color12" numberOfLines={1}>
                {name}
              </BodyText>
            </YStack>
          </XStack>
          <Pressable width="10%" items="center" justify="center" onPress={onBuyPress}>
            <BodyText theme="green">Buy</BodyText>
          </Pressable>
          <View width="15%" items="center" justify="center">
            <BodyText color={change >= 0 ? '$green10' : '$red10'} numberOfLines={1}>
              {change >= 0 ? '+' : ''}
              {change}%
            </BodyText>
          </View>
          <YStack width="15%">
            <BodyText numberOfLines={1} color="$color9">
              ${amount}
            </BodyText>
          </YStack>
          <BodyText color="$color12">{time}</BodyText>
        </XStack>
        <LinearGradientSeparator />
      </YStack>
    )
  }
)
