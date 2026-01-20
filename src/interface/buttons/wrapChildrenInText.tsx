import React, { Fragment } from 'react'

import type { SizeTokens, TextParentStyles } from 'tamagui'

type Props = TextParentStyles & {
  children?: React.ReactNode
  size?: SizeTokens
}

export function wrapChildrenInText(
  TextComponent: any,
  propsIn: Props & {
    unstyled?: boolean
  },
  extraProps?: Record<string, any>
) {
  const {
    children,
    textProps,
    size,
    noTextWrap,
    color,
    fontFamily,
    fontSize,
    fontWeight,
    letterSpacing,
    textAlign,
    fontStyle,
    maxFontSizeMultiplier,
  } = propsIn

  if (noTextWrap || !children) {
    return [children]
  }

  const props = {
    ...extraProps,
  }

  // to avoid setting undefined
  if (color) props.color = color
  if (fontFamily) props.fontFamily = fontFamily
  if (fontSize) props.fontSize = fontSize
  if (fontWeight) props.fontWeight = fontWeight
  if (letterSpacing) props.letterSpacing = letterSpacing
  if (textAlign) props.textAlign = textAlign
  if (size) props.size = size
  if (fontStyle) props.fontStyle = fontStyle
  if (maxFontSizeMultiplier) props.maxFontSizeMultiplier = maxFontSizeMultiplier

  return mapText(React.Children.toArray(children), (child, index) => {
    return typeof child === 'string' ? (
      <TextComponent key={index} {...props} {...textProps}>
        {child}
      </TextComponent>
    ) : (
      child
    )
  })
}

function unwrapFragments(
  nodes: React.ReactNode[],
  allPrimitives = true
): [React.ReactNode[], boolean] {
  const flattened = nodes.flatMap((node: any) => {
    if (isReactFragment(node)) {
      return unwrapFragments(node.props.children || [], allPrimitives)
    }
    if (typeof node === 'string' || typeof node === 'number') {
      return node
    }
    allPrimitives = false
    return node
  })

  return [flattened, allPrimitives]
}

function mapText(
  nodes: React.ReactNode[],
  mapper: (child: React.ReactNode, index: number) => React.ReactNode
): React.ReactNode {
  const [flattened, allPrimitives] = unwrapFragments(nodes)

  if (allPrimitives) {
    return mapper(flattened.join(''), 0)
  }

  return flattened.map(mapper)
}

function isReactFragment(variableToInspect: any) {
  if (variableToInspect.type) {
    return variableToInspect.type === Fragment
  }
  return variableToInspect === Fragment
}
