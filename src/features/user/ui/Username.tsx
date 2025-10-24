import { isWeb, SizableText, XStack, type SizableTextProps } from 'tamagui'
import { validColor } from '~/interface/colors/validColor'
import { Image } from '~/interface/image/Image'
import { isTauri } from '@vxrn/helpers'
import type { Role, UserWithRoles } from '~/data/types'

export type UsernameProps = SizableTextProps & {
  user: UserWithRoles
  defaultColor?: string
}

const size = isWeb || isTauri ? '$3' : '$5'
const roleSize = isWeb || isTauri ? 16 : 20

export const Username = ({ user, defaultColor = '$color12', ...rest }: UsernameProps) => {
  const highestRole = user.roles?.reduce<Role | undefined>((highest, role) => {
    if (!highest) return role
    const currentOrder = role.order ?? Number.MAX_SAFE_INTEGER
    const highestOrder = highest.order ?? Number.MAX_SAFE_INTEGER
    return currentOrder < highestOrder ? role : highest
  }, undefined)

  const roleImage = highestRole?.image

  return (
    <XStack items="center" gap="$1">
      <SizableText
        select="auto"
        cursor="default"
        size={size}
        fontWeight="600"
        lineHeight={16}
        color={validColor(highestRole?.color) || defaultColor}
        {...rest}
      >
        {user.username || user.name}
      </SizableText>
      {roleImage && (
        <Image
          pointerEvents="none"
          width={roleSize}
          height={roleSize}
          src={roleImage}
          rounded={4}
          ml="$2"
          borderWidth={0.5}
          borderColor="$color4"
        />
      )}
    </XStack>
  )
}
