import { useMemo, type ReactNode } from 'react'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import { useEvent } from 'tamagui'

export const DoubleTap = ({
  children,
  onDoubleTap,
}: {
  children: ReactNode
  onDoubleTap: () => void
}) => {
  const callback = useEvent(() => {
    onDoubleTap()
  })

  const doubleTapGesture = useMemo(() => {
    return Gesture.Tap()
      .runOnJS(true)
      .numberOfTaps(2)
      .onEnd((_, success) => {
        if (success) {
          callback()
        }
      })
  }, [callback])

  return <GestureDetector gesture={doubleTapGesture}>{children}</GestureDetector>
}
