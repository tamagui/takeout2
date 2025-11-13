import { Slot } from 'one'
import { YStack } from 'tamagui'
import { MainHeader } from '~/features/main/components/MainHeader'
import { GridBackground } from '~/interface/backgrounds/GridBackground'
import { PageContainer } from '~/interface/layout/PageContainer'

export function TabsLayout() {
  return (
    <>
      <GridBackground />
      <MainHeader />
      <YStack>
        <PageContainer pt="$10" $xl={{ maxW: 760 }}>
          <Slot />
        </PageContainer>
      </YStack>
    </>
  )
}
