import Swipeable from 'react-native-gesture-handler/ReanimatedSwipeable'
import { SizableText, View, XStack } from 'tamagui'
import type { SwipeableRowProps } from './swipeableRowContract'

export type { SwipeAction, SwipeableRowProps } from './swipeableRowContract'

const ACTION_WIDTH = 76

// trailing swipe actions on a list row, the iOS pattern: dragging the row left
// reveals the actions, and a tapped action closes the row after it runs.
export function SwipeableRow({ actions, children }: SwipeableRowProps) {
  return (
    <Swipeable
      rightThreshold={50}
      overshootRight={false}
      renderRightActions={(_progress, _translation, swipeable) => (
        <XStack>
          {actions.map((action) => (
            <View
              key={action.title}
              bg={
                action.backgroundColor ??
                (action.style === 'destructive' ? 'red-800' : 'gray-600')
              }
              justify="center"
              items="center"
              minW={ACTION_WIDTH}
              height="100%"
              onPress={() => {
                action.onPress()
                swipeable.close()
              }}
            >
              <SizableText color={action.color ?? 'white'} size="3" fontWeight="600">
                {action.title}
              </SizableText>
            </View>
          ))}
        </XStack>
      )}
    >
      {children}
    </Swipeable>
  )
}
