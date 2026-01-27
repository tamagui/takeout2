import {
  Canvas,
  Fill,
  ImageShader,
  rect,
  Shader,
  Skia,
  useImage,
  vec,
} from '@shopify/react-native-skia'
import { memo, useEffect, useMemo } from 'react'
import { StyleSheet, useWindowDimensions } from 'react-native'
import Animated, {
  Easing,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated'

// child shader: soft gradient mesh + logo on cream
const backgroundSksl = `
uniform shader u_logo;
uniform float2 u_resolution;
uniform float u_logoOpacity;
uniform float u_logoOffsetY;

half4 main(float2 xy) {
  float2 uv = xy / u_resolution;
  float aspect = u_resolution.x / u_resolution.y;
  float2 nuv = float2(uv.x * aspect, uv.y);

  // warm cream base
  half3 col = half3(0.98, 0.96, 0.93);

  // soft gaussian color fields (exp(-d²*k) for dreamy falloff)
  float2 p1 = float2(aspect * 0.25, 0.2);
  float2 p2 = float2(aspect * 0.75, 0.15);
  float2 p3 = float2(aspect * 0.5, 0.65);
  float2 p4 = float2(aspect * 0.15, 0.8);
  float2 p5 = float2(aspect * 0.85, 0.7);
  float2 p6 = float2(aspect * 0.5, 0.35);

  float g1 = exp(-dot(nuv - p1, nuv - p1) * 8.0);
  float g2 = exp(-dot(nuv - p2, nuv - p2) * 6.0);
  float g3 = exp(-dot(nuv - p3, nuv - p3) * 5.0);
  float g4 = exp(-dot(nuv - p4, nuv - p4) * 9.0);
  float g5 = exp(-dot(nuv - p5, nuv - p5) * 7.0);
  float g6 = exp(-dot(nuv - p6, nuv - p6) * 4.0);

  // peach, sky blue, lavender, soft coral, mint, warm gold
  col = mix(col, half3(1.0, 0.78, 0.65), half(g1 * 0.6));
  col = mix(col, half3(0.55, 0.78, 0.95), half(g2 * 0.5));
  col = mix(col, half3(0.75, 0.62, 0.90), half(g3 * 0.45));
  col = mix(col, half3(0.95, 0.65, 0.60), half(g4 * 0.4));
  col = mix(col, half3(0.55, 0.90, 0.75), half(g5 * 0.35));
  col = mix(col, half3(0.95, 0.88, 0.60), half(g6 * 0.3));

  // composite logo over gradient (offset Y for splash continuity)
  half4 logo = u_logo.eval(xy + float2(0.0, u_logoOffsetY));
  col = mix(col, logo.rgb, logo.a * half(u_logoOpacity));

  return half4(col, 1.0);
}
`

// parent shader: morning dew drop with animated position/size/opacity
const waterDropSksl = `
uniform shader u_bg;
uniform float2 u_resolution;
uniform float2 u_dropCenter;
uniform float u_dropSize;
uniform float u_dropOpacity;

const float PI = 3.14159265;
const float AIR_IOR = 1.0003;
const float GLASS_IOR = 1.5;
const float REFRACT_DIST = 220.0;
const float REFLECT_DIST = 200.0;

float pow2(float x) { return x * x; }
float pow5(float x) { float x2 = x * x; return x2 * x2 * x; }

float linearStep(float e0, float e1, float x) {
  return clamp((x - e0) / (e1 - e0), 0.0, 1.0);
}

float fresnelSchlick(float cosTheta, float f0) {
  return f0 + (1.0 - f0) * pow5(1.0 - cosTheta);
}

float glassIorCA(float wavelength) {
  float ab = 0.12;
  float x = 1.0 - pow(1.0 - linearStep(450.0, 650.0, wavelength), 4.0);
  return mix(GLASS_IOR + ab, GLASS_IOR - ab, x);
}

half3 sampleRefract(float2 coord, float3 normal, float ior) {
  float3 r = refract(float3(0.0, 0.0, 1.0), normal, AIR_IOR / ior);
  r /= abs(r.z / REFRACT_DIST);
  float2 rc = clamp(coord + r.xy, float2(0.0, 0.0), u_resolution);
  return u_bg.eval(rc).rgb;
}

half4 main(float2 xy) {
  half4 bg = u_bg.eval(xy);

  if (u_dropSize < 1.0) return bg;

  float dist = distance(xy, u_dropCenter);

  // subtle shadow beneath the drop
  float shadowDist = distance(xy, u_dropCenter + float2(0.0, u_dropSize * 0.08));
  float shadow = smoothstep(u_dropSize * 1.1, u_dropSize * 0.85, shadowDist) * 0.12 * u_dropOpacity;
  half4 bgWithShadow = half4(bg.rgb * half(1.0 - shadow), 1.0);

  if (dist > u_dropSize) return bgWithShadow;

  // hemisphere normal: very flat center, steep edges
  float2 fc = (xy - u_dropCenter) / u_dropSize;
  float r2 = dot(fc, fc);
  float z = sqrt(max(1.0 - r2, 0.001));

  // center is almost flat (0.06), edges ramp up smoothly
  float edgeRamp = smoothstep(0.0, 1.0, sqrt(r2));
  float3 normal = normalize(float3(fc * (0.06 + edgeRamp * 0.94), -z));

  // 6-sample chromatic aberration (clear center, prismatic edges)
  half3 refracted = half3(0.0, 0.0, 0.0);
  refracted += sampleRefract(xy, normal, glassIorCA(611.4)) * half3(1.0, 0.0, 0.0);
  refracted += sampleRefract(xy, normal, glassIorCA(570.5)) * half3(1.0, 1.0, 0.0);
  refracted += sampleRefract(xy, normal, glassIorCA(549.1)) * half3(0.0, 1.0, 0.0);
  refracted += sampleRefract(xy, normal, glassIorCA(491.4)) * half3(0.0, 1.0, 1.0);
  refracted += sampleRefract(xy, normal, glassIorCA(464.2)) * half3(0.0, 0.0, 1.0);
  refracted += sampleRefract(xy, normal, glassIorCA(374.0)) * half3(1.0, 0.0, 1.0);
  refracted /= 3.0;

  // fresnel
  float3 V = float3(0.0, 0.0, -1.0);
  float NDotV = clamp(dot(V, normal), 0.0, 1.0);
  float f0 = pow2((GLASS_IOR - AIR_IOR) / (GLASS_IOR + AIR_IOR));
  float fresnel = fresnelSchlick(NDotV, f0);

  // reflection
  float3 reflDir = reflect(float3(0.0, 0.0, 1.0), normal);
  reflDir /= abs(reflDir.z / REFLECT_DIST);
  float2 reflCoord = clamp(xy + reflDir.xy, float2(0.0, 0.0), u_resolution);
  half3 reflected = u_bg.eval(reflCoord).rgb;

  half3 dropColor = mix(refracted, reflected, half(fresnel));

  // clean directional specular highlight (top-right light)
  float3 lightDir = normalize(float3(0.4, -0.5, -1.0));
  float3 H = normalize(lightDir + V);
  float NdH = max(dot(normal, H), 0.0);
  float specular = pow(NdH, 120.0) * 0.9;
  dropColor += half3(half(specular), half(specular), half(specular));

  // soft rim glow
  float rim = pow(1.0 - NDotV, 5.0) * 0.15;
  dropColor += half3(half(rim), half(rim), half(rim));

  // smooth edge mask modulated by opacity
  float mask = smoothstep(u_dropSize, u_dropSize - 2.0, dist) * u_dropOpacity;
  return half4(mix(bgWithShadow.rgb, dropColor, half(mask)), 1.0);
}
`

type LiquidGlassTakeoutProps = {
  onComplete?: () => void
  duration?: number
}

export const LiquidGlassTakeout = memo(
  ({ onComplete, duration = 3000 }: LiquidGlassTakeoutProps) => {
    const { width, height } = useWindowDimensions()
    const logoImage = useImage(require('../../../assets/logo.png'))

    const bgEffect = useMemo(() => Skia.RuntimeEffect.Make(backgroundSksl), [])
    const dropEffect = useMemo(() => Skia.RuntimeEffect.Make(waterDropSksl), [])

    const minDim = Math.min(width, height)

    // animation shared values — start with center below screen so top half peeks up
    const startSize = minDim * 0.18
    const dropCenterY = useSharedValue(height + startSize * 0.5)
    const dropSize = useSharedValue(startSize)
    const dropOpacity = useSharedValue(1)
    const logoOpacity = useSharedValue(0)
    const logoOffsetY = useSharedValue(height * 0.4)
    const canvasOpacity = useSharedValue(1)

    // logo rect centered on screen
    const logoDisplaySize = minDim * 0.15
    const logoRect = useMemo(
      () =>
        rect(
          width / 2 - logoDisplaySize / 2,
          height / 2 - logoDisplaySize / 2,
          logoDisplaySize,
          logoDisplaySize
        ),
      [width, height, logoDisplaySize]
    )

    /* oxlint-disable react-hooks/exhaustive-deps -- shared values are stable refs */
    useEffect(() => {
      if (!logoImage) return

      const t = (pct: number) => duration * pct

      // phase 1: rise (0–40%), then hold, then evaporate (67–93%)
      dropCenterY.set(
        withTiming(height * 0.5, {
          duration: t(0.4),
          easing: Easing.out(Easing.cubic),
        })
      )
      dropSize.set(
        withSequence(
          withTiming(minDim * 0.28, {
            duration: t(0.4),
            easing: Easing.out(Easing.cubic),
          }),
          withDelay(
            t(0.27),
            withTiming(minDim * 0.35, {
              duration: t(0.26),
              easing: Easing.in(Easing.quad),
            })
          )
        )
      )

      // phase 2: logo descends from top to center + fades in (20–50%)
      logoOffsetY.set(
        withDelay(
          t(0.2),
          withTiming(0, {
            duration: t(0.3),
            easing: Easing.out(Easing.cubic),
          })
        )
      )
      logoOpacity.set(
        withDelay(
          t(0.2),
          withTiming(1, {
            duration: t(0.2),
            easing: Easing.inOut(Easing.quad),
          })
        )
      )
      dropOpacity.set(
        withDelay(
          t(0.67),
          withTiming(0, {
            duration: t(0.26),
            easing: Easing.in(Easing.quad),
          })
        )
      )

      // phase 5: canvas fades out (87–100%)
      canvasOpacity.set(
        withDelay(
          t(0.87),
          withTiming(0, {
            duration: t(0.13),
            easing: Easing.in(Easing.quad),
          })
        )
      )

      // fire onComplete at end
      if (onComplete) {
        const timer = setTimeout(() => onComplete(), duration)
        return () => clearTimeout(timer)
      }
    }, [logoImage, duration, height, minDim, onComplete])
    /* oxlint-enable react-hooks/exhaustive-deps */

    const bgUniforms = useDerivedValue(() => ({
      u_resolution: vec(width, height),
      u_logoOpacity: logoOpacity.get(),
      u_logoOffsetY: logoOffsetY.get(),
    }))

    const dropUniforms = useDerivedValue(() => ({
      u_resolution: vec(width, height),
      u_dropCenter: vec(width / 2, dropCenterY.get()),
      u_dropSize: dropSize.get(),
      u_dropOpacity: dropOpacity.get(),
    }))

    const canvasAnimatedStyle = useAnimatedStyle(() => ({
      opacity: canvasOpacity.get(),
    }))

    if (!bgEffect || !dropEffect || !logoImage) return null

    return (
      <Animated.View
        style={[StyleSheet.absoluteFillObject, styles.wrapper, canvasAnimatedStyle]}
      >
        <Canvas style={[StyleSheet.absoluteFillObject, styles.canvas]}>
          <Fill>
            <Shader source={dropEffect} uniforms={dropUniforms}>
              <Shader source={bgEffect} uniforms={bgUniforms}>
                <ImageShader
                  image={logoImage}
                  fit="contain"
                  rect={logoRect}
                  tx="decal"
                  ty="decal"
                />
              </Shader>
            </Shader>
          </Fill>
        </Canvas>
      </Animated.View>
    )
  }
)

const styles = StyleSheet.create({
  wrapper: {
    zIndex: 1000,
  },
  canvas: {
    backgroundColor: '#faf5ee',
  },
})
