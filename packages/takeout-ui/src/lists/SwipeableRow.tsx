import type { SwipeableRowProps } from './swipeableRowContract'

export type { SwipeAction, SwipeableRowProps } from './swipeableRowContract'

// web rows do not swipe: the row renders as is, and its actions stay reachable
// wherever the screen already offers them.
export function SwipeableRow({ children }: SwipeableRowProps) {
  return children
}
