import { LinearGradient } from '@tamagui/linear-gradient'
import { View, useThemeName } from 'tamagui'

export const GridPattern = () => {
  const theme = useThemeName()
  const isDark = theme?.includes('dark')

  // Define gradient colors based on theme - more neutral in light, softer in dark
  const gradientColors = isDark
    ? [
        'rgba(120, 120, 180, 0.12)',
        'rgba(150, 120, 180, 0.12)',
        'rgba(180, 120, 150, 0.12)',
      ]
    : [
        'rgba(147, 139, 255, 0.025)',
        'rgba(255, 139, 200, 0.02)',
        'rgba(180, 139, 255, 0.025)',
      ]

  const borderGradient = isDark
    ? [
        'rgba(120, 120, 180, 0.25)',
        'rgba(150, 120, 180, 0.25)',
        'rgba(180, 120, 150, 0.25)',
      ]
    : [
        'rgba(147, 139, 255, 0.08)',
        'rgba(255, 139, 200, 0.06)',
        'rgba(180, 139, 255, 0.08)',
      ]

  // Grid configuration
  const gridSize = 180
  const gap = 20
  const borderRadius = 24

  // Create grid pattern
  const gridItems = []
  const rows = 6
  const cols = 8

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const index = row * cols + col
      const delay = (row + col) * 0.1

      // Some items are highlighted
      const isHighlighted =
        (row === 0 && col === 2) ||
        (row === 1 && col === 5) ||
        (row === 2 && col === 1) ||
        (row === 3 && col === 4) ||
        (row === 4 && col === 0) ||
        (row === 4 && col === 6)

      gridItems.push(
        <View
          key={index}
          position="absolute"
          l={col * (gridSize + gap)}
          t={row * (gridSize + gap)}
          width={gridSize}
          height={gridSize}
          animation="lazy"
          enterStyle={{
            opacity: 0,
            scale: 0.8,
          }}
          exitStyle={{
            opacity: 0,
            scale: 0.8,
          }}
          opacity={1}
          scale={1}
          animateOnly={['opacity', 'scale']}
          style={{
            animationDelay: `${delay}s`,
            animationDuration: '0.8s',
            animationFillMode: 'both',
          }}
        >
          {/* Gradient border effect */}
          {isHighlighted && (
            <LinearGradient
              colors={borderGradient}
              start={[0, 0]}
              end={[1, 1]}
              position="absolute"
              t={0}
              l={0}
              r={0}
              b={0}
              rounded={borderRadius}
            />
          )}

          {/* Inner content */}
          <View
            position="absolute"
            t={isHighlighted ? 1 : 0}
            l={isHighlighted ? 1 : 0}
            r={isHighlighted ? 1 : 0}
            b={isHighlighted ? 1 : 0}
            rounded={borderRadius - 1}
            borderWidth={1}
            borderColor={
              isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(100, 100, 110, 0.015)'
            }
            bg={isDark ? 'rgba(0, 0, 0, 0.15)' : 'rgba(255, 255, 255, 0.25)'}
            style={{
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
            }}
          >
            {isHighlighted && (
              <LinearGradient
                colors={gradientColors}
                start={[0, 0]}
                end={[1, 1]}
                position="absolute"
                t={0}
                l={0}
                r={0}
                b={0}
                rounded={borderRadius - 2}
                opacity={0.5}
              />
            )}
          </View>
        </View>
      )
    }
  }

  return (
    <View
      position="absolute"
      t={0}
      l={0}
      r={0}
      b={0}
      overflow="hidden"
      pointerEvents="none"
    >
      {/* Background gradient */}
      <LinearGradient
        colors={
          isDark
            ? ['rgba(0, 0, 0, 0.9)', 'rgba(0, 0, 0, 0.95)']
            : ['rgba(250, 249, 252, 0.95)', 'rgba(252, 251, 254, 0.98)']
        }
        position="absolute"
        t={0}
        l={0}
        r={0}
        b={0}
      />

      {/* Grid container with perspective */}
      <View
        position="absolute"
        width="150%"
        height="150%"
        l="-25%"
        t="-25%"
        style={{
          transform: [
            { perspective: 1000 },
            { rotateX: '15deg' },
            { rotateZ: '-10deg' },
            { scale: 0.8 },
          ],
        }}
      >
        {gridItems}
      </View>

      {/* Overlay gradient for depth */}
      <LinearGradient
        colors={
          isDark
            ? ['transparent', 'rgba(0, 0, 0, 0.3)', 'rgba(0, 0, 0, 0.8)']
            : ['transparent', 'rgba(250, 249, 252, 0.3)', 'rgba(252, 251, 254, 0.85)']
        }
        position="absolute"
        t={0}
        l={0}
        r={0}
        b={0}
      />
    </View>
  )
}
