import { Pressable } from '~/interface/buttons/Pressable'

import type { ReactNode } from 'react'
import type { ViewProps } from 'tamagui'

export type HeaderButtonProps = ViewProps & {
  icon?: ReactNode
  onPress?: () => void
  size?: number
}

export const HeaderButton = ({
  icon,
  onPress,
  size = 36,
  ...props
}: HeaderButtonProps) => {
  return (
    <Pressable
      onPress={onPress}
      width={size}
      height={size}
      items="center"
      justify="center"
      {...props}
    >
      {icon}
    </Pressable>
  )
}
