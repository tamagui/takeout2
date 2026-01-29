import { type ReactNode, type RefObject, useState } from 'react'
import {
  type GetProps,
  styled,
  type TamaguiElement,
  View,
  withStaticProperties,
  XStack,
  YStack,
} from 'tamagui'

import { LineShimmer } from '../shimmer/LineShimmer'
import { ListItemBackground } from './ListItemBackground'
import { ListItemFrame } from './ListItemFrame'
import { ListItemIcon } from './ListItemIcon'
import { ListItemInput } from './ListItemInput'
import { ListItemText, ProvideTriggerListItemEditing } from './ListItemText'

import type { ContextMenuItem } from '../menu/types'
import type { ListItemContextProps } from './ListItemContext'

export type ListItemProps = Omit<
  GetProps<typeof ListItemFrame>,
  keyof ListItemContextProps
> &
  Partial<ListItemContextProps> & {
    ref?: RefObject<TamaguiElement>
    contextMenu?: ContextMenuItem[]
    onContextMenu?: () => void
    aboveMenuIcon?: ReactNode
  }

const ListItemComponent = ({
  children,
  ref,
  contextMenu,
  onContextMenu,
  aboveMenuIcon,
  ...props
}: ListItemProps) => {
  const [startEdit, setStartEdit] = useState(0)

  return (
    <ListItemFrame
      ref={ref}
      {...(props as any)} // TODO
      {...(props.editable && {
        onKeyDown: (e: KeyboardEvent) => {
          setStartEdit(Date.now())
        },
      })}
    >
      <ProvideTriggerListItemEditing value={startEdit}>
        {children}
      </ProvideTriggerListItemEditing>
      <ListItemBackground />
    </ListItemFrame>
  )
}

const ListItemAfter = ({ children }: { children: React.ReactNode }) => {
  return (
    <XStack items="center" height="100%" ml="auto" gap="$1">
      {children}
    </XStack>
  )
}

const ListItemLoading = () => {
  return (
    <YStack>
      <LineShimmer width={300} height={32} />
    </YStack>
  )
}

const ListItemPad = styled(View, {
  p: '$2',
})

export const ListItem = withStaticProperties(ListItemComponent, {
  Pad: ListItemPad,
  Icon: ListItemIcon,
  Text: ListItemText,
  Input: ListItemInput,
  After: ListItemAfter,
  Loading: ListItemLoading,
})
