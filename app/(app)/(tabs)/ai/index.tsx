import { memo } from 'react'
import Animated, {
  useAnimatedScrollHandler,
  useSharedValue,
} from 'react-native-reanimated'
import { SizableText, View, YStack } from 'tamagui'

import { AnimatedBlurHeader } from '~/interface/headers/AnimatedBlurHeader'
import { SparkleIcon } from '~/interface/icons/phosphor/SparkleIcon'

export const AIPage = memo(() => {
  const scrollY = useSharedValue(0)

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y
    },
  })

  return (
    <YStack flex={1} bg="$background">
      <AnimatedBlurHeader scrollY={scrollY} title="AI Assistant" />

      <Animated.ScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        contentContainerStyle={{
          flexGrow: 1,
          alignItems: 'center',
          justifyContent: 'center',
          paddingTop: 100,
          paddingBottom: 100,
        }}
      >
        <YStack items="center" gap="$4">
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
          <SizableText size="$4" color="$color10" px="$6" text="center">
            Your AI-powered assistant is coming soon
          </SizableText>
        </YStack>
      </Animated.ScrollView>
    </YStack>
  )
})
