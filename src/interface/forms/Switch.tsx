import { memo } from 'react'
import {
  Switch as TamaguiSwitch,
  useControllableState,
  useEvent,
  type SwitchProps,
} from 'tamagui'

import { animationClamped } from '../animations/animationClamped'

export const Switch = memo((props: SwitchProps) => {
  const [checked, setChecked] = useControllableState({
    defaultProp: props.checked,
    prop: props.checked,
    strategy: 'prop-wins',
  })

  const setCheckedFn = useEvent((val: boolean) => {
    setChecked(val)
    props.onCheckedChange?.(val)
  })

  return (
    <TamaguiSwitch
      transition={animationClamped('quickestLessBouncy')}
      bg="color4 press:color1"
      p={0}
      borderColor="color6"
      {...props}
      size="4"
      checked={checked}
      onCheckedChange={setCheckedFn}
    >
      <TamaguiSwitch.Thumb transition={animationClamped('quickestLessBouncy')} />
    </TamaguiSwitch>
  )
})
