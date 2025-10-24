import { memo } from 'react'
import { X } from '@tamagui/lucide-icons'
import { ButtonSimple, type ButtonSimpleProps } from './ButtonSimple'

export const ButtonClose = memo((props: ButtonSimpleProps) => {
  return (
    <ButtonSimple icon={X} circular variant="floating" tabIndex={0} z={10} {...props} />
  )
})
