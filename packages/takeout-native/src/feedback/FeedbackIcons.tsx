import Svg, { Circle, Line, Path } from 'react-native-svg'

// the three control glyphs, drawn rather than imported: the overlay ships with
// every app and must not assume the app's icon set is installed.

export function DrawIcon({ size = 20, color }: { size?: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 20l4.5-1.2L19.3 8a2.1 2.1 0 0 0-3-3L5.2 15.5 4 20z"
        stroke={color}
        strokeWidth={1.7}
        strokeLinejoin="round"
      />
      <Path d="M14.5 6.5l3 3" stroke={color} strokeWidth={1.7} strokeLinecap="round" />
    </Svg>
  )
}

export function InspectIcon({ size = 20, color }: { size?: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={5.4} stroke={color} strokeWidth={1.7} />
      <Line
        x1={12}
        y1={1.8}
        x2={12}
        y2={5}
        stroke={color}
        strokeWidth={1.7}
        strokeLinecap="round"
      />
      <Line
        x1={12}
        y1={19}
        x2={12}
        y2={22.2}
        stroke={color}
        strokeWidth={1.7}
        strokeLinecap="round"
      />
      <Line
        x1={1.8}
        y1={12}
        x2={5}
        y2={12}
        stroke={color}
        strokeWidth={1.7}
        strokeLinecap="round"
      />
      <Line
        x1={19}
        y1={12}
        x2={22.2}
        y2={12}
        stroke={color}
        strokeWidth={1.7}
        strokeLinecap="round"
      />
    </Svg>
  )
}

export function CloseIcon({ size = 20, color }: { size?: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Line
        x1={6}
        y1={6}
        x2={18}
        y2={18}
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
      <Line
        x1={18}
        y1={6}
        x2={6}
        y2={18}
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
    </Svg>
  )
}
