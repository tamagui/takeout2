import { memo } from 'react'
import { XStack } from 'tamagui'
import { isUserOnline } from '~/features/user/isUserOnline'
import { pluralize } from '@vxrn/helpers'
import { Avatar } from '~/interface/avatars/Avatar'
import { ButtonSimple } from '~/interface/buttons/ButtonSimple'
import { ListItem, type ListItemProps } from '~/interface/lists/ListItem'
import type { UserWithState } from '~/data/types'
import { UserPopover } from './UserPopover'

export type UserListItemProps = ListItemProps & {
  user: UserWithState
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
      <UserPopover user={user}>
        <Avatar
          isOnline={isUserOnline(user)}
          size={size === 'large' ? 24 : 20}
          image={user.image}
        />
      </UserPopover>

      <ListItem.Text fontFamily={fontFamily} size={size}>
        {user.username || user.name}
      </ListItem.Text>

      <XStack flex={1} />

      {!!user.roles?.length && (
        <ButtonSimple size="small" tooltip={user.roles.map((r) => r.name).join(', ')}>
          {pluralize(user.roles.length, 'role', 'roles')}
        </ButtonSimple>
      )}

      {action}

      {children}
    </>
  )
}
