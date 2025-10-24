import { memo } from 'react'
import { useAppTheme } from '../../features/app/AppTheme'
import { ButtonSimple, type ButtonSimpleProps } from './ButtonSimple'

export type ButtonActionProps = Omit<ButtonSimpleProps, 'children'> & {
  children: string
}

export const ButtonAction = memo(({ children, ...props }: ButtonActionProps) => {
  const { themeName } = useAppTheme()

  return (
    <ButtonSimple theme={themeName === 'red' ? 'blue' : themeName || 'blue'} {...props}>
      <ButtonSimple.Text fontWeight="bold">{children}</ButtonSimple.Text>
    </ButtonSimple>
  )
})
