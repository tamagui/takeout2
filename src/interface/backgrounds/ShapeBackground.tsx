import { View, useThemeName, type ViewProps } from 'tamagui'

export interface ShapeProps extends Omit<ViewProps, 'children' | 'rotate'> {
  gradient?: string
  rotate?: number
}

const Shape = ({
  width = 400,
  height = 100,
  rotate = 0,
  gradient = 'rgba(168, 85, 247, 0.12)',
  ...props
}: ShapeProps) => {
  return (
    <View
      position="absolute"
      animation="medium"
      opacity={1}
      y={0}
      rotate={`${rotate}deg`}
      enterStyle={{
        opacity: 0,
        y: -150,
        rotate: `${rotate - 15}deg`,
      }}
      animateOnly={['opacity', 'transform']}
      {...props}
    >
      <View
        width={width}
        height={height}
        animation="slow"
        y={0}
        className="shape-floating"
        animateOnly={['transform']}
      >
        <View
          position="absolute"
          t={0}
          l={0}
          r={0}
          b={0}
          borderWidth={1}
          borderColor="rgba(255, 255, 255, 0.08)"
          overflow="hidden"
          className="shape-inner"
          backgroundImage={`linear-gradient(90deg, ${gradient} 0%, transparent 50%, ${gradient} 100%)`}
        >
          <View position="absolute" t={0} l={0} r={0} b={0} className="shape-glow" />
        </View>
      </View>
    </View>
  )
}

export interface ShapeBackgroundProps extends Omit<ViewProps, 'children'> {
  opacity?: number
}

export const ShapeBackground = ({ opacity = 1, ...props }: ShapeBackgroundProps) => {
  const theme = useThemeName()
  const isDark = theme?.includes('dark')

  return (
    <View
      position="absolute"
      t={0}
      l={0}
      r={0}
      b={0}
      pointerEvents="none"
      z={-1}
      overflow="hidden"
      {...props}
    >
      <View
        position="absolute"
        t={0}
        l={0}
        r={0}
        b={0}
        pointerEvents="none"
        opacity={opacity * 0.3}
        className="bg-gradient-purple"
      />

      <View
        position="absolute"
        t={0}
        l={0}
        r={0}
        b={0}
        pointerEvents="none"
        opacity={opacity * 0.25}
        className="bg-gradient-pink"
      />

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
        <Shape
          width={600}
          height={140}
          rotate={12}
          gradient="rgba(168, 85, 247, 0.12)"
          l="-10%"
          t="15%"
        />

        <Shape
          width={500}
          height={120}
          rotate={-15}
          gradient="rgba(236, 72, 153, 0.12)"
          r="-5%"
          t="70%"
        />

        <Shape
          width={300}
          height={80}
          rotate={-8}
          gradient="rgba(139, 92, 246, 0.25)"
          l="5%"
          b="5%"
        />

        <Shape
          width={250}
          height={60}
          rotate={20}
          gradient="rgba(251, 191, 36, 0.10)"
          r="15%"
          t="10%"
        />

        <Shape
          width={180}
          height={50}
          rotate={-25}
          gradient="rgba(6, 182, 212, 0.10)"
          l="20%"
          t="5%"
        />

        <Shape
          width={350}
          height={90}
          rotate={30}
          gradient="rgba(16, 185, 129, 0.08)"
          r="5%"
          b="20%"
        />
      </View>

      <View
        position="absolute"
        t={0}
        l={0}
        r={0}
        b={0}
        pointerEvents="none"
        className={isDark ? 'vignette-dark' : 'vignette-light'}
      />
    </View>
  )
}
