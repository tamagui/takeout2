import type { UniqueIdentifier } from '@dnd-kit/core'
import type { ReactNode, ReactElement } from 'react'

export function SortableList<A extends { id: UniqueIdentifier }>({
  items,
  children,
}: {
  items: A[]
  onSort?: (items: A[]) => void
  onDragStart?: ({ id }: { id: string }) => void
  disable?: boolean
  children: ReactNode
  dragOverlay?: ReactNode
}) {
  // TODO: implement native drag and drop
  return <>{children}</>
}

export function SortableItem({
  children,
}: {
  id: UniqueIdentifier
  children: ReactElement
}) {
  // TODO: implement native drag and drop
  return children
}

export function useSortableDraggingItem<T = any>(): T | null {
  // TODO: implement native drag and drop
  return null
}

export function cancelSort() {
  // TODO: implement native drag and drop
}
