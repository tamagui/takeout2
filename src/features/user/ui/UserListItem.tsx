import { memo } from 'react'
import { XStack } from 'tamagui'
import { Avatar } from '~/interface/avatars/Avatar'
import { ListItem, type ListItemProps } from '~/interface/lists/ListItem'
import type { User } from '~/data/types'

export type UserListItemProps = ListItemProps & {
  user: User
  action?: any
  active?: boolean
}

export const UserListItem = memo((props: UserListItemProps) => {
  const { user, action, active, size = 'medium', fontFamily = '$body', ...rest } = props
  return (
    <ListItem size={size} active={active} {...rest}>
      <UserRow {...props} />
    </ListItem>
  )
})

export const UserRow = ({
  user,
  action,
  active,
  size = 'medium',
  fontFamily = '$body',
  children,
}: UserListItemProps) => {
  return (
    <>
      <Avatar size={size === 'large' ? 24 : 20} image={user.image} />

      <ListItem.Text fontFamily={fontFamily} size={size}>
        {user.username || user.name}
      </ListItem.Text>

      <XStack flex={1} />

      {action}

      {children}
    </>
  )
}
