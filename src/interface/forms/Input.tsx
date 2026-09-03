import { memo } from 'react'
import { isWeb, Input as TamaguiInput } from 'tamagui'

import { GlassView } from '../effects/GlassView'

import type { RefObject } from 'react'
import type { GetProps, TamaguiElement } from 'tamagui'

export type InputProps = GetProps<typeof TamaguiInput> & {
  ref?: RefObject<TamaguiElement | null>
  glass?: boolean
}

export type Input = TamaguiElement

export const Input = memo(({ ref, glass, ...props }: InputProps) => {
  const inputElement = (
    <TamaguiInput
      borderWidth={glass && !isWeb ? 0 : 0.5}
      borderColor="color5 focus:color5"
      outlineWidth="focus-visible:3px"
      outlineStyle="focus-visible:solid"
      outlineColor="focus-visible:outline-color"
      outlineOffset="focus-visible:1px"
      bg={glass ? 'transparent' : undefined}
      h={50}
      {...props}
      ref={ref}
      placeholderTextColor="color8"
      size="5"
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
  outlineColor: 'outline-color',
  outlineOffset: 1,
  borderWidth: 0.5,
  borderColor: 'color5',
}
