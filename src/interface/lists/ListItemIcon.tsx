import { cloneElement, createElement, isValidElement, useContext } from 'react'

import { ListItemContext } from './ListItemContext'

export type ListItemIconProps = {
  children?: React.ReactNode
}

export const ListItemIcon = ({ children }: ListItemIconProps) => {
  const { size } = useContext(ListItemContext)
  const iconSize = size === 'small' ? 12 : size === 'large' ? 16 : 14
  const childProps = { size: iconSize, opacity: 0.35 }

  const iconElement = children
    ? isValidElement(children)
      ? cloneElement(children, childProps)
      : createElement(children as any, childProps)
    : null

  return iconElement
}
