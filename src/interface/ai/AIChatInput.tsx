import { GlassContainer } from 'expo-glass-effect'
import { Image } from 'expo-image'
import { memo, useEffect, useState } from 'react'
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  interpolate,
} from 'react-native-reanimated'
import { Input, View, XStack, YStack } from 'tamagui'

import { GlassView } from '~/interface/effects/GlassView'
import { ArrowUpIcon } from '~/interface/icons/phosphor/ArrowUpIcon'
import { MicrophoneIcon } from '~/interface/icons/phosphor/MicrophoneIcon'
import { PlusIcon } from '~/interface/icons/phosphor/PlusIcon'
import { XIcon } from '~/interface/icons/phosphor/XIcon'

interface AIChatInputProps {
  onSend?: (message: string, imageUri?: string) => void
  onPlusPress?: () => void
  onMicPress?: () => void
  selectedImage?: string | null
  onRemoveImage?: () => void
}

const IMAGE_SECTION_HEIGHT = 80
const SPRING_CONFIG = { damping: 20, stiffness: 200, mass: 0.6 }

export const AIChatInput = memo(
  ({
    onSend,
    onPlusPress,
    onMicPress,
    selectedImage,
    onRemoveImage,
  }: AIChatInputProps) => {
    const [message, setMessage] = useState('')

    const hasText = message.trim().length > 0
    const hasImage = !!selectedImage
    const canSend = hasText || hasImage

    const imageProgress = useSharedValue(0)

    useEffect(() => {
      if (hasImage) {
        imageProgress.value = withSpring(1, SPRING_CONFIG)
      } else {
        imageProgress.value = withTiming(0, {
          duration: 200,
          easing: Easing.out(Easing.cubic),
        })
      }
    }, [hasImage])

    const imageContainerStyle = useAnimatedStyle(() => {
      const height = interpolate(imageProgress.value, [0, 1], [0, IMAGE_SECTION_HEIGHT])
      const opacity = interpolate(imageProgress.value, [0, 0.5, 1], [0, 0, 1])
      const scale = interpolate(imageProgress.value, [0, 1], [0.9, 1])

      return {
        height,
        opacity,
        transform: [{ scale }],
        overflow: 'hidden' as const,
      }
    })

    const removeButtonStyle = useAnimatedStyle(() => {
      const scale = interpolate(imageProgress.value, [0.7, 1], [0, 1])
      const rotate = interpolate(imageProgress.value, [0.7, 1], [-90, 0])

      return {
        transform: [{ scale }, { rotate: `${rotate}deg` }],
      }
    })

    const handleSend = () => {
      if (canSend) {
        onSend?.(message.trim(), selectedImage ?? undefined)
        setMessage('')
      }
    }

    const handleRightButtonPress = () => {
      if (canSend) {
        handleSend()
      } else {
        onMicPress?.()
      }
    }

    return (
      <GlassContainer spacing={10}>
        <XStack p="$2" gap="$2" items="flex-end">
          <GlassView
            borderRadius={22}
            containerStyle={{ width: 44, height: 44, borderRadius: 22 }}
          >
            <View flex={1} items="center" justify="center" onPress={onPlusPress}>
              <PlusIcon size={24} color="$color11" />
            </View>
          </GlassView>

          <GlassView
            isInteractive={false}
            borderRadius={22}
            containerStyle={{ flex: 1, borderRadius: 22 }}
          >
            <YStack>
              <Animated.View style={imageContainerStyle}>
                <XStack p="$3" pb={0}>
                  <View position="relative">
                    <Image
                      source={{ uri: selectedImage ?? '' }}
                      style={{ width: 64, height: 64, borderRadius: 12 }}
                      contentFit="cover"
                    />
                    <Animated.View
                      style={[
                        { position: 'absolute', top: -8, right: -8 },
                        removeButtonStyle,
                      ]}
                    >
                      <View
                        bg="$color4"
                        width={24}
                        height={24}
                        rounded="$10"
                        items="center"
                        justify="center"
                        onPress={onRemoveImage}
                        pressStyle={{ opacity: 0.7 }}
                      >
                        <XIcon size={14} color="$color11" />
                      </View>
                    </Animated.View>
                  </View>
                </XStack>
              </Animated.View>

              <Input
                unstyled
                value={message}
                onChangeText={setMessage}
                placeholder="Type a message"
                minH={44}
                maxH={100}
                p="$3"
                color="$color12"
                onSubmitEditing={handleSend}
                rows={4}
              />
            </YStack>
          </GlassView>

          <GlassView
            borderRadius={22}
            containerStyle={{ width: 44, height: 44, borderRadius: 22 }}
            tintColor={canSend ? 'darkslateblue' : 'transparent'}
          >
            <View
              flex={1}
              items="center"
              justify="center"
              onPress={handleRightButtonPress}
            >
              <View
                position="absolute"
                transition="quick"
                opacity={canSend ? 1 : 0}
                scale={canSend ? 1 : 0.8}
              >
                <ArrowUpIcon size={24} color="$color11" />
              </View>
              <View
                position="absolute"
                transition="200ms"
                opacity={canSend ? 0 : 1}
                scale={canSend ? 0.8 : 1}
              >
                <MicrophoneIcon size={24} color="$color11" />
              </View>
            </View>
          </GlassView>
        </XStack>
      </GlassContainer>
    )
  }
)
