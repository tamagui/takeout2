import { memo } from 'react'
import type { TamaguiElement } from 'tamagui'
import { Input, type InputProps } from './Input'

export type InputChromelessProps = InputProps & {
  ref?: TamaguiElement | null
}

export const InputChromeless = memo(({ ref, ...props }: InputChromelessProps) => {
  return (
    <Input
      ref={ref}
      bg="transparent"
      borderColor="transparent"
      focusVisibleStyle={{
        borderColor: 'transparent',
        outlineColor: 'transparent',
      }}
      focusStyle={{
        borderColor: 'transparent',
        outlineColor: 'transparent',
      }}
      pressStyle={{
        borderColor: 'transparent',
        outlineColor: 'transparent',
      }}
      hoverStyle={{
        borderColor: 'transparent',
        outlineColor: 'transparent',
      }}
      {...props}
    />
  )
})
