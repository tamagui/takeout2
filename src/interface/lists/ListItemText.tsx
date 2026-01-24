import { createContextualEmitter, useEmitter } from '@take-out/helpers'
import { forwardRef, useContext, useEffect } from 'react'
import {
  styled,
  Text,
  useControllableState,
  type GetProps,
  type TamaguiElement,
} from 'tamagui'

import { useHandleEscapeIf } from '~/features/shortcuts/handleKeyboardEscape'

import { ListItemContext } from './ListItemContext'
import { ListItemInput } from './ListItemInput'

export type ListItemTextProps = GetProps<typeof ListItemTextFrame>

export const [useTriggerEditingEmitter, ProvideTriggerListItemEditing] =
  createContextualEmitter<number>('TriggerListItemEditing', 0)

export const ListItemText = forwardRef<TamaguiElement, ListItemTextProps>(
  ({ children, ...props }, ref) => {
    const {
      editingValue,
      editable,
      editing: editingProp,
      onEditComplete,
      onEditCancel,
    } = useContext(ListItemContext)

    const [editing, setEditing] = useControllableState({
      prop: editingProp,
      defaultProp: editingProp || false,
      strategy: 'most-recent-wins',
    })

    useEmitter(useTriggerEditingEmitter(), (val) => {
      if (val) {
        setEditing(true)
      }
    })

    useHandleEscapeIf(editing, () => {
      setEditing(false)
      onEditCancel?.()
    })

    if (editing && editable) {
      return (
        <ListItemInput
          ref={ref}
          defaultValue={editingValue || (children as string)}
          autoFocus
          onSubmitEditing={(e) => {
            setEditing(false)
            onEditComplete?.(e.nativeEvent.text || '')
          }}
          onBlur={(e) => {
            // TODO nativeEvent we need to fix for new RN version?
            const value = (e.nativeEvent as any).text || ''
            if (!value.trim()) {
              setEditing?.(false)
              onEditCancel?.()
            } else {
              // non-empty value on blur will be handled by the parent component
              onEditComplete?.(value)
            }
          }}
          onKeyPress={(e) => {
            if (e.nativeEvent.key === 'Escape') {
              setEditing?.(false)
              onEditCancel?.()
            }
          }}
        />
      )
    }

    return (
      <ListItemTextFrame
        ref={ref}
        {...props}
        {...(editable && {
          onDoubleClick: () => {
            setEditing?.(true)
          },
        })}
      >
        {children}
      </ListItemTextFrame>
    )
  }
)

export const ListItemTextFrame = styled(Text, {
  context: ListItemContext,
  color: '$color11',
  fontFamily: '$body',
  cursor: 'default',
  select: 'none',

  '$group-item-hover': {
    color: '$color12',
  },

  variants: {
    variant: {
      sidebar: {
        select: 'none',
      },
    },

    size: {
      small: {
        fontSize: '$3',
        lineHeight: '$3',
      },

      medium: {
        fontSize: '$4',
        lineHeight: '$4',
      },

      large: {
        fontSize: '$5',
        lineHeight: '$5',
      },
    },

    active: {
      true: {
        color: '$color12',
      },
    },

    bold: {
      true: {
        fontWeight: '900',
        color: '$color12',
      },
    },
  } as const,

  defaultVariants: {
    size: 'medium',
  },
})
