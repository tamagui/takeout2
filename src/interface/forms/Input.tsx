import { memo } from 'react'
import { Input as TamaguiInput } from 'tamagui'

import { useIsDark } from '~/features/theme/useIsDark'

import { GlassView } from '../effects/GlassView'

import type { RefObject } from 'react'
import type { InputProps as TamaguiInputProps, ViewProps } from 'tamagui'

export type InputProps = TamaguiInputProps & {
  ref?: RefObject<TamaguiInput | null>
  glass?: boolean
}

export type Input = TamaguiInput

export const Input = memo(({ ref, glass, ...props }: InputProps) => {
  const isDark = useIsDark()

  const inputElement = (
    <TamaguiInput
      borderWidth={glass ? 0 : 0.5}
      ref={ref}
      focusVisibleStyle={inputFocusStyle}
      bg={glass ? 'transparent' : undefined}
      // TODO rnwlite
      placeholderTextColor="$color8"
      height={50}
      {...props}
    />
  )
  if (glass) {
    return (
      <GlassView borderRadius={14} intensity={40} tint={isDark ? 'dark' : 'light'}>
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
