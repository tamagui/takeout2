import { router } from 'one'

import { Pressable } from '~/interface/buttons/Pressable'
import { CaretLeftIcon } from '~/interface/icons/phosphor/CaretLeftIcon'

import type { ViewProps } from 'tamagui'

export const HeaderBackButton = (props: ViewProps) => {
  return (
    <Pressable
      onPress={() => router.back()}
      width={36}
      height={36}
      items="center"
      justify="center"
      {...props}
    >
      <CaretLeftIcon size={24} />
    </Pressable>
  )
}
