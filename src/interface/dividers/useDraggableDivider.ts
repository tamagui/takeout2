import { useId, useLayoutEffect, useState, type MouseEvent } from 'react'
import { debounce, setOnLayoutStrategy, useEvent } from 'tamagui'
import { createEmitter } from '@vxrn/helpers'
import { throttle } from '@vxrn/helpers'

// Buffer zone for drag direction detection
const DRAG_DIRECTION_BUFFER = 2
const DRAG_DIRECTION_THROTTLE = 50 // ms

export type DraggableDividerConfig = {
  initialWidth: number
  minWidth?: number
  maxWidth?: number
  /**
   * Called on each drag event with the new width
   */
  onDrag: (newWidth: number) => void
}

export type DragDirection = 'center' | 'left' | 'right'

// Prevent unwanted text selection during dragging
// this causes expensive paints tho so do it debounced to avoid hitting animation
const preventSelection = debounce(() => {
  // NOTE: the preventSelection() slows this down a lot because it causes some expensive work
  // but if its off it allows text seleciton while dragging which looks bad
  // hard to decide which is better
  document.documentElement.classList.add('is-dragging-divider')
}, 70)

const enableSelection = () => {
  preventSelection.cancel()
  document.documentElement.classList.remove('is-dragging-divider')
}

const isDraggingSet = new Set<string>()
export const getIsDraggingDivider = () => {
  return !!isDraggingSet.size
}

export const draggableDividerEmitter = createEmitter('draggableDivider', false)

/**
 * A custom hook to add drag-to-resize functionality.
 *
 * @param config - Configuration object.
 * @returns An object containing props to spread onto your divider element and dragging state.
 */
export const useDraggableDivider = ({
  initialWidth,
  minWidth = 220,
  maxWidth = 300,
  onDrag: onDropProp,
}: DraggableDividerConfig) => {
  const [isDragging, setIsDragging] = useState(false)
  const [initialX, setInitialX] = useState(0)
  const [startWidth, setStartWidth] = useState(initialWidth)
  const [dragDirection, setDragDirection] = useState<DragDirection>('center')
  const id = useId()
  const onDrag = useEvent(onDropProp)

  const handleDragStart = (e: MouseEvent) => {
    setOnLayoutStrategy('off')
    preventSelection()
    setIsDragging(true)
    setDragDirection('center')
    draggableDividerEmitter.emit(true)
    isDraggingSet.add(id)
    setInitialX(e.clientX)
    setStartWidth(initialWidth)
  }

  useLayoutEffect(() => {
    if (!isDragging) return

    let lastX = 0
    const setLastX = (val: number) => {
      lastX = val
    }
    const setLastXThrottled = throttle(setLastX, DRAG_DIRECTION_THROTTLE)

    const handleDrag = (e: globalThis.MouseEvent) => {
      const deltaX = e.clientX - initialX
      const newWidth = Math.min(Math.max(startWidth + deltaX, minWidth), maxWidth)

      const recentDeltaX = e.clientX - lastX

      if (Math.abs(recentDeltaX) > DRAG_DIRECTION_BUFFER) {
        setDragDirection(recentDeltaX > 0 ? 'right' : 'left')
        setLastXThrottled(e.clientX)
      } else {
        setDragDirection('center')
      }

      onDrag(newWidth)
    }

    const handleDragEnd = () => {
      setIsDragging(false)
      setDragDirection('center')
      isDraggingSet.delete(id)
      if (!isDraggingSet.size) {
        draggableDividerEmitter.emit(false)
      }
      setOnLayoutStrategy('async')
      enableSelection()
    }

    document.addEventListener('mousemove', handleDrag)
    document.addEventListener('mouseup', handleDragEnd)

    return () => {
      document.removeEventListener('mousemove', handleDrag)
      document.removeEventListener('mouseup', handleDragEnd)
      enableSelection()
      setLastXThrottled.cancel()
    }
  }, [isDragging, initialX, startWidth, minWidth, maxWidth, onDrag, id])

  return {
    dragHandleProps: {
      onMouseDown: handleDragStart,
      style: { cursor: 'col-resize' },
    },
    dragDirection,
    isDragging,
  }
}
