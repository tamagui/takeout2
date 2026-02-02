import { Canvas, RoundedRect } from '@shopify/react-native-skia'
import { memo, useEffect, useMemo } from 'react'
import { StyleSheet } from 'react-native'
import type { SharedValue } from 'react-native-reanimated'
import {
  useDerivedValue,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated'

const CONFETTI_COLORS = ['#ff6b6b', '#feca57', '#48dbfb', '#ff9ff3', '#54a0ff', '#5f27cd']
const PARTICLE_COUNT = 24

type Particle = {
  x: number
  y: number
  color: string
  size: number
  velocityX: number
  velocityY: number
}

function createParticles(centerX: number, centerY: number): Particle[] {
  return Array.from({ length: PARTICLE_COUNT }, () => {
    const angle = Math.random() * Math.PI * 2
    const speed = 2 + Math.random() * 4
    return {
      x: centerX,
      y: centerY,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)]!,
      size: 4 + Math.random() * 4,
      velocityX: Math.cos(angle) * speed,
      velocityY: -Math.abs(Math.sin(angle) * speed) - 2,
    }
  })
}

type ConfettiProps = {
  trigger: boolean
  originX: number
  originY: number
}

export const Confetti = memo(({ trigger, originX, originY }: ConfettiProps) => {
  const progress = useSharedValue(0)
  const particles = useMemo(() => createParticles(originX, originY), [originX, originY])

  useEffect(() => {
    if (trigger) {
      progress.set(0)
      progress.set(withDelay(500, withTiming(1, { duration: 800 })))
    }
  }, [trigger, progress])

  return (
    <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
      {particles.map((particle, index) => (
        <ConfettiParticle key={index} particle={particle} progress={progress} />
      ))}
    </Canvas>
  )
})

const ConfettiParticle = memo(
  ({ particle, progress }: { particle: Particle; progress: SharedValue<number> }) => {
    const x = useDerivedValue(() => {
      const t = progress.value
      return particle.x + particle.velocityX * t * 100 - particle.size / 2
    })

    const y = useDerivedValue(() => {
      const t = progress.value
      const gravity = 300
      return particle.y + particle.velocityY * t * 100 + 0.5 * gravity * t * t - particle.size / 2
    })

    const opacity = useDerivedValue(() => {
      if (progress.value === 0 || progress.value === 1) return 0
      return 1 - progress.value
    })

    return (
      <RoundedRect
        x={x}
        y={y}
        width={particle.size}
        height={particle.size * 1.5}
        r={1}
        color={particle.color}
        opacity={opacity}
      />
    )
  }
)
