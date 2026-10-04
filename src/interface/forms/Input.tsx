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
      outlineWidth="focus-visible:3px"
      outlineStyle="focus-visible:solid"
      outlineColor="focus-visible:background04"
      outlineOffset="focus-visible:1px"
      borderColor="focus-visible:color5"
      bg={glass ? 'transparent' : undefined}
      placeholderTextColor="color8"
      height={50}
      {...props}
      ref={ref}
      size="lg"
      fontSize="5"
      px="3"
      py="2"
      rounded="4"
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
