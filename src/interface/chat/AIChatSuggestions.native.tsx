import { memo } from 'react'
import { ScrollView, TouchableOpacity } from 'react-native'
import { Text, View, XStack } from 'tamagui'

interface AIChatSuggestionsProps {
  onSelectSuggestion: (text: string) => void
  visible: boolean
}

const suggestions = [
  'Create an illustration',
  'Create a morning routine',
  'Help with coding',
  'Write an email',
  'Plan my day',
]

export const AIChatSuggestions = memo(
  ({ onSelectSuggestion, visible }: AIChatSuggestionsProps) => {
    if (!visible) return null

    return (
      <XStack
        animation="quick"
        enterStyle={{
          opacity: 0,
          y: 10,
        }}
        exitStyle={{
          opacity: 0,
          y: 10,
        }}
        opacity={1}
        y={0}
        px="$2"
        pb="$2"
        gap="$2"
      >
        {suggestions.map((suggestion, index) => (
          <TouchableOpacity
            key={suggestion}
            onPress={() => onSelectSuggestion(suggestion)}
          >
            <View
              bg="$surface"
              px="$3"
              py="$2.5"
              rounded="$10"
              animation="quick"
              enterStyle={{
                scale: 0.9,
                opacity: 0,
              }}
              scale={1}
              opacity={1}
              pressStyle={{
                scale: 0.95,
              }}
            >
              <Text fontSize="$3" color="$color11">
                {suggestion}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </XStack>
    )
  }
)
