import { memo, useCallback, useState } from 'react'
import { useReanimatedKeyboardAnimation } from 'react-native-keyboard-controller'
import Animated, { interpolate, useAnimatedStyle } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { SizableText, View, YStack } from 'tamagui'

import { pickImageFromLibrary } from '~/helpers/media/imagePicker'
import { AIChatInput } from '~/interface/ai/AIChatInput'
import { SparkleIcon } from '~/interface/icons/phosphor/SparkleIcon'
import { KeyboardStickyFooter } from '~/interface/keyboard/KeyboardStickyFooter'
import { PageLayout } from '~/interface/pages/PageLayout'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  imageUri?: string
}

const EmptyState = memo(
  ({ style, sparklesStyle }: { style?: any; sparklesStyle?: any }) => (
    <Animated.View style={[{ alignItems: 'center', gap: 8 }, style]}>
      <Animated.View style={sparklesStyle}>
        <SparkleIcon size={52} color="$color11" />
      </Animated.View>
      <YStack items="center">
        <SizableText size="$6" fontWeight="700">
          Takeout
        </SizableText>
        <SizableText size="$4" color="$color10" px="$6" text="center">
          Your AI-powered assistant
        </SizableText>
      </YStack>
    </Animated.View>
  )
)

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
  const [selectedImage, setSelectedImage] = useState<string | null>(null)

  const { progress, height } = useReanimatedKeyboardAnimation()

  const sparklesAnimatedStyle = useAnimatedStyle(() => {
    const rotation = interpolate(progress.value, [0, 1], [0, 90])
    return {
      transform: [{ rotate: `${rotation}deg` }],
    }
  })

  const emptyStateStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: height.value * 0.3 }],
    }
  })

  const handleSend = useCallback((content: string, imageUri?: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      imageUri,
    }
    setMessages((prev) => [...prev, userMessage])
    setSelectedImage(null)

    // TODO: send to AI and get response
  }, [])

  const handlePlusPress = useCallback(async () => {
    const result = await pickImageFromLibrary(false)
    if (result && !result.canceled && result.assets?.[0]) {
      setSelectedImage(result.assets[0].uri)
    }
  }, [])

  const handleRemoveImage = useCallback(() => {
    setSelectedImage(null)
  }, [])

  const renderItem = useCallback(
    ({ item }: { item: Message }) => <MessageBubble message={item} />,
    []
  )

  const keyExtractor = useCallback((item: Message) => item.id, [])

  const ListEmptyComponent = useCallback(
    () => <EmptyState style={emptyStateStyle} sparklesStyle={sparklesAnimatedStyle} />,
    [emptyStateStyle, sparklesAnimatedStyle]
  )

  return (
    <PageLayout>
      <Animated.FlatList
        data={messages}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        ListEmptyComponent={ListEmptyComponent}
        contentContainerStyle={{
          flexGrow: 1,
          paddingTop: insets.top + 60,
          paddingBottom: 100,
          paddingHorizontal: 16,
          gap: 12,
          ...(messages.length === 0 && {
            justifyContent: 'center',
            alignItems: 'center',
          }),
        }}
        showsVerticalScrollIndicator={false}
        keyboardDismissMode="interactive"
        inverted={messages.length > 0}
      />

      <KeyboardStickyFooter>
        <AIChatInput
          onSend={handleSend}
          onPlusPress={handlePlusPress}
          selectedImage={selectedImage}
          onRemoveImage={handleRemoveImage}
        />
      </KeyboardStickyFooter>
    </PageLayout>
  )
})
