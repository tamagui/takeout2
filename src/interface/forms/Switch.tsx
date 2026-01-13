import { memo } from 'react'
import {
  composeEventHandlers,
  Switch as TamaguiSwitch,
  useControllableState,
  type SwitchProps,
} from 'tamagui'

import { animationClamped } from '../animations/animationClamped'

export const Switch = memo((props: SwitchProps) => {
  const [checked, setChecked] = useControllableState({
    defaultProp: props.checked,
    prop: props.checked,
    strategy: 'prop-wins',
  })

  return (
    // <Theme name={checked ? 'accent' : null}>
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
      onCheckedChange={composeEventHandlers(setChecked, props.onCheckedChange)}
    >
      <TamaguiSwitch.Thumb transition={animationClamped('quickestLessBouncy')} />
    </TamaguiSwitch>
  ) // </Theme>
})
