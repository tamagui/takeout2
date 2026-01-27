import {
  Canvas,
  Group,
  LinearGradient,
  Path,
  Skia,
  useFont,
  vec,
} from '@shopify/react-native-skia'
import { memo, useEffect, useMemo } from 'react'
import { StyleSheet, useWindowDimensions } from 'react-native'
import {
  Easing,
  useDerivedValue,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated'

import type { SharedValue } from 'react-native-reanimated'

const FONT_SIZE = 80
const LINE_GAP = 16
const STROKE_WIDTH = 2

type HelloTakeoutProps = {
  onComplete?: () => void
  duration?: number
}

type CharPath = {
  path: NonNullable<ReturnType<typeof Skia.Path.MakeFromText>>
}

// draws a single character stroke then fills it in
const CharStrokeDraw = memo(
  ({
    path,
    progress,
    index,
    total,
    gradientStart,
    gradientEnd,
    colors,
  }: {
    path: CharPath['path']
    progress: SharedValue<number>
    index: number
    total: number
    gradientStart: { x: number; y: number }
    gradientEnd: { x: number; y: number }
    colors: string[]
  }) => {
    // stroke draws during this char's slot
    const strokeEnd = useDerivedValue(() => {
      const p = progress.get()
      const charStart = index / total
      const charEnd = (index + 1) / total
      if (p <= charStart) return 0
      if (p >= charEnd) return 1
      return (p - charStart) / (charEnd - charStart)
    })

    // fill fades in as stroke finishes
    const fillOpacity = useDerivedValue(() => {
      const p = progress.get()
      const fillStart = (index + 0.7) / total
      const fillEnd = (index + 1) / total
      if (p <= fillStart) return 0
      if (p >= fillEnd) return 1
      return (p - fillStart) / (fillEnd - fillStart)
    })

    return (
      <Group>
        <Path
          path={path}
          style="stroke"
          strokeWidth={STROKE_WIDTH}
          strokeCap="round"
          strokeJoin="round"
          start={0}
          end={strokeEnd}
        >
          <LinearGradient
            start={vec(gradientStart.x, gradientStart.y)}
            end={vec(gradientEnd.x, gradientEnd.y)}
            colors={colors}
          />
        </Path>

        <Path path={path} style="fill" opacity={fillOpacity}>
          <LinearGradient
            start={vec(gradientStart.x, gradientStart.y)}
            end={vec(gradientEnd.x, gradientEnd.y)}
            colors={colors}
          />
        </Path>
      </Group>
    )
  }
)

function buildWordPaths(
  text: string,
  font: NonNullable<ReturnType<typeof useFont>>,
  startX: number,
  y: number
) {
  const glyphIDs = font.getGlyphIDs(text)
  const widths = font.getGlyphWidths(glyphIDs)
  const totalWidth = widths.reduce((sum, w) => sum + w, 0)

  const chars: CharPath[] = []
  let xOffset = 0
  for (let i = 0; i < text.length; i++) {
    const path = Skia.Path.MakeFromText(text[i]!, startX + xOffset, y, font)
    if (path) {
      chars.push({ path })
    }
    xOffset += widths[i]!
  }

  return { chars, totalWidth }
}

export const HelloTakeout = memo(
  ({ onComplete, duration = 10000 }: HelloTakeoutProps) => {
    const { width, height } = useWindowDimensions()
    const font = useFont(
      require('~/interface/fonts/PlaywriteAUTAS-Regular.ttf'),
      FONT_SIZE
    )

    const helloProgress = useSharedValue(0)
    const takeoutProgress = useSharedValue(0)

    const centerX = width / 2
    const centerY = height / 2

    const layout = useMemo(() => {
      if (!font) return null

      const helloMeasured = font.measureText('hello')
      const takeoutMeasured = font.measureText('takeout')

      const totalHeight = FONT_SIZE * 2 + LINE_GAP
      const topY = centerY - totalHeight / 2 + FONT_SIZE
      const bottomY = topY + FONT_SIZE + LINE_GAP

      const helloStartX = centerX - helloMeasured.width / 2
      const takeoutStartX = centerX - takeoutMeasured.width / 2

      const hello = buildWordPaths('hello', font, helloStartX, topY)
      const takeout = buildWordPaths('takeout', font, takeoutStartX, bottomY)

      return {
        hello: hello.chars,
        takeout: takeout.chars,
        helloStartX,
        takeoutStartX,
        helloW: hello.totalWidth,
        takeoutW: takeout.totalWidth,
        topY,
        bottomY,
      }
    }, [font, centerX, centerY])

    /* oxlint-disable react-hooks/exhaustive-deps -- shared values are stable refs */
    useEffect(() => {
      const ease = Easing.bezier(0.37, 0, 0.63, 1)

      helloProgress.set(withTiming(1, { duration: duration * 0.5, easing: ease }))

      takeoutProgress.set(
        withDelay(
          duration * 0.4,
          withTiming(1, { duration: duration * 0.5, easing: ease })
        )
      )

      const timeout = setTimeout(() => {
        onComplete?.()
      }, duration)

      return () => clearTimeout(timeout)
    }, [duration, onComplete])
    /* oxlint-enable react-hooks/exhaustive-deps */

    if (!font || !layout) return null

    return (
      <Canvas style={[StyleSheet.absoluteFillObject, styles.canvas]}>
        {layout.hello.map((char, i) => (
          <CharStrokeDraw
            key={`h${i}`}
            path={char.path}
            progress={helloProgress}
            index={i}
            total={layout.hello.length}
            gradientStart={{ x: layout.helloStartX, y: layout.topY }}
            gradientEnd={{
              x: layout.helloStartX + layout.helloW,
              y: layout.topY,
            }}
            colors={['#FF6B6B', '#FECA57']}
          />
        ))}

        {layout.takeout.map((char, i) => (
          <CharStrokeDraw
            key={`t${i}`}
            path={char.path}
            progress={takeoutProgress}
            index={i}
            total={layout.takeout.length}
            gradientStart={{ x: layout.takeoutStartX, y: layout.bottomY }}
            gradientEnd={{
              x: layout.takeoutStartX + layout.takeoutW,
              y: layout.bottomY,
            }}
            colors={['#4ECDC4', '#A855F7']}
          />
        ))}
      </Canvas>
    )
  }
)

const styles = StyleSheet.create({
  canvas: {
    backgroundColor: 'white',
    zIndex: 1000,
  },
})
