import {
  Canvas,
  Fill,
  Group,
  Paint,
  RoundedRect,
  Shadow,
  Shader,
  Skia,
  vec,
} from '@shopify/react-native-skia'
import { memo, useEffect, useMemo } from 'react'
import { StyleSheet, useWindowDimensions } from 'react-native'
import Animated, {
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated'

// animated aurora background
const backgroundSksl = `
uniform float2 u_resolution;
uniform float u_time;

half4 main(float2 xy) {
  float2 uv = xy / u_resolution;

  // layered sine waves for an aurora effect
  float t = u_time * 0.0008;
  float wave1 = sin(uv.x * 3.0 + t) * 0.5 + 0.5;
  float wave2 = sin(uv.y * 2.5 - t * 1.3 + uv.x * 1.5) * 0.5 + 0.5;
  float wave3 = sin((uv.x + uv.y) * 2.0 + t * 0.7) * 0.5 + 0.5;

  // warm palette: peach, coral, soft gold
  half3 col1 = half3(1.0, 0.82, 0.65);  // peach
  half3 col2 = half3(0.95, 0.55, 0.45); // coral
  half3 col3 = half3(1.0, 0.92, 0.7);   // soft gold
  half3 col4 = half3(0.85, 0.65, 0.8);  // lavender

  half3 color = mix(col1, col2, half(wave1));
  color = mix(color, col3, half(wave2 * 0.6));
  color = mix(color, col4, half(wave3 * 0.3));

  return half4(color, 1.0);
}
`

// liquid glass shader with specular highlight and frosted edges
const glassSksl = `
uniform float2 u_resolution;
uniform float2 u_glass_size;
uniform float u_time;
uniform float u_highlight;

half4 main(float2 xy) {
  float2 uv = xy / u_glass_size;

  // frosted glass base
  float distFromCenter = length(uv - float2(0.5, 0.5));
  float frost = 0.12 + 0.06 * sin(uv.x * 12.0 + u_time * 0.001) *
                         sin(uv.y * 10.0 - u_time * 0.0008);

  // specular highlight sweep (diagonal)
  float highlight = u_highlight;
  float diagPos = (uv.x + uv.y) * 0.5;
  float highlightBand = smoothstep(highlight - 0.15, highlight, diagPos) *
                        smoothstep(highlight + 0.15, highlight, diagPos);
  float specular = highlightBand * 0.55;

  // edge glow (thicker at top, thinner at bottom for depth)
  float edgeX = min(uv.x, 1.0 - uv.x);
  float edgeY = min(uv.y, 1.0 - uv.y);
  float edge = smoothstep(0.0, 0.08, min(edgeX, edgeY));
  float edgeGlow = (1.0 - edge) * 0.2;

  // top rim highlight
  float topRim = smoothstep(0.06, 0.0, uv.y) * 0.3;

  // combine: semi-transparent white with effects
  float alpha = frost + specular + edgeGlow + topRim;
  half3 color = half3(1.0, 1.0, 1.0);

  return half4(color * half(alpha), half(alpha));
}
`

const GLASS_WIDTH = 240
const GLASS_HEIGHT = 260
const GLASS_RADIUS = 32

export const LiquidGlassTakeout = memo(() => {
  const { width, height } = useWindowDimensions()

  // compile shaders once
  const bgEffect = useMemo(() => Skia.RuntimeEffect.Make(backgroundSksl), [])
  const glassEffect = useMemo(() => Skia.RuntimeEffect.Make(glassSksl), [])

  // animation drivers
  const clock = useSharedValue(0)
  const highlightPos = useSharedValue(-0.3)
  const emojiScale = useSharedValue(0.3)
  const emojiOpacity = useSharedValue(0)
  const floatY = useSharedValue(0)

  /* oxlint-disable react-hooks/exhaustive-deps -- shared values are stable refs */
  useEffect(() => {
    // clock ticks continuously
    clock.set(
      withRepeat(withTiming(60000, { duration: 60000, easing: Easing.linear }), -1, false)
    )

    // specular highlight sweeps across glass repeatedly
    highlightPos.set(
      withDelay(
        500,
        withRepeat(
          withTiming(1.3, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
          -1,
          true
        )
      )
    )

    // emoji entrance
    emojiScale.set(
      withDelay(
        300,
        withTiming(1, { duration: 600, easing: Easing.out(Easing.back(1.4)) })
      )
    )
    emojiOpacity.set(withDelay(200, withTiming(1, { duration: 400 })))

    // gentle float
    floatY.set(
      withDelay(
        800,
        withRepeat(
          withSequence(
            withTiming(-8, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
            withTiming(8, { duration: 2000, easing: Easing.inOut(Easing.ease) })
          ),
          -1,
          true
        )
      )
    )
  }, [])
  /* oxlint-enable react-hooks/exhaustive-deps */

  // glass position (centered)
  const glassX = (width - GLASS_WIDTH) / 2
  const glassY = (height - GLASS_HEIGHT) / 2

  // background shader uniforms
  const bgUniforms = useDerivedValue(() => ({
    u_resolution: vec(width, height),
    u_time: clock.get(),
  }))

  // glass shader uniforms
  const glassUniforms = useDerivedValue(() => ({
    u_resolution: vec(width, height),
    u_glass_size: vec(GLASS_WIDTH, GLASS_HEIGHT),
    u_time: clock.get(),
    u_highlight: highlightPos.get(),
  }))

  // emoji floating style
  const emojiStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatY.get() }, { scale: emojiScale.get() }],
    opacity: emojiOpacity.get(),
  }))

  if (!bgEffect || !glassEffect) return null

  return (
    <Animated.View style={[StyleSheet.absoluteFillObject, styles.container]}>
      <Canvas style={StyleSheet.absoluteFillObject}>
        {/* animated aurora background */}
        <Fill>
          <Paint>
            <Shader source={bgEffect} uniforms={bgUniforms} />
          </Paint>
        </Fill>

        {/* glass card with shadow */}
        <Group>
          <RoundedRect
            x={glassX}
            y={glassY}
            width={GLASS_WIDTH}
            height={GLASS_HEIGHT}
            r={GLASS_RADIUS}
          >
            <Paint>
              <Shader source={glassEffect} uniforms={glassUniforms} />
            </Paint>
            <Shadow dx={0} dy={8} blur={24} color="rgba(0,0,0,0.15)" />
            <Shadow dx={0} dy={2} blur={6} color="rgba(0,0,0,0.08)" inner />
          </RoundedRect>
        </Group>
      </Canvas>

      {/* emoji overlay - uses RN Text for reliable emoji rendering */}
      <Animated.View style={[styles.emojiContainer, emojiStyle]} pointerEvents="none">
        <Animated.Text style={styles.emoji}>🥡</Animated.Text>
        <Animated.Text style={styles.label}>takeout</Animated.Text>
      </Animated.View>
    </Animated.View>
  )
})

const styles = StyleSheet.create({
  container: {
    zIndex: 1000,
  },
  emojiContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emoji: {
    fontSize: 80,
    textAlign: 'center',
  },
  label: {
    fontSize: 18,
    fontWeight: '600',
    color: 'rgba(0,0,0,0.5)',
    marginTop: 12,
    letterSpacing: 4,
    textTransform: 'uppercase',
  },
})
