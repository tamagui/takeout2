import type { VirtuosoMessageListMethods } from '@virtuoso.dev/message-list'
import type { RefObject } from 'react'

export function scrollToBottomIfAtBottom(
  virtuosoRef: RefObject<VirtuosoMessageListMethods<any> | null>,
  isLoadingRef: RefObject<boolean>
) {
  const methods = virtuosoRef.current
  if (!methods) return
  if (isLoadingRef.current) return
  if (methods.getScrollLocation().isAtBottom) {
    methods.scrollToItem({
      index: 'LAST',
      align: 'start-no-overflow',
      behavior: 'smooth',
    })
  }
}
