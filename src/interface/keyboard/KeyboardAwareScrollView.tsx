import { ScrollView, type ScrollViewProps } from 'react-native'

import type { ReactNode } from 'react'

type KeyboardAwareScrollViewProps = ScrollViewProps & {
  children?: ReactNode
  // native-only props that we ignore on web
  bottomOffset?: number
  extraKeyboardSpace?: number
}

// web version - just a regular scroll view, ignore keyboard-specific props
export const KeyboardAwareScrollView = ({
  bottomOffset: _bottomOffset,
  extraKeyboardSpace: _extraKeyboardSpace,
  ...props
}: KeyboardAwareScrollViewProps) => {
  return <ScrollView {...props} />
}
