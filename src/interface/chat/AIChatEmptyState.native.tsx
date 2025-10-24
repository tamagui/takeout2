import { Sparkles } from '@tamagui/lucide-icons'
import { memo } from 'react'
import { Text, View, YStack } from 'tamagui'
import { kHeight } from '~/constants/deviceSizes'

export const AIChatEmptyState = memo(() => {
  return (
    <YStack
      flex={1}
      items="center"
      justify="center"
      px="$6"
      animation="medium"
      enterStyle={{
        opacity: 0,
        y: 20,
      }}
      opacity={1}
      y={0}
    >
      <Text
        fontSize="$7"
        fontWeight="600"
        color="$color12"
        mb="$2"
        animation="medium"
        enterStyle={{
          opacity: 0,
          y: 10,
        }}
        opacity={1}
        y={0}
      >
        HUB Assistant
      </Text>

      <Text
        fontSize="$4"
        color="$color10"
        text="center"
        lineHeight="$5"
        animation="medium"
        enterStyle={{
          opacity: 0,
          y: 10,
        }}
        opacity={1}
        y={0}
      >
        Start a conversation with our HUB to get help with anything you need.
      </Text>
    </YStack>
  )
})
