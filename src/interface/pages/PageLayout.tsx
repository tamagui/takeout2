import { isWeb } from 'tamagui'

import { GradientBackground } from '../backgrounds/GradientBackground'

import type { ReactNode } from 'react'

export type PageLayoutProps = {
  children: ReactNode
  useImage?: boolean
  bottomOffset?: number
  useInsets?: boolean
}

export const PageLayout = ({
  children,
  useImage = false,
  bottomOffset,
  useInsets = false,
}: PageLayoutProps) => {
  if (!isWeb) {
    return (
      <GradientBackground
        useInsets={useInsets}
        useImage={useImage}
        bottomOffset={bottomOffset}
      >
        {children}
      </GradientBackground>
    )
  }
  return <>{children}</>
}
