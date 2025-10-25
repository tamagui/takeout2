import { Avatar } from 'tamagui'
import type { FC } from 'react'

interface SimpleAvatarProps {
  src?: string | null
  size?: number
  alt?: string
}

export const SimpleAvatar: FC<SimpleAvatarProps> = ({
  src,
  size = 40,
  alt = 'Avatar',
}) => {
  return (
    <Avatar circular size={size}>
      {src ? (
        <Avatar.Image src={src} alt={alt} />
      ) : (
        <Avatar.Fallback backgroundColor="$color5" />
      )}
    </Avatar>
  )
}

export default SimpleAvatar
