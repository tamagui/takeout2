import { memo } from 'react'
import { ButtonSimple, type ButtonSimpleProps } from './ButtonSimple'

export type ButtonActionProps = Omit<ButtonSimpleProps, 'children'> & {
  children: string
}

export const ButtonAction = memo(({ children, ...props }: ButtonActionProps) => {
  return (
    <ButtonSimple themeInverse {...props}>
      <ButtonSimple.Text fontWeight="bold">{children}</ButtonSimple.Text>
    </ButtonSimple>
  )
})
