import { Slot } from 'one'
import { SiteFooter } from '~/features/site/components/SiteFooter'
import { SiteHeader } from '~/features/site/components/SiteHeader'
import { PageContainer } from '~/interface/layout/PageContainer'

export function SiteLayout() {
  return (
    <PageContainer py="$4">
      <SiteHeader />
      <Slot />
      <SiteFooter />
    </PageContainer>
  )
}
