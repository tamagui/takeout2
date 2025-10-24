import { memo } from 'react'
import { Configuration } from 'tamagui'
import { animations } from '~/tamagui/animations'
import { animationsCSS } from '~/tamagui/animations-css'

export const AnimationDriver = memo(
  ({ name, children }: { name: 'css' | 'spring'; children: any }) => {
    return (
      <Configuration animationDriver={name === 'css' ? animationsCSS : animations}>
        {children}
      </Configuration>
    )
  }
)
