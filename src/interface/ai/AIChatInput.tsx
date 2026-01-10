import { GlassContainer } from 'expo-glass-effect'
import { memo, useState } from 'react'
import { Input, useTheme, View, XStack } from 'tamagui'

import { GlassView } from '~/interface/effects/GlassView'
import { ArrowUpIcon } from '~/interface/icons/phosphor/ArrowUpIcon'
import { MicrophoneIcon } from '~/interface/icons/phosphor/MicrophoneIcon'
import { PlusIcon } from '~/interface/icons/phosphor/PlusIcon'

interface AIChatInputProps {
  onSend?: (message: string) => void
  onPlusPress?: () => void
  onMicPress?: () => void
}

export const AIChatInput = memo(
  ({ onSend, onPlusPress, onMicPress }: AIChatInputProps) => {
    const theme = useTheme()
    const [message, setMessage] = useState('')

    const hasText = message.trim().length > 0

    const handleSend = () => {
      if (hasText) {
        onSend?.(message.trim())
        setMessage('')
      }
    }

    const handleRightButtonPress = () => {
      if (hasText) {
        handleSend()
      } else {
        onMicPress?.()
      }
    }

    return (
      <GlassContainer spacing={10}>
        <XStack p="$2" gap="$2" items="center">
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
            <Input
              unstyled
              value={message}
              onChangeText={setMessage}
              placeholder="Ask Takeout..."
              minH={44}
              maxH={100}
              p="$3"
              fontSize="$4"
              color="$color12"
              onSubmitEditing={handleSend}
              verticalAlign="top"
              rows={4}
              multiple
            />
          </GlassView>

          <GlassView
            borderRadius={22}
            containerStyle={{ width: 44, height: 44, borderRadius: 22 }}
            tintColor={hasText ? 'darkslateblue' : 'transparent'}
          >
            <View
              flex={1}
              items="center"
              justify="center"
              onPress={handleRightButtonPress}
            >
              <View
                position="absolute"
                animation="quick"
                opacity={hasText ? 1 : 0}
                scale={hasText ? 1 : 0.8}
              >
                <ArrowUpIcon size={24} color="$color11" />
              </View>
              <View
                position="absolute"
                animation="200ms"
                opacity={hasText ? 0 : 1}
                scale={hasText ? 0.8 : 1}
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
