import { router } from 'one'

import { CaretLeftIcon } from '../icons/phosphor/CaretLeftIcon'
import { HeaderButton, type HeaderButtonProps } from './HeaderButton'

export const HeaderBackButton = (props: Omit<HeaderButtonProps, 'icon' | 'onPress'>) => {
  return (
    <HeaderButton
      icon={<CaretLeftIcon size={24} />}
      onPress={() => router.back()}
      {...props}
    />
  )
}
