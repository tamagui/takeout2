import { memo, useCallback, useRef, useState } from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ScrollView, SizableText, Spinner, View, XStack, YStack } from 'tamagui'

import { AIChatInput } from '~/interface/ai/AIChatInput'
import { HeadInfo } from '~/interface/app/HeadInfo'
import { SparkleIcon } from '~/interface/icons/phosphor/SparkleIcon'
import { PageLayout } from '~/interface/pages/PageLayout'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
}

const EmptyState = memo(() => (
  <YStack items="center" gap="$4" flex={1} justify="center" pb="$10">
    <View
      width={80}
      height={80}
      rounded="$6"
      bg="$color3"
      items="center"
      justify="center"
    >
      <SparkleIcon size={40} color="$color11" />
    </View>
    <YStack items="center" gap="$2">
      <SizableText size="$7" fontWeight="700">
        AI Assistant
      </SizableText>
      <SizableText size="$4" color="$color10" px="$6" text="center" maxW={300}>
        Ask me anything. I'm here to help with questions, ideas, and more.
      </SizableText>
    </YStack>
  </YStack>
))

const MessageBubble = memo(({ message }: { message: Message }) => {
  const isUser = message.role === 'user'

  return (
    <View
      self={isUser ? 'flex-end' : 'flex-start'}
      bg={isUser ? '$blue9' : '$color3'}
      px="$4"
      py="$3"
      rounded="$5"
      maxW="85%"
      {...(isUser && { roundedBottomRight: '$2' })}
      {...(!isUser && { roundedBottomLeft: '$2' })}
    >
      <SizableText size="$4" color={isUser ? 'white' : '$color12'} lineHeight="$4">
        {message.content}
      </SizableText>
    </View>
  )
})

export const AIPage = memo(() => {
  const insets = useSafeAreaInsets()
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const scrollViewRef = useRef<ScrollView>(null)

  const handleSend = useCallback((content: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
    }
    setMessages((prev) => [...prev, userMessage])
    setIsLoading(true)

    // simulate AI response
    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I'm a demo AI assistant. This is a placeholder response.",
      }
      setMessages((prev) => [...prev, aiMessage])
      setIsLoading(false)
    }, 1000)
  }, [])

  return (
    <PageLayout>
      <HeadInfo title="AI" />
      <YStack flex={1} flexBasis="auto" pt={insets.top}>
        {/* messages area */}
        <ScrollView
          ref={scrollViewRef}
          flex={1}
          contentContainerStyle={{
            flex: 1,
            p: 16,
          }}
          showsVerticalScrollIndicator={false}
        >
          {messages.length === 0 ? (
            <EmptyState />
          ) : (
            <YStack gap="$3" pb="$4">
              {messages.map((message) => (
                <MessageBubble key={message.id} message={message} />
              ))}
              {isLoading && (
                <XStack self="flex-start" gap="$2" items="center" px="$2">
                  <Spinner size="small" color="$color10" />
                  <SizableText size="$3" color="$color10">
                    Thinking...
                  </SizableText>
                </XStack>
              )}
            </YStack>
          )}
        </ScrollView>

        <YStack py="$3" position="fixed" b={60} l="$4" r="$4" $md={{ b: 0 }}>
          <AIChatInput onSend={handleSend} isLoading={isLoading} />
        </YStack>
      </YStack>
    </PageLayout>
  )
})
