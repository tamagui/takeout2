import { memo } from 'react'
import { SizableText, View, YStack } from 'tamagui'

import { SparkleIcon } from '~/interface/icons/phosphor/SparkleIcon'

export const AIPage = memo(() => {
  return (
    <YStack flex={1} items="center" justify="center" gap="$4">
      <View
        bg="$color4"
        p="$4"
        rounded="$6"
        animation="bouncy"
        enterStyle={{ scale: 0.9, opacity: 0 }}
      >
        <SparkleIcon size={48} color="$color11" />
      </View>
      <SizableText size="$6" fontWeight="700">
        AI Assistant
      </SizableText>
      <SizableText size="$4" color="$color10" px="$6">
        Your AI-powered assistant is coming soon
      </SizableText>
    </YStack>
  )
})
