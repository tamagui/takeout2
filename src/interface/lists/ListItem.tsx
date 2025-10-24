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
import { isTauri } from '@vxrn/helpers'
import type { ContextMenuItem } from '../menu/types'
import { LineShimmer } from '../shimmer/LineShimmer'
import { ListItemBackground } from './ListItemBackground'
import type { ListItemContextProps } from './ListItemContext'
import { ListItemFrame } from './ListItemFrame'
import { ListItemIcon } from './ListItemIcon'
import { ListItemInput } from './ListItemInput'
import { ListItemMenu } from './ListItemMenu'
import { ListItemText, ProvideTriggerListItemEditing } from './ListItemText'

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
      {...(props as any)}
      {...(isTauri &&
        contextMenu && {
          onContextMenu: async (e: any) => {
            if (!isTauri) return
            e.preventDefault()
            onContextMenu?.()

            const { Menu: TauriContextMenu } = await import('@tauri-apps/api/menu')

            const menu = TauriContextMenu.new({
              items: contextMenu.map((item: any) => {
                return {
                  id: item.text,
                  ...item,
                }
              }),
            })
            const menuInstance = await menu
            menuInstance.popup()
          },
        })}
      // @ts-ignore
      {...(props.editable && {
        onKeyDown: (e: KeyboardEvent) => {
          setStartEdit(Date.now())
        },
      })}
    >
      <ProvideTriggerListItemEditing value={startEdit}>
        {children}
      </ProvideTriggerListItemEditing>

      {contextMenu && (
        <ListItemAfter>
          {aboveMenuIcon && (
            <YStack
              position="absolute"
              t={0}
              b={0}
              items="center"
              justify="center"
              r={11}
              $group-item-hover={{
                opacity: 0,
              }}
            >
              {aboveMenuIcon}
            </YStack>
          )}
          <ListItemMenu items={contextMenu} />
        </ListItemAfter>
      )}

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
