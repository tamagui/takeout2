import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type PointerSensorProps,
  type UniqueIdentifier,
} from '@dnd-kit/core'
import { restrictToParentElement, restrictToVerticalAxis } from '@dnd-kit/modifiers'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactElement,
  type ReactNode,
} from 'react'
import { ScrollView } from 'tamagui'

const activeSortableCancels = new Set<Function>()

export function cancelSort() {
  activeSortableCancels.forEach((cancel) => cancel())
}

type SortableContextType<T = any> = {
  dragging: T | null
}

const SortableListContext = createContext<SortableContextType>({
  dragging: null,
})

export function SortableList<A extends { id: UniqueIdentifier }>({
  items,
  onSort,
  onDragStart,
  disable = false,
  children,
  dragOverlay,
  scrollable,
}: {
  items: A[]
  onSort?: (items: A[]) => void
  onDragStart?: ({ id }: { id: string }) => void
  disable?: boolean
  children: ReactNode
  dragOverlay?: ReactNode
  scrollable?: boolean
}) {
  const [dragging, setDragging] = useState<A | null>(null)

  const sensors = useSensors(
    useSensor(CustomPointerSensor, {
      activationConstraint: {
        delay: 150,
        tolerance: 1,
        distance: {
          y: 4,
        },
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const context = useMemo(() => ({ dragging }), [dragging])

  if (disable) {
    return (
      <SortableListContext.Provider value={context}>
        {children}
      </SortableListContext.Provider>
    )
  }

  return (
    <DndContext
      sensors={sensors}
      modifiers={[restrictToVerticalAxis, restrictToParentElement]}
      collisionDetection={closestCenter}
      onDragStart={(event) => {
        const { active } = event
        const draggingItem = items.find((item) => item.id === active.id) || null
        setDragging(draggingItem)
        onDragStart?.({ id: `${active.id}` })
      }}
      onDragEnd={(event) => {
        const { active, over } = event
        if (over && active.id !== over.id) {
          const oldIndex = items.findIndex((x) => x.id === active.id)
          const newIndex = items.findIndex((x) => x.id === over.id)
          const nextItems = arrayMove(items, oldIndex, newIndex)
          onSort?.(nextItems)
        }
        setDragging(null)
      }}
    >
      <SortableContext items={items as any} strategy={verticalListSortingStrategy}>
        {scrollable ? (
          <ScrollView showsVerticalScrollIndicator={false} flex={1}>
            {children}
          </ScrollView>
        ) : (
          children
        )}
      </SortableContext>

      {/* was causing a flicker on drop */}
      {/* <SortableListContext.Provider value={context}> */}
      {/* <DragOverlay zIndex={1000}>{dragging ? dragOverlay : null}</DragOverlay> */}
      {/* </SortableListContext.Provider> */}
    </DndContext>
  )
}

export function SortableItem({
  id,
  children,
}: {
  id: UniqueIdentifier
  children: ReactElement
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({
      id,
    })

  return (
    <div
      data-is-dragging-item
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={{
        transition,
        transform: CSS.Transform.toString(transform),
        // TODO
        outline: '2px solid transparent',
      }}
    >
      {children}
    </div>
  )
}

export function useSortableDraggingItem<T = any>(): T | null {
  const { dragging } = useContext(SortableListContext)
  const [lastDragging, setLastDragging] = useState<T | null>(null)
  if (dragging && !lastDragging) {
    setLastDragging(dragging)
  }
  return dragging || lastDragging
}

// Modified detach to handle our custom event
// see https://github.com/clauderic/dnd-kit/issues/857
export class CustomPointerSensor extends PointerSensor {
  constructor(props: PointerSensorProps) {
    super(props)

    const thisSelf = this as any
    const handleEnd = thisSelf.handleEnd.bind(this)
    const detach = thisSelf.detach.bind(this)

    activeSortableCancels.add(handleEnd)

    thisSelf.detach = () => {
      detach()
      activeSortableCancels.delete(handleEnd)
    }
  }
}
