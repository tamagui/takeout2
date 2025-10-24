import { lazy, memo, Suspense } from 'react'
import { SizableText } from 'tamagui'
import { useIsTopBarPopoverOpen } from '../topbar/TopBarSlidingPopover'

const DevToolsZeroContent = lazy(() =>
  import('./DevToolsZeroContent').then((module) => ({
    default: module.DevToolsZeroContent,
  }))
)

export const DevToolsZero = memo(() => {
  const isOpen = useIsTopBarPopoverOpen()

  if (!isOpen) {
    return null
  }

  return (
    <Suspense fallback={<SizableText>Loading DevTools...</SizableText>}>
      <DevToolsZeroContent />
    </Suspense>
  )
})
