import type { ReactNode } from 'react'
import type { ColorTokens } from 'tamagui'

// one trailing swipe action, shaped like UIKit's UIContextualAction: a title,
// a normal or destructive style, an optional background, and its handler.
export type SwipeAction = {
  title: string
  style?: 'normal' | 'destructive'
  backgroundColor?: ColorTokens
  color?: ColorTokens
  onPress: () => void
}

export type SwipeableRowProps = {
  actions: SwipeAction[]
  children: ReactNode
}
