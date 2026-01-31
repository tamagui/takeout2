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
      pressStyle={{
        bg: '$color1',
      }}
      size="$4"
      p={0}
      bg="$color4"
      borderColor="$color6"
      {...props}
      checked={checked}
      onCheckedChange={setCheckedFn}
    >
      <TamaguiSwitch.Thumb transition={animationClamped('quickestLessBouncy')} />
    </TamaguiSwitch>
  )
})
