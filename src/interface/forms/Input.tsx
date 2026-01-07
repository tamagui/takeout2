import { memo } from 'react'
import { Input as TamaguiInput } from 'tamagui'

import type { RefObject } from 'react'
import type { GetProps, TamaguiElement, ViewProps } from 'tamagui'

export type InputProps = GetProps<typeof TamaguiInput> & {
  ref?: RefObject<TamaguiElement | null>
}

export type Input = TamaguiElement

export const Input = memo(({ ref, ...props }: InputProps) => {
  return (
    <TamaguiInput
      borderWidth={0.5}
      ref={ref}
      focusVisibleStyle={inputFocusStyle}
      placeholderTextColor="$color8"
      {...props}
    />
  )
})

export const inputFocusStyle = {
  outlineWidth: 3,
  outlineStyle: 'solid',
  outlineColor: '$background04',
  outlineOffset: 1,
  borderWidth: 0.5,
  borderColor: '$color5',
} satisfies ViewProps['focusVisibleStyle']
