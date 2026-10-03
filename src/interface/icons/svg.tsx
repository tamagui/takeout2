import { createElement, forwardRef, type ComponentProps } from 'react'

// re-export the primitives used by OneLogo (aliased to @tamagui/react-native-svg on web)
export { Circle, Defs, Ellipse, G, Path, Svg } from 'react-native-svg'

// add missing filter components for web that aren't in @tamagui/react-native-svg
export const Filter = forwardRef<SVGFilterElement, ComponentProps<'filter'>>(
  (props, ref) => createElement('filter', { ...props, ref }),
)

export const FeGaussianBlur = forwardRef<
  SVGFEGaussianBlurElement,
  ComponentProps<'feGaussianBlur'>
>((props, ref) => createElement('feGaussianBlur', { ...props, ref }))
