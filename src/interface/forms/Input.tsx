import { memo } from 'react'
import { isWeb, Input as TamaguiInput } from 'tamagui'

import { GlassView } from '../effects/GlassView'

import type { RefObject } from 'react'
import type { GetProps, TamaguiElement, ViewProps } from 'tamagui'

export type InputProps = GetProps<typeof TamaguiInput> & {
  ref?: RefObject<TamaguiElement | null>
  glass?: boolean
}

export type Input = TamaguiElement

export const Input = memo(({ ref, glass, ...props }: InputProps) => {
  const inputElement = (
    <TamaguiInput
      borderWidth={glass && !isWeb ? 0 : 0.5}
      ref={ref}
      focusVisibleStyle={inputFocusStyle}
      bg={glass ? 'transparent' : undefined}
      placeholderTextColor="$color8"
      height={50}
      size="$5"
      {...props}
    />
  )
  if (glass && !isWeb) {
    return (
      <GlassView borderRadius={14} intensity={40}>
        {inputElement}
      </GlassView>
    )
  }

  return inputElement
})

export const inputFocusStyle = {
  outlineWidth: 3,
  outlineStyle: 'solid',
  outlineColor: '$background04',
  outlineOffset: 1,
  borderWidth: 0.5,
  borderColor: '$color5',
} satisfies ViewProps['focusVisibleStyle']
