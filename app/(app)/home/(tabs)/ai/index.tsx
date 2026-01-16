// web version - no reanimated / keyboard animations

import { memo, useCallback, useState } from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { SizableText, View, YStack } from 'tamagui'

import { AIChatInput } from '~/interface/ai/AIChatInput'
import { AnimatedBlurHeader } from '~/interface/headers/AnimatedBlurHeader'
import { SparkleIcon } from '~/interface/icons/phosphor/SparkleIcon'
import { PageLayout } from '~/interface/pages/PageLayout'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
}

const EmptyState = memo(() => (
  <YStack items="center" gap="$2" flex={1} justify="center">
    <SparkleIcon size={52} color="$color11" />
    <YStack items="center">
      <SizableText size="$6" fontWeight="700">
        Takeout
      </SizableText>
      <SizableText size="$4" color="$color10" px="$6" text="center">
        Your AI-powered assistant
      </SizableText>
    </YStack>
  </YStack>
))

const MessageBubble = memo(({ message }: { message: Message }) => {
  const isUser = message.role === 'user'

  return (
    <View
      self={isUser ? 'flex-end' : 'flex-start'}
      bg={isUser ? '$color4' : '$color2'}
      px="$3"
      py="$2"
      rounded="$4"
      maxW="80%"
    >
      <SizableText size="$4" color="$color12">
        {message.content}
      </SizableText>
    </View>
  )
})

export const AIPage = memo(() => {
  const insets = useSafeAreaInsets()
  const [messages, setMessages] = useState<Message[]>([])

  const handleSend = useCallback((content: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
    }
    setMessages((prev) => [...prev, userMessage])
  }, [])

  return (
    <PageLayout>
      <AnimatedBlurHeader title="AI Assistant" />

      <View px="$4">
        {messages.length === 0 ? (
          <EmptyState />
        ) : (
          <YStack gap="$3">
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
          </YStack>
        )}
      </View>

      <YStack
        position="absolute"
        b={0}
        l={0}
        r={0}
        pb={insets.bottom}
        px="$3"
        bg="$background"
      >
        <AIChatInput onSend={handleSend} />
      </YStack>
    </PageLayout>
  )
})
