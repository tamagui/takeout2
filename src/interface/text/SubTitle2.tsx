import type { ReactNode } from 'react'
import { XStack, SizableText } from 'tamagui'
import type { IconComponent } from '~/interface/icons/types'

interface SubTitle2Props {
  Icon: IconComponent
  children: string
}

export function SubTitle2({ Icon, children }: SubTitle2Props) {
  return (
    <XStack gap="$2">
      <Icon color="$color11" size="$1" />
      <SizableText color="$color11" fontWeight="500">
        {children}
      </SizableText>
    </XStack>
  )
}
