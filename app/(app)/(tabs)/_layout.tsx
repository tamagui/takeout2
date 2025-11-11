import { Slot } from 'one'
import { YStack } from 'tamagui'
import { MainHeader } from '~/features/main/components/MainHeader'
import { PageContainer } from '~/interface/layout/PageContainer'

export function TabsLayout() {
  return (
    <>
      <MainHeader />
      <YStack pt={70}>
        <PageContainer py="$4" $xl={{ maxW: 760 }}>
          <Slot />
        </PageContainer>
      </YStack>
    </>
  )
}
