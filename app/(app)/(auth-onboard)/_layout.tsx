import { isNative } from '@take-out/helpers'
import { Slot } from 'one'
import { Spacer } from 'tamagui'

import { SiteHeader } from '~/features/site/ui/SiteHeader'
import { PageContainer } from '~/interface/layout/PageContainer'

export function AuthAndOnboardingLayout() {
  if (isNative) {
    return <Slot />
  }

  return (
    <>
      <SiteHeader />
      <PageContainer>
        {/* header height push down */}
        <Spacer size={70} />
        <Slot />
      </PageContainer>
    </>
  )
}
