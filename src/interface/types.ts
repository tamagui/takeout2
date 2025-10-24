import type React from 'react'
import type { JSX, RefObject } from 'react'
import type { TamaguiElement } from 'tamagui'

export type Component<Props extends Record<string, any> = {}, Ref = TamaguiElement> = (
  props: Props & { ref?: RefObject<Ref>; children?: JSX.Element }
) => React.ReactNode

export type PreventableEvent = { preventDefault: () => void }
