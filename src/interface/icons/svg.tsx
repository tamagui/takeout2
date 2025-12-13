import { createElement, forwardRef, type ComponentProps } from 'react'

// re-export everything from react-native-svg (aliased to @tamagui/react-native-svg on web)
export * from 'react-native-svg'

// add missing filter components for web that aren't in @tamagui/react-native-svg
export const Filter = forwardRef<SVGFilterElement, ComponentProps<'filter'>>(
  (props, ref) => createElement('filter', { ...props, ref })
)

export const FeGaussianBlur = forwardRef<
  SVGFEGaussianBlurElement,
  ComponentProps<'feGaussianBlur'>
>((props, ref) => createElement('feGaussianBlur', { ...props, ref }))
