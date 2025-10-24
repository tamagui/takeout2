import { memo } from 'react'
import { useTheme } from 'tamagui'
import { Svg, Circle } from 'react-native-svg'

type CircularProgressProps = {
  progress: number
  size?: number
  strokeWidth?: number
}

export const CircularProgress = memo(function CircularProgress({
  progress,
  size = 20,
  strokeWidth = 2,
}: CircularProgressProps) {
  const theme = useTheme()
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const strokeDashoffset = circumference - (progress / 100) * circumference

  return (
    <Svg width={size} height={size}>
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={theme.color11.get()}
        strokeWidth={strokeWidth}
        fill="none"
        strokeDasharray={circumference}
        strokeDashoffset={strokeDashoffset}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
    </Svg>
  )
})
