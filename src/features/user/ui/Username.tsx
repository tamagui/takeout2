import { isWeb, SizableText, XStack, type SizableTextProps } from 'tamagui'
import type { User } from '~/data/types'

export type UsernameProps = SizableTextProps & {
  user: User
  defaultColor?: string
}

const size = isWeb ? '$3' : '$5'

export const Username = ({ user, defaultColor = '$color12', ...rest }: UsernameProps) => {
  return (
    <XStack items="center" gap="$1">
      <SizableText
        select="auto"
        cursor="default"
        size={size}
        fontWeight="600"
        lineHeight={16}
        {...rest}
      >
        {user.username || user.name}
      </SizableText>
    </XStack>
  )
}
