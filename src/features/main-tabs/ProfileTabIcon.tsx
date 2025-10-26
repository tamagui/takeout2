import { memo } from 'react'
import { Circle } from 'tamagui'
import { useUser } from '~/features/user/useUser'
import { Avatar } from '~/interface/avatars/Avatar'
import { useTabIconSize } from './useTabIconSize'

export const ProfileTabIcon = memo(() => {
  const { user } = useUser()
  const { smallerIconSize } = useTabIconSize()

  if (!user?.image) return <Circle size={smallerIconSize} bg="$color4" />

  return <Avatar size={smallerIconSize} image={user.image} />
})
