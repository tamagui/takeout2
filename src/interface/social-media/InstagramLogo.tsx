import { useId } from 'react'
import Svg, { Defs, LinearGradient, Stop, Rect, Circle } from 'react-native-svg'

export const InstagramLogo = ({ size = 24 }: { size?: number }) => {
  const gradientId = useId()

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Defs>
        <LinearGradient id={gradientId} x1="0%" y1="100%" x2="100%" y2="0%">
          <Stop offset="0%" stopColor="#FDB913" />
          <Stop offset="15%" stopColor="#F9A03C" />
          <Stop offset="30%" stopColor="#F7638C" />
          <Stop offset="44%" stopColor="#EE486F" />
          <Stop offset="58.5%" stopColor="#D92E7F" />
          <Stop offset="72%" stopColor="#B73593" />
          <Stop offset="86%" stopColor="#9536B0" />
          <Stop offset="100%" stopColor="#5B4FE9" />
        </LinearGradient>
      </Defs>
      <Rect
        width="20"
        height="20"
        x="2"
        y="2"
        rx="5"
        ry="5"
        stroke={`url(#${gradientId})`}
        strokeWidth="2"
        fill="none"
      />
      <Circle
        cx="12"
        cy="12"
        r="4"
        stroke={`url(#${gradientId})`}
        strokeWidth="2"
        fill="none"
      />
      <Circle cx="17.5" cy="6.5" r="1" fill={`url(#${gradientId})`} />
    </Svg>
  )
}
