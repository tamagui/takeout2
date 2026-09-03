import { memo, useState } from 'react'
import { AnimatePresence, Input, View, XStack, YStack } from 'tamagui'

import { GlassView } from '~/interface/effects/GlassView'
import { ArrowUpIcon } from '~/interface/icons/phosphor/ArrowUpIcon'
import { MicrophoneIcon } from '~/interface/icons/phosphor/MicrophoneIcon'
import { PlusIcon } from '~/interface/icons/phosphor/PlusIcon'
import { XIcon } from '~/interface/icons/phosphor/XIcon'
import { Image } from '~/interface/image/Image'

interface AIChatInputProps {
  onSend?: (message: string, imageUri?: string) => void
  onPlusPress?: () => void
  onMicPress?: () => void
  selectedImage?: string | null
  onRemoveImage?: () => void
}

const IMAGE_SECTION_HEIGHT = 80

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
      <View>
        <XStack p="2" gap="2" items="flex-end">
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
              <AnimatePresence>
                {hasImage && (
                  <YStack
                    key="image-preview"
                    h={`${IMAGE_SECTION_HEIGHT}px enter:0px exit:0px`}
                    opacity="1 enter:0 exit:0"
                    scale="1 enter:0.9 exit:0.9"
                    transition="300ms"
                    overflow="hidden"
                  >
                    <XStack p="3" pb={0}>
                      <View position="relative">
                        <View w={64} h={64} rounded="4" overflow="hidden">
                          <Image
                            src={selectedImage ?? ''}
                            w={64}
                            h={64}
                            objectFit="cover"
                          />
                        </View>
                        <View
                          position="absolute"
                          t={-8}
                          r={-8}
                          bg="color4"
                          w={24}
                          h={24}
                          rounded="10"
                          items="center"
                          justify="center"
                          opacity="1 press:0.7 enter:0"
                          scale="1 enter:0"
                          rotate="0deg enter:-90deg"
                          transition="quick"
                          onPress={onRemoveImage}
                        >
                          <XIcon size={14} color="$color11" />
                        </View>
                      </View>
                    </XStack>
                  </YStack>
                )}
              </AnimatePresence>

              <Input
                value={message}
                onChangeText={setMessage}
                placeholder="Type a message"
                minH={44}
                maxH={100}
                p="3"
                color="color12"
                onSubmitEditing={handleSend}
                multiline
                numberOfLines={4}
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
      </View>
    )
  },
)
