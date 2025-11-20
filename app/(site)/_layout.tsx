import { Slot } from 'one'
import { SiteFooter } from '~/features/site/ui/SiteFooter'
import { SiteHeader } from '~/features/site/ui/SiteHeader'
import { PageContainer } from '~/interface/layout/PageContainer'

export function SiteLayout() {
  // NOTE: do not use redirect here for native because (app) is not in the same layout
  return (
    <>
      <SiteHeader />
      <PageContainer py="$4">
        <Slot />
      </PageContainer>
      <SiteFooter />
    </>
  )
}
