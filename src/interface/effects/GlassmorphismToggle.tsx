import {
  Canvas,
  RoundedRect,
  LinearGradient,
  vec,
  Group,
  Blur,
  Shadow,
  Fill,
  Shader,
  Skia,
} from '@shopify/react-native-skia'
import { useMemo, useEffect } from 'react'
import { StyleSheet, View } from 'react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import {
  useSharedValue,
  useDerivedValue,
  withTiming,
  withRepeat,
  withSequence,
  withDelay,
  withSpring,
  Easing,
  interpolate,
  runOnJS,
} from 'react-native-reanimated'

// ─────────────────────────────────────────────────────────────────────────────
// types
// ─────────────────────────────────────────────────────────────────────────────

interface GlassmorphismToggleProps {
  value?: boolean
  onValueChange?: (value: boolean) => void
  size?: 'small' | 'medium' | 'large'
}

// ─────────────────────────────────────────────────────────────────────────────
// constants
// ─────────────────────────────────────────────────────────────────────────────

const BORDER_RADIUS = 24

const SIZES = {
  small: { width: 120, height: 56, thumbSize: 44, iconSize: 18 },
  medium: { width: 160, height: 72, thumbSize: 56, iconSize: 22 },
  large: { width: 200, height: 88, thumbSize: 68, iconSize: 28 },
}

const ANIMATION_DURATION = 500
const GLOW_ANIMATION_DURATION = 2000

// inner shadow settings
const SHADOW_COLOR = 'rgba(0, 0, 0, 0.4)'
const SHADOW_OFFSET = 3
const SHADOW_BLUR = 6
const REFLECTED_LIGHT_COLOR = 'rgba(255, 255, 255, 0.05)'
const REFLECTED_LIGHT_BLUR = 4

// colors
const TRACK_BG_COLOR = '#0f0f11'

// glow colors
const GLOW_COLOR_1 = 'rgba(255, 140, 50, 0.8)'
const GLOW_COLOR_2 = 'rgba(255, 80, 20, 0.4)'
const GLOW_COLOR_3 = 'rgba(255, 60, 10, 0)'
const REFLECTION_COLOR_1 = 'rgba(255, 160, 80, 0.5)'
const REFLECTION_COLOR_2 = 'rgba(255, 100, 40, 0)'

// ─────────────────────────────────────────────────────────────────────────────
// glass thumb shader - proper fresnel + GGX specular
// based on physically-based glass rendering
// ─────────────────────────────────────────────────────────────────────────────

const glassThumbShader = `
uniform float2 u_resolution;
uniform float2 u_thumbCenter;
uniform float u_thumbSize;

const float PI = 3.14159265;
const float AIR_IOR = 1.0003;
const float GLASS_IOR = 1.52;
const float EDGE_FRACTION = 0.6;
const float EDGE_POWER = 3.0;

float pow2(float x) { return x * x; }
float pow5(float x) { float x2 = x * x; return x2 * x2 * x; }
float linearStep(float e0, float e1, float x) { return clamp((x - e0) / (e1 - e0), 0.0, 1.0); }

float fresnel_iorToF0(float ior) {
  return pow2((ior - AIR_IOR) / (ior + AIR_IOR));
}

float fresnel_schlick(float cosTheta, float f0) {
  return f0 + (1.0 - f0) * pow5(1.0 - cosTheta);
}

// GGX specular BRDF
float ggx_D(float roughness, float NDotH) {
  float a2 = pow2(roughness);
  float denom = pow2(pow2(NDotH) * (a2 - 1.0) + 1.0);
  return a2 / (PI * denom);
}

float ggx_G1(float cosTheta, float k) {
  return cosTheta / (cosTheta * (1.0 - k) + k);
}

float ggx_specular(float roughness, float NDotL, float NDotV, float NDotH) {
  if (NDotL <= 0.0) return 0.0;
  float k = pow2(roughness + 1.0) / 8.0;
  float G = ggx_G1(NDotL, k) * ggx_G1(saturate(NDotV), k);
  float D = ggx_D(roughness, NDotH);
  return (D * G) / max(4.0 * NDotL * NDotV, 0.001);
}

// rounded rect SDF for squircle shape
float roundedBoxSDF(float2 p, float2 b, float r) {
  float2 q = abs(p) - b + r;
  return min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - r;
}

half4 main(float2 fragCoord) {
  float2 p = fragCoord - u_thumbCenter;
  float halfSize = u_thumbSize * 0.5;
  float borderRadius = halfSize * 0.4;

  // SDF distance
  float dist = roundedBoxSDF(p, float2(halfSize), borderRadius);

  // early exit if outside
  if (dist > 2.0) {
    return half4(0.0, 0.0, 0.0, 0.0);
  }

  // edge factor for normal blending
  float edgeDist = length(p) / halfSize;
  float sdfValue = pow(linearStep(EDGE_FRACTION, 1.0, edgeDist), EDGE_POWER);

  // compute normal - flat in center, curved at edges
  float2 gradDir = normalize(p + 0.001);
  float3 flatNormal = float3(0.0, 0.0, -1.0);
  float3 edgeNormal = normalize(float3(gradDir * 0.8, -0.6));
  float3 normal = normalize(mix(flatNormal, edgeNormal, sdfValue));

  // view vector (looking at screen)
  float3 V = float3(0.0, 0.0, -1.0);
  float NDotV = saturate(dot(-V, normal));

  // fresnel
  float f0 = fresnel_iorToF0(GLASS_IOR);
  float fresnel = fresnel_schlick(NDotV, f0);

  // primary light from top-left (strong)
  float3 L1 = normalize(float3(-0.5, -0.7, -0.5));
  float3 H1 = normalize(L1 + (-V));
  float NDotL1 = saturate(dot(normal, L1));
  float NDotH1 = saturate(dot(normal, H1));
  float spec1 = ggx_specular(0.15, NDotL1, NDotV, NDotH1);

  // secondary light from top-right
  float3 L2 = normalize(float3(0.6, -0.5, -0.6));
  float3 H2 = normalize(L2 + (-V));
  float NDotL2 = saturate(dot(normal, L2));
  float NDotH2 = saturate(dot(normal, H2));
  float spec2 = ggx_specular(0.25, NDotL2, NDotV, NDotH2);

  // bottom fill light (subtle ambient from below)
  float3 L3 = normalize(float3(0.0, 0.8, -0.4));
  float3 H3 = normalize(L3 + (-V));
  float NDotL3 = saturate(dot(normal, L3));
  float NDotH3 = saturate(dot(normal, H3));
  float spec3 = ggx_specular(0.5, NDotL3, NDotV, NDotH3);

  // rim lighting (fresnel-based edge glow)
  float rim = pow(1.0 - NDotV, 3.5) * 0.6;

  // base glass color - subtle dark tint
  half3 glassColor = half3(0.04, 0.045, 0.055);

  // add specular highlights with different intensities
  glassColor += half3(spec1 * 1.2);
  glassColor += half3(spec2 * 0.6);
  glassColor += half3(spec3 * 0.15);

  // add rim/fresnel glow
  glassColor += half3(rim * 0.8);

  // top highlight band (curved glass reflection)
  float topHighlight = smoothstep(0.2 * halfSize, -0.3 * halfSize, p.y);
  float highlightMask = 1.0 - smoothstep(0.0, 0.6, sdfValue);
  glassColor += half3(topHighlight * 0.12 * highlightMask);

  // subtle inner glow gradient from center
  float centerGlow = 1.0 - smoothstep(0.0, halfSize * 0.8, length(p));
  glassColor += half3(centerGlow * 0.03);

  // edge border highlight (thin bright edge)
  float borderInner = smoothstep(3.0, 0.0, abs(dist));
  float borderOuter = smoothstep(0.0, -2.0, dist);
  float border = borderInner * borderOuter * 0.5;
  glassColor += half3(border);

  // bottom reflection (sitting on surface)
  float bottomRefl = smoothstep(-0.2 * halfSize, 0.4 * halfSize, p.y);
  bottomRefl *= (1.0 - smoothstep(0.5, 1.0, edgeDist));
  glassColor += half3(bottomRefl * 0.04);

  // alpha composition
  float bodyAlpha = 0.7;
  float edgeAlpha = fresnel * 0.3;
  float borderAlpha = border * 0.6;
  float alpha = bodyAlpha + edgeAlpha + borderAlpha;

  // anti-alias at edge
  float aa = 1.0 - smoothstep(-1.5, 0.5, dist);
  alpha *= aa;

  return half4(glassColor, half(clamp(alpha, 0.0, 0.95)));
}
`

// ─────────────────────────────────────────────────────────────────────────────
// component
// ─────────────────────────────────────────────────────────────────────────────

export function GlassmorphismToggle({
  value = false,
  onValueChange,
  size = 'medium',
}: GlassmorphismToggleProps) {
  const { width, height, thumbSize } = SIZES[size]
  const thumbPadding = (height - thumbSize) / 2

  // compile shader once
  const glassEffect = useMemo(() => Skia.RuntimeEffect.Make(glassThumbShader), [])

  // animation shared values
  const progress = useSharedValue(value ? 1 : 0)
  const flickerPhase = useSharedValue(0)
  const shakeOffset = useSharedValue(0)

  // sync external value changes
  useEffect(() => {
    progress.set(
      withTiming(value ? 1 : 0, {
        duration: ANIMATION_DURATION,
        easing: Easing.bezier(0.4, 0, 0.2, 1),
      })
    )
  }, [value, progress])

  // start glow flickering animation
  useEffect(() => {
    flickerPhase.set(
      withRepeat(
        withSequence(
          withTiming(1, {
            duration: GLOW_ANIMATION_DURATION,
            easing: Easing.inOut(Easing.sin),
          }),
          withTiming(0, {
            duration: GLOW_ANIMATION_DURATION,
            easing: Easing.inOut(Easing.sin),
          })
        ),
        -1,
        true
      )
    )
  }, [flickerPhase])

  // icon positions
  const moonIconX = thumbPadding + thumbSize / 2
  const sunIconX = width - thumbPadding - thumbSize / 2

  // derived values
  const glowOpacity = useDerivedValue(() => {
    const base = 0.5 + flickerPhase.get() * 0.4
    return base * (1 - progress.get() * 0.15)
  })

  const glowX = useDerivedValue(() => {
    const thumbX = interpolate(progress.get(), [0, 1], [moonIconX, sunIconX])
    const shake = shakeOffset.get()
    return thumbX - thumbSize / 2 - 6 + shake
  })

  const reflectionX = useDerivedValue(() => {
    const thumbX = interpolate(progress.get(), [0, 1], [moonIconX, sunIconX])
    const shake = shakeOffset.get()
    return thumbX - thumbSize / 4 + shake
  })

  // glass shader uniforms - animated thumb position with shake
  const glassUniforms = useDerivedValue(() => {
    const thumbX = interpolate(progress.get(), [0, 1], [moonIconX, sunIconX])
    const shake = shakeOffset.get()
    return {
      u_resolution: vec(width, height),
      u_thumbCenter: vec(thumbX + shake, height / 2 - Math.abs(shake) * 0.3),
      u_thumbSize: thumbSize,
    }
  })

  // tap gesture handler
  const handleToggle = (newValue: boolean) => {
    onValueChange?.(newValue)
  }

  const tapGesture = Gesture.Tap().onEnd(() => {
    const newValue = progress.get() < 0.5
    progress.set(
      withTiming(newValue ? 1 : 0, {
        duration: ANIMATION_DURATION,
        easing: Easing.bezier(0.4, 0, 0.2, 1),
      })
    )
    // shake animation: top-left → top-right → settle
    shakeOffset.set(
      withDelay(
        ANIMATION_DURATION * 0.6,
        withSequence(
          withSpring(-4, { damping: 8, stiffness: 400 }),
          withSpring(3, { damping: 10, stiffness: 350 }),
          withSpring(-2, { damping: 12, stiffness: 300 }),
          withSpring(0, { damping: 14, stiffness: 250 })
        )
      )
    )
    runOnJS(handleToggle)(newValue)
  })

  if (!glassEffect) return null

  return (
    <View style={styles.container}>
      <GestureDetector gesture={tapGesture}>
        <View style={[styles.wrapper, { width, height }]}>
          <Canvas style={[styles.canvas, { width, height }]}>
            {/* track background with inner shadow */}
            <RoundedRect
              x={0}
              y={0}
              width={width}
              height={height}
              r={BORDER_RADIUS}
              color={TRACK_BG_COLOR}
            >
              <Shadow
                dx={SHADOW_OFFSET}
                dy={SHADOW_OFFSET}
                blur={SHADOW_BLUR}
                color={SHADOW_COLOR}
                inner
              />
              <Shadow
                dx={-SHADOW_OFFSET * 0.5}
                dy={-SHADOW_OFFSET * 0.5}
                blur={REFLECTED_LIGHT_BLUR}
                color={REFLECTED_LIGHT_COLOR}
                inner
              />
            </RoundedRect>

            {/* ember glow under thumb */}
            <Group opacity={glowOpacity}>
              <RoundedRect
                x={glowX}
                y={height - 14}
                width={thumbSize + 12}
                height={18}
                r={9}
              >
                <LinearGradient
                  start={vec(0, height - 14)}
                  end={vec(0, height + 4)}
                  colors={[GLOW_COLOR_1, GLOW_COLOR_2, GLOW_COLOR_3]}
                />
                <Blur blur={10} />
              </RoundedRect>
            </Group>

            {/* surface reflection */}
            <Group opacity={glowOpacity}>
              <RoundedRect
                x={reflectionX}
                y={height - 7}
                width={thumbSize / 2}
                height={5}
                r={2.5}
              >
                <LinearGradient
                  start={vec(0, height - 7)}
                  end={vec(0, height - 2)}
                  colors={[REFLECTION_COLOR_1, REFLECTION_COLOR_2]}
                />
                <Blur blur={3} />
              </RoundedRect>
            </Group>

            {/* glass thumb with shader */}
            <Fill>
              <Shader source={glassEffect} uniforms={glassUniforms} />
            </Fill>
          </Canvas>
        </View>
      </GestureDetector>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  wrapper: {
    overflow: 'hidden',
    borderRadius: BORDER_RADIUS,
  },
  canvas: {
    flex: 1,
  },
})
