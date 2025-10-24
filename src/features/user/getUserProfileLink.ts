import type { Href } from 'one'
import type { User } from '~/data/types'

export const getUserProfileLink = (user: Pick<User, 'username'>): Href => {
  return `/user/${user.username}`
}
