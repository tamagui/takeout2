import { Slot } from 'one'
import { MainHeader } from '~/features/main/components/MainHeader'
import { PageContainer } from '~/interface/layout/PageContainer'

export function TabsLayout() {
  return (
    <>
      <MainHeader />
      <PageContainer py="$4" $xl={{ maxW: 760 }}>
        <Slot />
      </PageContainer>
    </>
  )
}
