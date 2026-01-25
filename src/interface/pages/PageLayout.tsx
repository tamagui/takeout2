import { isWeb } from 'tamagui'

import { GradientBackground } from '../backgrounds/GradientBackground'

import type { ReactNode } from 'react'

export type PageLayoutProps = {
  children: ReactNode
  useImage?: boolean
  bottomOffset?: number
}

export const PageLayout = ({
  children,
  useImage = false,
  bottomOffset,
}: PageLayoutProps) => {
  if (!isWeb) {
    return (
      <GradientBackground
        useInsets={false}
        useImage={useImage}
        bottomOffset={bottomOffset}
      >
        {children}
      </GradientBackground>
    )
  }
  return <>{children}</>
}
