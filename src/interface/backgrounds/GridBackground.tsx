import { useId } from 'react'
import { View, useThemeName, type ViewProps } from 'tamagui'

export interface GridBackgroundProps extends Omit<ViewProps, 'children'> {
  width?: number
  height?: number
  x?: number
  y?: number
  squares?: Array<[number, number]>
  strokeDasharray?: string
  strokeWidth?: number
  opacity?: number
}

const DEFAULT_SQUARES: Array<[number, number]> = [
  [4, 4],
  [5, 1],
  [8, 2],
  [5, 5],
  [10, 10],
  [15, 10],
  [10, 15],
]

export const GridBackground = ({
  width = 40,
  height = 40,
  x = -1,
  y = -1,
  strokeDasharray = '0',
  strokeWidth = 1,
  squares = DEFAULT_SQUARES,
  opacity = 0.4,
  ...props
}: GridBackgroundProps) => {
  const id = useId()
  const theme = useThemeName()
  const isDark = theme?.includes('dark')

  const fillColor = 'rgba(150, 150, 170, 0.5)'
  const strokeColor = isDark ? 'rgba(150, 150, 170, 0.2)' : 'rgba(147, 139, 255, 0.2)'

  return (
    <View
      position="absolute"
      t={0}
      l={0}
      r={0}
      b={0}
      overflow="hidden"
      pointerEvents="none"
      opacity={opacity}
      {...props}
    >
      <svg
        aria-hidden="true"
        style={{
          pointerEvents: 'none',
          position: 'absolute',
          inset: 0,
          height: '100%',
          width: '100%',
          fill: fillColor,
          stroke: strokeColor,
          maskImage: 'radial-gradient(circle at center, white, transparent)',
          WebkitMaskImage: 'radial-gradient(circle at center, white, transparent)',
        }}
      >
        <defs>
          <pattern
            id={id}
            width={width}
            height={height}
            patternUnits="userSpaceOnUse"
            x={x}
            y={y}
          >
            <path
              d={`M.5 ${height}V.5H${width}`}
              fill="none"
              strokeDasharray={strokeDasharray}
              strokeWidth={strokeWidth}
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" strokeWidth={0} fill={`url(#${id})`} />
        {squares && (
          <svg x={x} y={y} style={{ overflow: 'visible' }}>
            {squares.map(([squareX, squareY], index) => (
              <rect
                strokeWidth="0"
                key={`${squareX}-${squareY}-${index}`}
                width={width - 1}
                height={height - 1}
                x={squareX * width + 1}
                y={squareY * height + 1}
              />
            ))}
          </svg>
        )}
      </svg>
    </View>
  )
}
