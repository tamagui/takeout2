import { View } from 'tamagui'

import type { BlurViewProps } from './types'

// empty on web - blur not supported
export const BlurView = ({
  children,
  intensity: _intensity,
  tint: _tint,
  ...props
}: BlurViewProps & React.ComponentProps<typeof View>) => {
  return <View {...props}>{children}</View>
}
