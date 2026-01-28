import { memo } from 'react'
import { isWeb, Input as TamaguiInput } from 'tamagui'

import { GlassView } from '../effects/GlassView'

import type { RefObject } from 'react'
import type { GetProps, SizeTokens, TamaguiElement, ViewProps } from 'tamagui'

export type InputSize = 'small' | 'medium' | 'large'

export type InputProps = Omit<GetProps<typeof TamaguiInput>, 'size'> & {
  ref?: RefObject<TamaguiElement | null>
  glass?: boolean
  size?: InputSize
}

export type Input = TamaguiElement

const inputHeights: Record<InputSize, number> = {
  small: isWeb ? 32 : 40,
  medium: isWeb ? 42 : 50,
  large: isWeb ? 50 : 56,
}

const inputTamaguiSizes: Record<InputSize, SizeTokens> = {
  small: '$3',
  medium: '$5',
  large: '$6',
}

const inputBorderRadii: Record<InputSize, number> = {
  small: isWeb ? 8 : 10,
  medium: isWeb ? 12 : 14,
  large: isWeb ? 14 : 16,
}

export const Input = memo(({ ref, glass, size = 'medium', ...props }: InputProps) => {
  const height = inputHeights[size]
  const tamaguiSize = inputTamaguiSizes[size]
  const borderRadius = inputBorderRadii[size]

  const inputElement = (
    <TamaguiInput
      borderWidth={glass && !isWeb ? 0 : 0.5}
      ref={ref}
      focusVisibleStyle={inputFocusStyle}
      bg={glass ? 'transparent' : undefined}
      placeholderTextColor="$color8"
      height={height}
      size={tamaguiSize}
      rounded={borderRadius}
      {...props}
    />
  )
  if (glass && !isWeb) {
    return (
      <GlassView borderRadius={borderRadius} intensity={40}>
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
