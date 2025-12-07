import { memo } from 'react'

import type { GlassViewProps } from './GlassViewProps'

// empty on web

export const GlassView = memo((props: GlassViewProps) => {
  return props.children
})
