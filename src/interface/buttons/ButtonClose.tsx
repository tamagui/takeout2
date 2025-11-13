import { memo } from 'react'
import { XIcon } from '~/interface/icons/phosphor/XIcon'
import { ButtonSimple, type ButtonSimpleProps } from './ButtonSimple'

export const ButtonClose = memo((props: ButtonSimpleProps) => {
  return (
    <ButtonSimple
      icon={XIcon}
      circular
      variant="floating"
      tabIndex={0}
      z={10}
      {...props}
    />
  )
})
