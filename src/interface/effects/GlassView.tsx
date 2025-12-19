import { memo } from 'react'

import type { GlassViewProps } from './types'

// empty on web

export const GlassView = memo((props: GlassViewProps) => {
  return props.children
})
