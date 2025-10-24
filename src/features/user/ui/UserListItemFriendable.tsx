import type { UserWithState } from '~/data/types'
import { UserFriendButton } from './UserFriendButton'
import { UserListItem } from './UserListItem'

export const UserListItemFriendable = ({ user }: { user: UserWithState }) => {
  return <UserListItem user={user} action={<UserFriendButton user={user} />} />
}
