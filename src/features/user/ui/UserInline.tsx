import { SizableText, XStack } from 'tamagui'
import { Avatar } from '~/interface/avatars/Avatar'
import type { User } from '~/data/types'

const avatarSizes = {
  small: 16,
  medium: 24,
} as const

const textSizes = {
  small: '$2',
  medium: '$3',
} as const

const gapSizes = {
  small: '$1.5',
  medium: '$2',
} as const

export const UserInline = ({
  user,
  size = 'medium',
}: {
  user?: User
  size?: 'small' | 'medium'
}) => {
  if (!user) {
    return null
  }

  return (
    <XStack items="center" gap={gapSizes[size]}>
      <Avatar size={avatarSizes[size]} image={user.image} />
      <SizableText cursor="default" size={textSizes[size]} fontWeight="500">
        {user.username || user.name}
      </SizableText>
    </XStack>
  )
}
