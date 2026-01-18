import { memo } from 'react'

import { ButtonSimple, type ButtonSimpleProps } from './ButtonSimple'

export type ButtonActionProps = Omit<ButtonSimpleProps, 'children'> & {
  children: string
}

export const ButtonAction = memo(({ children, ...props }: ButtonActionProps) => {
  return (
    <ButtonSimple theme="blue" variant="floating" {...props}>
      <ButtonSimple.Text color="white">{children}</ButtonSimple.Text>
    </ButtonSimple>
  )
})
