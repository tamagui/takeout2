import { Polyline, Svg } from 'react-native-svg'
import { useTheme } from 'tamagui'

export function Sparkline({
  points,
  width = 72,
  height = 28,
  color,
  strokeWidth = 2,
}: {
  points: readonly number[]
  width?: number
  height?: number
  color?: string
  strokeWidth?: number
}) {
  const theme = useTheme()
  const accentBackground = theme['accent-background']
  if (!accentBackground) throw new Error('sparkline requires accent-background')
  const stroke = color ?? accentBackground.get()
  const inset = strokeWidth / 2

  if (points.length < 2) {
    return (
      <Svg width={width} height={height}>
        <Polyline
          points={`${inset},${height / 2} ${width - inset},${height / 2}`}
          fill="none"
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${width * 0.04} ${width * 0.04}`}
        />
      </Svg>
    )
  }

  const min = Math.min(...points)
  const max = Math.max(...points)
  const range = Math.max(max - min, Number.EPSILON)
  const drawableWidth = width - strokeWidth
  const drawableHeight = height - strokeWidth
  const step = drawableWidth / (points.length - 1)
  const coordinates = points
    .map((point, index) => {
      const x = inset + index * step
      const y = inset + drawableHeight * (1 - (point - min) / range)
      return `${x.toFixed(2)},${y.toFixed(2)}`
    })
    .join(' ')

  return (
    <Svg width={width} height={height}>
      <Polyline
        points={coordinates}
        fill="none"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  )
}
