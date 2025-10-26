import type { IconProps } from '~/interface/icons/types'

export interface InteractButtonProps {
  icon: React.ComponentType<IconProps>
  count: number
  onPress?: () => void
  active?: boolean
}

export function InteractButton({
  icon: Icon,
  count,
  onPress,
  active = false,
}: InteractButtonProps) {
  return null
}
