import { LinearGradient } from '@tamagui/linear-gradient'

interface LinearGradientSeparatorProps {
  height?: number
  colors?: string[]
  locations?: number[]
}

export function LinearGradientSeparator({
  height = 1,
  colors = ['#000000', '#444444', '#444444', '#000000'],
  locations = [0, 0.3, 0.7, 1],
}: LinearGradientSeparatorProps) {
  return (
    <LinearGradient
      colors={colors}
      locations={locations}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={{ width: '100%', height }}
    />
  )
}
