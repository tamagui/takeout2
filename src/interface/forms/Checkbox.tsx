import { CheckIcon } from '~/interface/icons/phosphor/CheckIcon'
import { forwardRef, memo } from 'react'
import type { CheckboxProps, TamaguiElement } from 'tamagui'
import { Checkbox as TamaguiCheckbox } from 'tamagui'

export const Checkbox = memo(
  forwardRef<TamaguiElement, CheckboxProps>((props, ref) => {
    return (
      <TamaguiCheckbox ref={ref} {...props}>
        <TamaguiCheckbox.Indicator>
          <CheckIcon />
        </TamaguiCheckbox.Indicator>
      </TamaguiCheckbox>
    )
  })
)
