import { isWeb } from 'tamagui'

import { GradientBackground } from '../backgrounds/GradientBackground'

import type { PageLayoutProps } from './PageLayoutProps'

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
