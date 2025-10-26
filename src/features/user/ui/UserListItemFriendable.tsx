import type { UserWithStats } from '~/data/types'
import { UserFriendButton } from './UserFriendButton'
import { UserListItem } from './UserListItem'

export const UserListItemFriendable = ({ user }: { user: UserWithStats }) => {
  return <UserListItem user={user} action={<UserFriendButton user={user} />} />
}
